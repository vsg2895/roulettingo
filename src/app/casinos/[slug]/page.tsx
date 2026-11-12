import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getCasinos, getCasino } from '@/lib/api'
import { buildCasinoReviewSchema, buildBreadcrumbSchema, buildWebPageSchema, breadcrumbIdFor, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { resolveImageUrl } from '@/lib/images'
import CasinoSpecialOffers from '@/components/CasinoSpecialOffers'
import CasinoReviews from '@/components/CasinoReviews'
import CasinoCard, { Stars } from '@/components/CasinoCard'
import { COPY } from '@/constants/copy'
import { SITE_URL } from '@/lib/config'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

/** `sizes` for the page-wide banner: the 1200px container less its 16px gutters. */
const BANNER_SIZES = '(min-width: 1232px) 1168px, calc(100vw - 2rem)'

type Props = { params: Promise<{ slug: string }> }


/*
 * NO generateStaticParams, deliberately — this route renders on demand.
 *
 * Next classifies a dynamic route from what that function RETURNS: a non-empty
 * list builds `f` (dynamic), an EMPTY list builds a fully static route. A
 * static render then throws DYNAMIC_SERVER_USAGE, because the root layout
 * reads the session cookie for the header's account control and a static
 * render may not touch cookies — taking the whole route down with a 500 for
 * every slug, valid or not.
 *
 * Not hypothetical: that is exactly how /special-offers/[slug] broke on the
 * one site with no visible offers. It was reachable here too, because the
 * params lookup failed CLOSED to an empty list, so one API blip was enough to
 * change the build shape.
 *
 * Removing the function pins the route dynamic whatever the data does.
 * `force-dynamic` is deliberately NOT used: it would also downgrade fetchCache
 * to no-store and send every request to the API, where this leaves the
 * existing per-fetch cache and its tags exactly as they were.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data: casino } = await getCasino(slug)
    const title = casino.meta_title ?? `${casino.name} Review`
    // A casino record is shared by every site, so the fallback must carry THIS
    // site's voice — otherwise all four domains ship the same description for
    // the same casino. An admin-set meta_description still wins, and is shared
    // by design; per-site overrides would need columns on the casino_site pivot.
    // An admin-entered meta_description is shared master data, so this site's
    // short signature is appended rather than the value being used verbatim —
    // otherwise filling the field in the admin would put the identical
    // description back on all four domains. No value set: fall back to the
    // site's own full line.
    const description = casino.meta_description
      ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
      : `${casino.name} — ${COPY.casinos.reviewSummary}`
    // The `title` above is the casino's own meta_title — shared master data, so
    // it is byte-identical on every domain in the network. The share card is
    // where that was most visible: six results, one headline. This site's tail
    // makes the card its own without touching the shared record.
    const shareTitle = `${title} — ${COPY.casinos.reviewTitleTail}`
    return {
      title,
      description,
      alternates: { canonical: `/casinos/${slug}` },
      openGraph: { type: 'article', url: `/casinos/${slug}`, siteName: SITE_NAME, title: shareTitle, description, images: SHARE_IMAGES },
      twitter: { card: 'summary_large_image', title: shareTitle, description, images: SHARE_IMAGES },
    }
  } catch {
    return { title: COPY.errors.notFound }
  }
}

/**
 * Resolve a TRUNCATED slug to the real one, or return null.
 *
 * Search Console reported `/casinos/7` as a 404. There is no casino "7" and
 * there never was: slugs come from the operator name via spatie/sluggable, and
 * not one of them is numeric. What does exist is `7-bit-casino` — and cutting
 * that at its first hyphen gives exactly the URL that was crawled. Email
 * clients, chat apps and some link parsers end a URL at punctuation, so a
 * hyphenated slug is the one shape that reliably arrives truncated.
 *
 * A PREFIX, and only up to the hyphen. `startsWith(fragment + '-')` means the
 * fragment has to end where a slug segment ends, so `/casinos/7` can reach
 * `7-bit-casino` but `/casinos/bit` cannot reach `bitstarz` — that would be
 * guessing at a substring rather than restoring a cut.
 *
 * EXACTLY ONE MATCH, or nothing. With `7-bit-casino` and a hypothetical
 * `7-bit-casino-vip` both present, `/casinos/7` is genuinely ambiguous and a
 * redirect would be picking one on the visitor's behalf. Ambiguity falls
 * through to the 404, which is the honest answer.
 *
 * Costs nothing on the happy path: it is only reached when `getCasino()` has
 * already failed, and `getCasinos()` is the same cached, `casinos`-tagged fetch
 * the listing and the sitemap use.
 */
async function resolveTruncatedSlug(fragment: string): Promise<string | null> {
  // A fragment that already contains a hyphen is not a cut at a segment
  // boundary — it is just a wrong slug. Bail before spending the fetch.
  if (fragment === '' || fragment.includes('-')) return null

  try {
    const { data: casinos } = await getCasinos()
    const matches = casinos.filter((c) => c.slug.startsWith(`${fragment}-`))

    return matches.length === 1 ? matches[0].slug : null
  } catch {
    // The list being unreachable must not turn a 404 into a 500.
    return null
  }
}

export default async function CasinoDetailPage({ params }: Props) {
  const { slug } = await params

  let casino
  try {
    casino = (await getCasino(slug)).data
  } catch {
    /*
     * Before 404ing, try the one recoverable case: a slug truncated at a
     * hyphen. `permanentRedirect` is a 308, not a 301 — the App Router cannot
     * set an arbitrary status from a page, and 308 is the permanent redirect
     * that preserves the method. Google treats the two identically for
     * canonicalisation, so the signal is the same one a 301 would send.
     */
    const real = await resolveTruncatedSlug(slug)

    if (real !== null) permanentRedirect(`/casinos/${real}`)

    notFound()
  }

  const banner = resolveImageUrl(casino.banner_image)
  const logo = resolveImageUrl(casino.image_path)
  const pageUrl = `${SITE_URL}/casinos/${slug}`
  // Facts for the summary panel below the CTA.
  const categoryNames = (casino.categories ?? []).map((c) => c.name)
  const liveOffers = (casino.special_offers ?? []).length
  const reviewSchema = buildCasinoReviewSchema(casino)
  const breadcrumb = buildBreadcrumbSchema(
    [
      { name: 'Home', url: SITE_URL },
      { name: 'Casinos', url: `${SITE_URL}/casinos` },
      { name: casino.name, url: pageUrl },
    ],
    pageUrl,
  )
  // One graph per page: the WebPage node anchors this URL into the site graph
  // and points at its own breadcrumb, so the review and the trail are read as
  // parts of one page rather than three unrelated blocks.
  const graph = [
    buildWebPageSchema({
      name: `${casino.name} Review`,
      url: pageUrl,
      // Same composition as the <meta> description in generateMetadata. Passing
      // the raw shared `meta_description` here put an identical WebPage
      // description on all six domains for the same casino.
      description: casino.meta_description
        ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
        : `${casino.name} — ${COPY.casinos.reviewSummary}`,
      breadcrumbId: breadcrumbIdFor(pageUrl),
      dateModified: casino.updated_at,
    }),
    breadcrumb,
    reviewSchema,
  ]

  // "More casinos for table players": the next three of this site's list.
  // The same cached, `casinos`-tagged fetch the listing uses; a failure only
  // drops the section.
  const moreCasinos = await getCasinos()
    .then(({ data }) => data.filter((c) => c.id !== casino.id).slice(0, 3))
    .catch(() => [])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main className="mx-auto max-w-[1200px] px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 pt-[22px] text-[13px] text-mute">
          <Link href="/" className="-my-3 inline-block py-3 hover:text-brand">Home</Link>/<Link href="/casinos" className="-my-3 inline-block py-3 hover:text-brand">Casinos</Link>/<span className="font-semibold text-ink">{casino.name}</span>
        </nav>

        {/* The banner, laid out as on winpalack: the artwork whole (object-contain)
            in a 16:5 frame straight under the breadcrumb, and nothing at all for
            a casino without artwork. `preload` + `fetchPriority`, not `priority`: in
            Next 16 `priority` emits the preload at the browser's default Low
            priority, and this image is the mobile LCP. */}
        {banner && (
          <div className="relative mt-4 aspect-[16/5] overflow-hidden rounded-2xl bg-sand">
            <Image src={banner} alt={`${casino.name} banner`} fill className="object-contain object-center" sizes={BANNER_SIZES} preload fetchPriority="high" />
          </div>
        )}

        {/* Name, rating, the offer and the CTA — the things a visitor came for. */}
        <header className="mt-5 flex flex-wrap items-center gap-[18px] rounded-[22px] border border-line bg-paper px-5 py-[18px] shadow-[0_18px_40px_rgba(28,36,48,0.08)]">
          {logo ? (
            <Image src={logo} alt={`${casino.name} logo`} width={192} height={144} sizes="96px" className="h-[72px] w-24 shrink-0 rounded-[14px] border border-[#ece8df] bg-white object-contain p-1.5" />
          ) : (
            <span className="grid h-[72px] w-24 shrink-0 place-items-center rounded-[14px] border border-[#ece8df] bg-white p-2 text-center font-display font-semibold">{casino.name}</span>
          )}
          <div className="min-w-0 flex-[1_1_220px]">
            <h1 className="font-display text-[28px] font-semibold text-ink sm:text-[38px]">{casino.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink-2">
              <Stars rating={casino.rating} />
              {casino.rating.toFixed(1)} · {COPY.casinos.rating}
            </div>
          </div>
          {casino.bonuses && <p className="rounded-[14px] bg-win-bg px-4 py-3 font-bold text-win">{casino.bonuses}</p>}
          <a href={casino.attachment.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-brand px-6 font-bold text-white transition-colors hover:bg-brand-dark">
            {COPY.casinos.visitCasino}
          </a>
        </header>

        <section className="mt-11" aria-labelledby="at-a-glance">
          <h2 id="at-a-glance" className="font-display text-[30px] font-semibold text-ink">
            {casino.name} {COPY.casinos.glanceHeadingTail}
          </h2>
          <dl className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
            <div className="rounded-[18px] border border-line bg-paper px-5 py-[18px]">
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{COPY.casinos.rating}</dt>
              <dd className="mt-1.5 flex items-center gap-2 text-lg font-bold text-ink"><Stars rating={casino.rating} /> {casino.rating} out of 5</dd>
            </div>
            {liveOffers > 0 && (
              <div className="rounded-[18px] border border-line bg-paper px-5 py-[18px]">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Offers listed</dt>
                <dd className="mt-1.5 text-lg font-bold text-ink">{liveOffers} {liveOffers === 1 ? 'offer' : 'offers'} on this page</dd>
              </div>
            )}
            {categoryNames.length > 0 && (
              <div className="rounded-[18px] border border-line bg-paper px-5 py-[18px]">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Listed under</dt>
                <dd className="mt-1.5 text-lg font-bold text-ink">{categoryNames.join(', ')}</dd>
              </div>
            )}
          </dl>
        </section>

        <div className="mt-10 flex flex-wrap items-start gap-8">
          <div className="min-w-0 flex-[2_1_520px]">
            {casino.description && (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">Our review</p>
                <h2 className="mb-4 mt-1.5 font-display text-[30px] font-semibold text-ink">What table players get at {casino.name}</h2>
                <div className="prose max-w-[68ch] prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-ink-2" dangerouslySetInnerHTML={{ __html: casino.description }} />
              </>
            )}

            {casino.categories && casino.categories.length > 0 && (
              <>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">Listed under</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {casino.categories.map((c) => (
                    <Link key={c.id} href={`/categories/${c.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line-soft bg-paper px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink">{c.name}</Link>
                  ))}
                </div>
              </>
            )}

            <CasinoSpecialOffers offers={casino.special_offers ?? []} />

            {/* Renders nothing until this site's "Visitor reviews" switch is on
                in the admin — the component gates itself on the endpoint's 404. */}
            <CasinoReviews casinoSlug={casino.slug} casinoName={casino.name} />
          </div>

          <aside className="min-w-0 flex-[1_1_300px] rounded-[22px] border border-line bg-paper p-[22px] lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">Quick summary</p>
            <h2 className="mt-1.5 font-display text-[22px] font-semibold text-ink">{casino.name} at a glance</h2>
            <dl className="mt-2.5">
              <div className="flex justify-between gap-3 border-b border-[#efece4] py-3 text-[15px]"><dt className="text-mute">Rating</dt><dd className="font-bold">{casino.rating.toFixed(1)} / 5</dd></div>
              {casino.bonuses && <div className="flex justify-between gap-3 border-b border-[#efece4] py-3 text-[15px]"><dt className="text-mute">Welcome offer</dt><dd className="text-right font-bold text-win">{casino.bonuses}</dd></div>}
              {liveOffers > 0 && <div className="flex justify-between gap-3 border-b border-[#efece4] py-3 text-[15px]"><dt className="text-mute">Offers listed</dt><dd className="font-bold">{liveOffers}</dd></div>}
            </dl>
            <a href={casino.attachment.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="mt-[18px] inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-6 font-bold text-white transition-colors hover:bg-brand-dark">
              {COPY.casinos.visitCasino}
            </a>
            <p className="mt-3.5 flex gap-2.5 text-[13px] leading-normal text-mute"><span className="font-bold">18+</span>T&amp;Cs apply. Check bonus contribution for roulette before you claim.</p>
          </aside>
        </div>

        {moreCasinos.length > 0 && (
          <section className="mt-14" aria-labelledby="more-casinos">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="more-casinos" className="font-display text-[30px] font-semibold text-ink">More casinos for table players</h2>
              <Link href="/casinos" className="inline-flex min-h-11 items-center font-bold text-brand-dark hover:text-brand">See all →</Link>
            </div>
            <ul className="mt-5 flex flex-col gap-3.5">
              {moreCasinos.map((c) => <CasinoCard key={c.id} casino={c} />)}
            </ul>
          </section>
        )}
      </main>
    </>
  )
}
