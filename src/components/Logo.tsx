import Link from 'next/link'

/**
 * Roulettingo brand logo: a roulette-wheel emblem (conic segments of crimson +
 * navy around a gold-pip hub) next to the "Roulettingo" wordmark and the
 * "SPIN SMARTER" tagline. Inlined markup so it renders instantly, scales
 * crisply, and needs no extra request. The Link carries the accessible name;
 * the artwork is aria-hidden to avoid a duplicate announcement.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Roulettingo home"
      className={`inline-flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`.trim()}
    >
      {/* Roulette-wheel emblem */}
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-md shadow-ink/25"
        style={{
          background:
            'conic-gradient(#b3382f 0 45deg, #1c2430 45deg 90deg, #b3382f 90deg 135deg, #1c2430 135deg 180deg, #b3382f 180deg 225deg, #1c2430 225deg 270deg, #b3382f 270deg 315deg, #1c2430 315deg 360deg)',
        }}
      >
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-cream">
          <span className="h-[7px] w-[7px] rounded-full bg-gold" />
        </span>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[22px] font-bold tracking-tight text-ink">
          Roulett<span className="text-brand">ingo</span>
        </span>
        <span className="mt-[3px] text-[10px] font-medium tracking-[0.25em] text-faint">SPIN SMARTER</span>
      </span>
    </Link>
  )
}
