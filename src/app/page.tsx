import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBonusArea, getCategories, getCategory, getSpecialOffers } from '@/lib/api'
import type { BonusSection } from '@/lib/api'
import { buildItemListSchema, buildWebPageSchema, jsonLdScript, buildFaqSchema, SHARE_IMAGES } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { FAQ_ITEMS } from '@/constants/faq'
import CasinoCard from '@/components/CasinoCard'
import BonusCategoryNav from '@/components/BonusCategoryNav'
import BonusGroups from '@/components/BonusGroups'
import Image from 'next/image'
import { resolveImageUrl } from '@/lib/images'
import CategoryNav from '@/components/CategoryNav'
import SpecialOfferCard from '@/components/SpecialOfferCard'
import type { Category } from '@shared/types/category'
import type { CasinoWithAttachment } from '@shared/types/casino'
import type { SpecialOffer } from '@shared/types/specialOffer'
import { SITE_URL } from '@/lib/config'
import { casinosHeading } from '@/lib/categories'

/** Offers shown per bonus type in the home page's Bonuses section — one row. */
const HOME_BONUSES_PER_CATEGORY = 3

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''
const YEAR = new Date().getFullYear()

type Props = { searchParams: Promise<{ category?: string; page?: string }> }

// Resolve the selected category (default = first/highest-priority) for the home casinos section.
async function resolveCategory(searchParams: Props['searchParams']) {
  const sp = await searchParams
  const categories = (await getCategories()).data
  const selected =
    sp.category && categories.some((c) => c.slug === sp.category) ? sp.category : categories[0]?.slug
  return { categories: categories as Category[], selected }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `${COPY.home.homeTitle} ${YEAR} | ${SITE_NAME}`
  const description = COPY.home.metaDescription
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', url: '/', siteName: SITE_NAME, title, description, images: SHARE_IMAGES },
    twitter: { card: 'summary_large_image', title, description, images: SHARE_IMAGES },
  }
}

