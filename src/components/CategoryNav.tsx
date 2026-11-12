import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import type { Category } from '@shared/types/category'

/**
 * Roulettingo category selector — pill chips; the current category is the
 * dark chip with a red count badge. *
 * On a phone the chips stack, one per row, each the full width of the column;
 * from sm they are one row of EQUAL chips — `w-max` + `1fr` columns, so every
 * track resolves to the widest label — scrolling sideways in its own track if
 * the row is wider than the page.
 * Mounted on the home page and on the casinos listing.
 *
 * The chips NAVIGATE rather than filter in place: always the canonical
 * /categories/<slug> route. The query forms (`/?category=`,
 * `/casinos?category=`) are 301'd to it at the edge (lib/seo/redirects.ts), so
 * linking either would spend a redirect per visitor and crawl budget on URLs
 * that resolve elsewhere.
 */
export default function CategoryNav({
  categories,
  selected,
}: {
  categories: Category[]
  selected: string
}) {
  return (
    <nav aria-label="Casino categories" className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-1.5">
      <ul className="grid grid-cols-1 gap-2 sm:w-max sm:auto-cols-[1fr] sm:grid-flow-col sm:grid-cols-none" role="list">
        {categories.map((c) => {
          const active = c.slug === selected
          return (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-line-soft bg-paper text-ink hover:border-ink'
                }`}
              >
                {/* The category's own icon, as in the Casinos menu. A plain <img>:
                    next/image refuses SVG. alt="" because the label names it. */}
                {c.logo_path && (
                  <img src={resolveImageUrl(c.logo_path)!} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0" />
                )}
                {c.name}
                {typeof c.casinos_count === 'number' && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand text-white' : 'bg-[#f1eee6] text-mute'}`}>
                    {c.casinos_count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
