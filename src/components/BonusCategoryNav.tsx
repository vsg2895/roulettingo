import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import type { BonusSection } from '@/lib/api'

/**
 * The catch-all type. "Special Offers" is every offer, which /special-offers
 * already lists, so it gets no tile of its own.
 */
const CATCH_ALL_SLUG = 'special-offers'

/** Tile colours, in order: the wheel's red, felt green, gold, ink, then two extras. */
export const TYPE_COLOURS = ['#b3382f', '#1f5a44', '#8a6410', '#1c2430', '#2b4c8c', '#7a3fa0']

/**
 * "Browse By Bonus Type" — one tile per bonus type with a visible offer on this
 * site, each linking to /bonuses/<slug>. Built from the same getBonusArea
 * payload as the header/footer Bonuses menus, so no tile points at a type the
 * menu lacks.
 */
export default function BonusCategoryNav({ sections }: { sections: BonusSection[] }) {
  const types = sections.filter((section) => section.slug !== CATCH_ALL_SLUG)

  if (types.length === 0) return null

  return (
    <nav aria-labelledby="bonus-types-heading">
      <h2 id="bonus-types-heading" className="font-display text-[26px] font-semibold text-ink sm:text-[32px]">
        {COPY.home.bonusTypesTitle}
      </h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-[repeat(auto-fit,minmax(118px,1fr))]" role="list">
        {types.map((section, i) => {
          const icon = resolveImageUrl(section.icon_path)
          return (
            <li key={section.id}>
              <Link
                href={`/bonuses/${section.slug}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-white/80 bg-paper p-4 text-ink shadow-[0_8px_20px_rgba(28,36,48,0.06)] transition-colors hover:border-ink"
              >
                {icon ? (
                  // A plain <img>: next/image refuses SVG. alt="" — the name follows.
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f3f1eb]">
                    <img src={icon} alt="" width={20} height={20} className="h-5 w-5" />
                  </span>
                ) : (
                  <span aria-hidden className="grid h-9 w-9 place-items-center rounded-[10px] font-extrabold text-white" style={{ background: TYPE_COLOURS[i % TYPE_COLOURS.length] }}>
                    {section.name.charAt(0)}
                  </span>
                )}
                <span className="text-[15px] font-bold leading-snug">{section.name}</span>
                {/* mt-auto pins the count to the tile's bottom edge, so every count
                    in the row lines up whether the name above takes one line or two. */}
                <span className="mt-auto text-xs text-mute">
                  {section.offers_count} {section.offers_count === 1 ? 'offer' : 'offers'} →
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
