import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpecialOffer, getBonusCategory } from '@/lib/api'
import { buildBreadcrumbSchema, buildWebPageSchema, breadcrumbIdFor, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { resolveImageUrl } from '@/lib/images'
import BonusTerms from '@/components/BonusTerms'
import { Stars } from '@/components/CasinoCard'
import { CLAIMABLE_BONUS_CATEGORY } from '@/components/SpecialOfferCard'
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

/**
 * The offer's own prose, as plain text — the field an editor actually writes.
 *
 * Measured on the live data before this existed: 18 of 29 offers carry no
 * `bonuses` value, and `bonuses` is a column on the GLOBAL `special_offers`
 * row — identical across every domain in the network, with only 8 distinct
 * values across 29 offers. Composed from it, every thin offer's meta
 * description came out as its title plus one sentence repeated on every sibling
 * page. `description` is the only one of the three that is unique per offer.
 */
function plainDescription(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Trimmed at a word boundary to the ~155 characters Google renders. */
function metaLength(text: string): string {
  return text.length <= 155 ? text : `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data: offer } = await getSpecialOffer(slug)
    // This site's meta title / description, when the admin or the SEO seeder
    // set one (the API already resolves the site's own override over the
    // offer's default); otherwise the composed fallbacks below.
    const title = offer.meta_title?.trim() || offer.title
    /*
     * The written description first; the `bonuses` composition only as a
     * fallback for an offer nobody has written up yet — a content gap this file
     * cannot close, not something to paper over with longer boilerplate.
     */
    const prose = plainDescription(offer.description)
    const metaDescription = offer.meta_description?.trim() ?? ''
    const description = metaDescription !== ''
      ? metaLength(metaDescription)
      : prose !== ''
        ? metaLength(prose)
        : offer.bonuses
          ? `${offer.bonuses} — ${COPY.specialOffers.offerMetaSuffix}`
          : `${offer.title} — ${COPY.specialOffers.offerMetaSuffix}`
    return {
      title,
      description,
      alternates: { canonical: `/special-offers/${slug}` },
      openGraph: { type: 'article', url: `/special-offers/${slug}`, siteName: SITE_NAME, title, description, images: SHARE_IMAGES },
      // A hidden offer stays reachable by direct link so it can be reviewed,
      // but it must never enter the index. It is already absent from every
      // listing and from the sitemap; this stops a crawler that finds the URL
      // some other way (a shared link, a referrer) from indexing it.
      /*
       * TWO distinct gates.
       *
       * `!active` is the hard one: the offer is withdrawn, the page exists only
       * so an old link does not 404, and `follow: false` keeps it from passing
       * anything onward.
       *
       * `is_indexable` is the editorial one (SpecialOffer::isIndexable): true
       * unless an admin set noindex on this offer. Every other offer page is
       * indexed. `follow` stays true on a noindexed one: its casino and
       * category links are still worth following.
       *
       * The same flag filters the sitemap, so the two can never disagree.
       */
      ...(!offer.active
        ? { robots: { index: false, follow: false } }
        : offer.is_indexable === false
          ? { robots: { index: false, follow: true } }
          : {}),
    }
  } catch {
    return { title: COPY.errors.notFound }
  }
}

export default async function SpecialOfferDetailPage({ params }: Props) {
  const { slug } = await params

  let offer
  try {
    offer = (await getSpecialOffer(slug)).data
  } catch {
    notFound()
  }

  const banner = resolveImageUrl(offer.banner_image ?? offer.image_path)
  // The same rule the cards use: Claim is a property of the bonus TYPE.
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY
  const pageUrl = `${SITE_URL}/special-offers/${slug}`
  const breadcrumb = buildBreadcrumbSchema(
    [
      { name: 'Home', url: SITE_URL },
      { name: 'Special Offers', url: `${SITE_URL}/special-offers` },
      { name: offer.title, url: pageUrl },
    ],
    pageUrl,
  )
  /*
   * `Offer`, and deliberately NOT `SpecialAnnouncement`.
   *
   * SpecialAnnouncement is scoped to public-health and emergency notices;
   * applying it to a casino bonus is schema misuse that risks a manual action
   * rather than a rich result. `Offer` is the type that describes a promotion.
   *
   * ONLY FIELDS WE ACTUALLY HOLD. No `price`, no `priceCurrency`, no
   * `availabilityEnds` — this API exposes none of them, and an Offer carrying an
   * invented figure is worse than no Offer at all. `bonuses` gets no property of
   * its own either: it reads like "100% up to €500", and the Offer properties
   * that take a figure expect a number or a PriceSpecification, not a sentence.
   */
  const offerProse = plainDescription(offer.description)
  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: offer.title,
    url: pageUrl,
    ...(offerProse !== ''
      ? { description: offerProse }
      : offer.bonuses
        ? { description: offer.bonuses }
        : {}),
    ...(offer.casino?.name
      ? { offeredBy: { '@type': 'Organization', name: offer.casino.name } }
      : {}),
    ...(offer.bonus_category_name ? { category: offer.bonus_category_name } : {}),
  }

  const graph = [
    buildWebPageSchema({
      name: offer.title,
      url: pageUrl,
      // The prose, not the shared `bonuses` line that is identical network-wide.
      description: offerProse !== '' ? offerProse : (offer.bonuses ?? undefined),
      breadcrumbId: breadcrumbIdFor(pageUrl),
      dateModified: offer.updated_at,
    }),
    breadcrumb,
    offerSchema,
  ]

  // Only an offer that is not expired, of the claimable type and with its own
  // link gets the Claim button — the same rule as before, in one place.
  const showClaim = !offer.terms?.expired && claimable && !!offer.affiliate_url
  const facts: Array<[string, string]> = (
    [
      ['Bonus', offer.bonuses],
      ['Wagering', offer.terms?.wagering_requirement ?? null],
      ['Min deposit', offer.terms?.min_deposit ?? null],
    ] as Array<[string, string | null]>
  ).filter((f): f is [string, string] => !!f[1]?.trim())

  // "More <type>": other offers of the same bonus type, from the same cached
  // endpoint /bonuses/<slug> renders. A failure only drops the section.
  const moreOffers = offer.bonus_category_slug
    ? ((await getBonusCategory(offer.bonus_category_slug))?.offers ?? []).filter((o) => o.id !== offer.id).slice(0, 3)
    : []

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main className="mx-auto max-w-[1200px] px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 pt-[22px] text-[13px] text-mute">
          <Link href="/" className="-my-3 inline-block py-3 hover:text-brand">Home</Link>/<Link href="/special-offers" className="-my-3 inline-block py-3 hover:text-brand">Special Offers</Link>/<span className="font-semibold text-ink">{offer.title}</span>
        </nav>

        {/* The banner, laid out as on winpalack: the artwork whole (object-contain)
            in a 16:6 frame straight under the breadcrumb, and nothing at all for
            an offer without artwork. `preload` + `fetchPriority`, not `priority`: in
            Next 16 `priority` emits the preload at the browser's default Low
            priority, and this image is the mobile LCP. */}
        {banner && (
          <div className="relative mt-4 aspect-[16/6] overflow-hidden rounded-2xl bg-sand">
            <Image src={banner} alt={offer.title} fill className="object-contain object-center" sizes={BANNER_SIZES} preload fetchPriority="high" />
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-start gap-8">
          <div className="min-w-0 flex-[2_1_520px]">
            {offer.bonus_category_name && (
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e3b8b3] bg-brand-tint px-3.5 py-[7px] text-xs font-bold uppercase tracking-[0.12em] text-brand-dark">
                <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-brand" />
                {offer.bonus_category_name}
              </p>
            )}
            <h1 className="mt-4 font-display text-[30px] font-semibold leading-[1.08] text-ink sm:text-[46px]">{offer.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-2">
              <Stars rating={offer.rating} />
              {offer.rating.toFixed(1)}
              {offer.casino && (
                <> · Offer by <Link href={`/casinos/${offer.casino.slug}`} className="font-bold text-brand-dark hover:text-brand">{offer.casino.name}</Link></>
              )}
            </div>

            {facts.length > 0 && (
              <dl className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3.5">
                {facts.map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-line bg-paper px-5 py-[18px]">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</dt>
                    <dd className={`mt-1.5 text-lg font-bold ${label === 'Bonus' ? 'text-win' : 'text-ink'}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {offer.description && (
              <>
                <h2 className="mb-3.5 mt-10 font-display text-[28px] font-semibold text-ink">About this offer</h2>
                <div className="prose max-w-[68ch] prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-ink-2" dangerouslySetInnerHTML={{ __html: offer.description }} />
              </>
            )}

            {showClaim && (
              <>
                <h2 className="mb-3.5 mt-9 font-display text-[28px] font-semibold text-ink">How to claim</h2>
                <ol className="list-decimal pl-[22px] text-[17px] leading-[1.8] text-ink-2">
                  <li>Open {offer.casino?.name ?? 'the casino'} with the button on this page.</li>
                  <li>Finish registration and verify your account.</li>
                  <li>Check the terms, then claim the offer as the casino describes it.</li>
                </ol>
              </>
            )}
          </div>

          <aside className="min-w-0 flex-[1_1_300px] rounded-[22px] border border-line bg-paper p-[22px] lg:sticky lg:top-24" aria-labelledby="bonus-terms">
            <h2 id="bonus-terms" className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">Before you claim</h2>
            {offer.terms && <BonusTerms terms={offer.terms} />}
            {offer.casino && (
              <div className="flex justify-between gap-3 border-b border-[#efece4] py-3 text-[15px]">
                <span className="text-mute">Offer by</span>
                <b>{offer.casino.name}</b>
              </div>
            )}

            {/* An EXPIRED offer keeps its page (old links still resolve, the
                terms stay readable) but is never presented as claimable: the
                CTA is replaced with a plain statement. */}
            {offer.terms?.expired ? (
              <p className="mt-[18px] rounded-xl border border-line bg-cream px-4 py-3 text-sm font-medium text-ink-2">
                This offer ended
                {offer.terms.expires_at ? (
                  <> on <time dateTime={offer.terms.expires_at}>{offer.terms.expires_at}</time></>
                ) : null}
                . It is no longer available to claim.{' '}
                <Link href="/special-offers" className="underline underline-offset-4 hover:text-brand">
                  See current offers
                </Link>
              </p>
            ) : (
              // Claim belongs to the Special Offers bonus type, matching the
              // cards — see CLAIMABLE_BONUS_CATEGORY in SpecialOfferCard.
              showClaim && (
                <a href={offer.affiliate_url!} target="_blank" rel="nofollow sponsored noopener" className="mt-[18px] inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-6 font-bold text-white transition-colors hover:bg-brand-dark">
                  {COPY.specialOffers.claim}
                </a>
              )
            )}
            {offer.casino && (
              <Link href={`/casinos/${offer.casino.slug}`} className="mt-2.5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line-soft bg-paper px-6 font-bold text-ink transition-colors hover:border-ink">
                Read the full review →
              </Link>
            )}
            <p className="mt-3.5 flex gap-2.5 text-[13px] leading-normal text-mute"><span className="font-bold">18+</span>Gamble responsibly. Check how the offer counts on table games before you claim.</p>
          </aside>
        </div>

        {moreOffers.length > 0 && offer.bonus_category_slug && (
          <section className="mt-14" aria-labelledby="more-offers">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="more-offers" className="font-display text-[30px] font-semibold text-ink">More {offer.bonus_category_name ?? 'offers'}</h2>
              <Link href={`/bonuses/${offer.bonus_category_slug}`} className="inline-flex min-h-11 items-center font-bold text-brand-dark hover:text-brand">Show all →</Link>
            </div>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
              {moreOffers.map((o) => (
                <Link key={o.id} href={`/special-offers/${o.slug}`} className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-paper p-5 text-ink transition-colors hover:border-ink">
                  {o.casino?.name && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-dark">{o.casino.name}</span>}
                  <span className="font-display text-[22px] font-semibold">{o.title}</span>
                  {o.bonuses && <span className="text-sm text-ink-2">{o.bonuses}</span>}
                  <span className="mt-2 text-sm font-bold text-brand-dark">View offer →</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