export default async function HomePage({ searchParams }: Props) {
  /*
   * THE HOME PAGE HAS ONE PAGE, so `?page=2` is a page past the end.
   *
   * Nothing here is paginated (the full list is /casinos), yet `/?page=2` and
   * every other number a crawler guessed answered 200 with the whole home page
   * and an `index` robots tag: a duplicate of `/` at a URL of its own. A 404
   * says it is not a page at all, the rule every paginated listing here applies
   * past its last page. `?page=1` never reaches this: proxy.ts 301s it to `/`.
   */
  if (Math.max(1, Number((await searchParams).page) || 1) > 1) notFound()

  const { categories, selected } = await resolveCategory(searchParams)

  const [categoryRes, offersRes, anyOffersRes, bonusRes] = await Promise.allSettled([
    selected ? getCategory(selected) : Promise.resolve(null),
    getSpecialOffers(selected, 6),
    // Site-wide, unfiltered, limit 1 — just "does a visible offer exist at all?".
    // Runs alongside the others, so it costs no extra round-trip of latency, and
    // the public endpoint already excludes offers whose visibility is off.
    getSpecialOffers(undefined, 1),
    // The bonus TYPES: the chip row under the hero AND the per-type Bonuses
    // section further down, so each type brings its first
    // HOME_BONUSES_PER_CATEGORY offers (one full row of the three-up grid).
    // The chips only read names, marks and counts, which the server counts
    // over the unlimited set. allSettled means a site without the Bonus area
    // renders neither, and falls back to the plain Special offers grid.
    getBonusArea(HOME_BONUSES_PER_CATEGORY),
  ])

  // Empty when the site does not publish the Bonus area, or when the
  // request failed — the strip renders nothing either way.
  const bonusSections: BonusSection[] = bonusRes.status === 'fulfilled' ? bonusRes.value : []

  const catData =
    categoryRes.status === 'fulfilled' && categoryRes.value ? categoryRes.value.data : null
  const casinos: CasinoWithAttachment[] = catData?.casinos ?? []
  const activeCategory = catData?.category ?? null
  // "See More" is only an affordance when there is actually more: compare the
  // category's full count against the rows this page received, rather than
  // hard-coding the page size on both sides where the two could drift apart.
  const hasMoreCasinos = (catData?.meta?.total ?? 0) > casinos.length
  // Offers are already scoped to the selected category and capped by the backend (?category=&limit=).
  const topOffers: SpecialOffer[] = offersRes.status === 'fulfilled' ? offersRes.value.data : []

  // Whether ANY special offer is visible on this site. Drives the hero CTA:
  // a button leading to an empty page is worse than no button. On a failed
  // request this stays false, so the CTA hides rather than promising content
  // that may not be there.
  const anyOffersVisible: boolean =
    anyOffersRes.status === 'fulfilled' && anyOffersRes.value.data.length > 0

  // Organization schema is emitted site-wide from the root layout; the home
  // page only adds its page-specific ItemList of top casinos.
  //
  // The list is the SELECTED category, not the whole catalogue, so it is named
  // and addressed as that category — it previously claimed the generic name
  // "Top Casinos at <brand>" and pointed at /casinos, describing neither the
  // rows below it nor a URL that renders them.
  const listSchema = buildItemListSchema(
    activeCategory ? `${activeCategory.name} — ${COPY.home.topCasinosTitle}` : COPY.home.topCasinosTitle,
    selected ? `${SITE_URL}/categories/${selected}` : `${SITE_URL}/casinos`,
    casinos.map((c, i) => ({ position: i + 1, name: c.name, url: `${SITE_URL}/casinos/${c.slug}` })),
  )

  const graph = [
    buildWebPageSchema({
      // Mirrors the actual <title>. The previous "Best Online Casinos <year>"
      // was generic boilerplate shipped identically by the sibling domains and
      // matched neither this page's title nor its H1.
      name: `${COPY.home.homeTitle} ${YEAR}`,
      url: SITE_URL,
      description: COPY.home.metaDescription,
    }),
    listSchema,
    // Same array the section below renders — markup-only FAQ is a violation.
    buildFaqSchema(SITE_URL, FAQ_ITEMS),
  ]

  // Hero figures, all from data this page already holds.
  const offerCount = bonusSections.reduce((n, s) => n + s.offers_count, 0)
  const typeCount = bonusSections.filter((s) => s.slug !== 'special-offers').length
  const heroStats = [
    { value: catData?.meta?.total ?? casinos.length, label: 'casinos ranked' },
    { value: offerCount, label: 'live bonus offers' },
    { value: typeCount, label: 'bonus types' },
  ].filter((s) => s.value > 0)
  const pick = casinos[0]
  const pickLogo = pick ? resolveImageUrl(pick.image_path ?? pick.banner_image) : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main>
        {/* Hero: the pitch on the left, the spinning wheel and the editor's pick on the right. */}
        <section>
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-4 pb-14 pt-12 sm:pt-16">
            <div className="min-w-0 flex-[1_1_480px]">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e3b8b3] bg-brand-tint px-3.5 py-[7px] text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">
                <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-brand" />
                {COPY.home.heroEyebrow}
              </p>
              <h1 className="mt-[22px] font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.01em] text-balance text-ink sm:text-[56px] lg:text-[66px]">
                {COPY.home.heroHeadline} <em className="font-medium text-brand">{COPY.home.heroHighlight}</em>
              </h1>
              <p className="mt-5 max-w-[540px] text-lg text-ink-2">{COPY.home.heroSubtitle}</p>
              <div className="mt-[30px] flex flex-wrap gap-3">
                <Link href="/casinos" className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-brand px-6 font-bold text-white transition-colors hover:bg-brand-dark">
                  {COPY.home.featuredCasinos}
                  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
                {anyOffersVisible && (
                  <Link href="/special-offers" className="inline-flex min-h-12 items-center justify-center rounded-full border border-line-soft bg-paper px-6 font-bold text-ink transition-colors hover:border-ink">
                    {COPY.home.specialOffers}
                  </Link>
                )}
              </div>
              {heroStats.length > 0 && (
                <dl className="mt-9 grid max-w-[540px] grid-cols-3 gap-3">
                  {heroStats.map((s, i) => (
                    <div key={s.label} className="flex flex-col-reverse justify-end gap-1 rounded-2xl border border-line bg-paper px-4 py-4 shadow-[0_10px_24px_rgba(28,36,48,0.06)]">
                      <dt className="text-[13px] leading-tight text-mute">{s.label}</dt>
                      <dd className={`font-display text-[32px] font-semibold leading-none ${['text-brand', 'text-win', 'text-gold-ink'][i % 3]}`}>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* Badge above the wheel, the editor's pick below it — neither covers the wheel. */}
            <div className="flex flex-[1_1_360px] flex-col items-center gap-5">
              <p className="flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[13px] font-semibold text-ink shadow-[0_14px_30px_rgba(28,36,48,0.10)]">
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f5a44" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Payouts verified
              </p>
              <div aria-hidden className="rt-wheel h-[min(340px,78vw)] w-[min(340px,78vw)] shrink-0"><div><div><div /></div></div></div>
              {pick && (
                <Link href={`/casinos/${pick.slug}`} className="flex max-w-full items-center gap-3 rounded-[18px] border border-line bg-paper px-4 py-3.5 text-ink shadow-[0_14px_30px_rgba(28,36,48,0.10)] transition-colors hover:border-ink">
                  {pickLogo ? (
                    <Image src={pickLogo} alt="" width={92} height={92} sizes="46px" className="h-[46px] w-[46px] shrink-0 rounded-xl border border-line bg-white object-contain p-1" />
                  ) : (
                    <span aria-hidden className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-ink text-sm font-extrabold text-white">{pick.name.slice(0, 2).toUpperCase()}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-brand-dark">Editor&apos;s pick</span>
                    <b className="block">{pick.name}</b>
                    {pick.bonuses && <span className="block truncate text-[13px] font-bold text-win">{pick.bonuses}</span>}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* The ranking: the selected category's casinos. */}
        <section id="rank" className="py-16" aria-labelledby="top-casinos-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">The ranking</p>
                <h2 id="top-casinos-heading" className="mt-1.5 font-display text-[30px] font-semibold text-ink sm:text-[44px]">{COPY.home.topCasinosTitle}</h2>
                <p className="mt-2 text-ink-2">{COPY.home.topCasinosSubtitle}</p>
              </div>
            </div>

            {categories.length > 0 && selected && (
              <div className="mt-6"><CategoryNav categories={categories} selected={selected} /></div>
            )}

            {casinos.length === 0 ? (
              <p className="mt-6 text-mute">{COPY.casinos.noResults}</p>
            ) : (
              <ol className="mt-5 flex flex-col gap-3.5">
                {casinos.map((casino, i) => <CasinoCard key={casino.id} casino={casino} rank={i + 1} />)}
              </ol>
            )}

            {activeCategory && hasMoreCasinos && (
              <div className="mt-7 flex justify-center">
                <Link href={`/categories/${selected}`} aria-label={`See More Casinos: ${casinosHeading(activeCategory.name)}`} className="inline-flex min-h-12 items-center rounded-full border border-line-soft bg-paper px-6 font-bold text-ink transition-colors hover:border-ink">
                  See More Casinos →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Bonus types: one tile per type. Collapses when the site has no Bonus area. */}
        {bonusSections.length > 0 && (
          <section className="py-6">
            <div className="mx-auto max-w-[1200px] px-4">
              {/* A tinted panel of its own: the wheel's red and gold washed over cream. */}
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#f7e3df_0%,#f4ecdd_55%,#e6efe9_100%)] px-5 py-8 sm:px-8 sm:py-10">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(179,56,47,0.18),transparent_70%)]" />
                <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(217,162,27,0.20),transparent_70%)]" />
                <div className="relative">
                  <BonusCategoryNav sections={bonusSections} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bonuses: a card per bonus type. A site without the Bonus area keeps
            the flat offers grid instead. */}
        {bonusSections.length > 0 ? (
          <section className="py-16" aria-labelledby="bonus-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="bonus-heading" className="font-display text-[30px] font-semibold text-ink sm:text-[44px]">{COPY.home.bonus}</h2>
                <Link href="/special-offers" aria-label={`${COPY.home.viewAll} bonuses`} className="inline-flex min-h-11 items-center font-bold text-brand-dark hover:text-brand">{COPY.home.viewAll} →</Link>
              </div>
              <BonusGroups sections={bonusSections} />
            </div>
          </section>
        ) : topOffers.length > 0 && (
          <section className="py-16" aria-labelledby="offers-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="offers-heading" className="font-display text-[30px] font-semibold text-ink sm:text-[44px]">{COPY.home.specialOffers}</h2>
                <Link href="/special-offers" aria-label={`${COPY.home.viewAll} special offers`} className="inline-flex min-h-11 items-center font-bold text-brand-dark hover:text-brand">{COPY.home.viewAll} →</Link>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {topOffers.map((offer) => <SpecialOfferCard key={offer.id} offer={offer} />)}
              </div>
            </div>
          </section>
        )}

        {/* FAQ — rendered visibly because FAQPage structured data requires it
            (same FAQ_ITEMS array as the schema above). */}
        <section className="pb-16 pt-4" aria-labelledby="faq-heading">
          <div className="mx-auto flex max-w-[1200px] flex-wrap gap-10 px-4">
            <div className="flex-[1_1_280px]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">FAQ</p>
              <h2 id="faq-heading" className="mt-2 font-display text-[32px] font-semibold leading-[1.05] text-ink sm:text-[44px]">
                {COPY.home.faqTitle.replace(/,?\s*Answered$/, ',')} <em className="font-medium text-brand">Answered</em>
              </h2>
              <p className="mt-4 text-ink-2">Straight answers on variants, bonus contribution, limits and withdrawals.</p>
            </div>
            <div className="rt-faq flex min-w-0 flex-[2_1_520px] flex-col gap-2.5">
              {FAQ_ITEMS.map((item, i) => (
                <details key={item.question} open={i === 0} className="rounded-2xl border border-line bg-paper px-[22px]">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-5 text-[17px] font-bold text-ink">{item.question}</summary>
                  <p className="mb-5 text-[15px] leading-[1.65] text-ink-2">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
