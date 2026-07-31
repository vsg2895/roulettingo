import Link from 'next/link'

// Roulettingo design: warm pagination with a crimson active page.
export default function Pagination({ basePath, current, last }: { basePath: string; current: number; last: number }) {
  if (last <= 1) return null

  const pages = Array.from({ length: last }, (_, i) => i + 1)
  const link = (p: number) => `${basePath}&page=${p}`
  const base = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors'
  const idle = 'border border-line-soft bg-paper text-ink hover:border-brand hover:text-brand'

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {current > 1 && (
        <Link href={link(current - 1)} className={`${base} ${idle}`} rel="prev">‹ Prev</Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={link(p)}
          aria-current={p === current ? 'page' : undefined}
          className={`${base} ${p === current ? 'bg-gradient-to-b from-brand-soft to-brand-dark text-white shadow-md shadow-brand/25' : idle}`}
        >
          {p}
        </Link>
      ))}
      {current < last && (
        <Link href={link(current + 1)} className={`${base} ${idle}`} rel="next">Next ›</Link>
      )}
    </nav>
  )
}
