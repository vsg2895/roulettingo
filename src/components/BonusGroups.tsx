import Image from 'next/image'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import { CLAIMABLE_BONUS_CATEGORY } from '@/components/SpecialOfferCard'
import { TYPE_COLOURS } from '@/components/BonusCategoryNav'
import type { BonusSection } from '@/lib/api'
import type { SpecialOffer } from '@shared/types/specialOffer'

/** Two-letter mark for a casino with no logo: "BitStarz" → "BS", "21bit" → "21". */
function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase()
  const caps = name.match(/[A-Z0-9]/g)
  return (caps && caps.length > 1 ? caps.slice(0, 2).join('') : name.slice(0, 2)).toUpperCase()
}

function OfferRow({ offer }: { offer: SpecialOffer }) {
  const logo = resolveImageUrl(offer.casino?.image_path ?? null)
  // Claim follows the same rule as the cards: only the Special Offers type,
  // and only when the offer carries its own link. Everything else → Details.
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY && !!offer.affiliate_url

  return (
    <li className="flex items-center gap-3.5 border-t border-[#efece4] px-5 py-4">
      {logo ? (
        <Image src={logo} alt="" width={84} height={84} sizes="42px" className="h-[42px] w-[42px] shrink-0 rounded-xl border border-line bg-white object-contain p-1" />
      ) : (
        <span aria-hidden className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-line bg-white text-[13px] font-extrabold text-ink">
          {initials(offer.casino?.name ?? offer.title)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-mute">
          {[offer.casino?.name, offer.title].filter(Boolean).join(' · ')}
        </p>
        <Link href={`/special-offers/${offer.slug}`} className="block py-0.5 text-[15px] font-bold text-ink hover:text-brand">
          {offer.bonuses ?? offer.title}
        </Link>
        <span className="text-xs tracking-[2px] text-gold" aria-label={`${offer.rating} out of 5`}>
          {'★'.repeat(offer.rating)}<span className="text-line-soft">{'★'.repeat(5 - offer.rating)}</span>
        </span>
      </div>
      {claimable ? (
        <a href={offer.affiliate_url!} target="_blank" rel="nofollow sponsored noopener" className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] bg-brand px-3 text-[13px] font-bold text-white hover:bg-brand-dark">
          Claim
        </a>
      ) : (
        <Link href={`/special-offers/${offer.slug}`} aria-label={`Details: ${offer.title}`} className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] bg-brand-tint px-3 text-[13px] font-bold text-brand-dark hover:bg-[#f5dcd8]">
          Details
        </Link>
      )}
    </li>
  )
}

/**
 * The home page's Bonuses: one card per bonus type, its first offers as rows
 * and a "See more" link to /bonuses/<slug>. Each card keeps the
 * `#bonus-<slug>` anchor the menus link to.
 */
export default function BonusGroups({ sections }: { sections: BonusSection[] }) {
  return (
    <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
      {sections.map((section, i) => (
        <div key={section.id} id={`bonus-${section.slug}`} className="flex scroll-mt-24 flex-col overflow-hidden rounded-[22px] border border-line bg-paper">
          <h3 className="px-5 py-[18px] font-display text-[22px] font-semibold text-white" style={{ background: TYPE_COLOURS[i % TYPE_COLOURS.length] }}>
            <Link href={`/bonuses/${section.slug}`} className="hover:underline">{section.name}</Link>
          </h3>
          {section.description && <p className="px-5 pt-3 text-sm text-ink-2">{section.description}</p>}
          <ul role="list" className={section.description ? 'mt-3' : ''}>
            {section.offers.map((offer) => <OfferRow key={offer.id} offer={offer} />)}
          </ul>
          <Link
            href={`/bonuses/${section.slug}`}
            aria-label={`${COPY.home.seeMore} — ${section.name}`}
            className="mt-auto border-t border-[#efece4] px-5 py-3.5 text-sm font-bold text-ink hover:text-brand"
          >
            {COPY.home.seeMore} →
          </Link>
        </div>
      ))}
    </div>
  )
}
