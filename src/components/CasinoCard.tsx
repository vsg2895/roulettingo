import Image from 'next/image'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import type { CasinoWithAttachment } from '@shared/types/casino'

export function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center tracking-[2px] ${className}`} role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-gold' : 'text-line-soft'} aria-hidden>★</span>
      ))}
    </span>
  )
}

export function GiftIcon() {
  return (
    <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" />
    </svg>
  )
}

// Roulettingo — a ranking row: the logo tile, name · rating · bonus (rank 1
// carries TOP PICK), and the two actions: Open Casino (affiliate) and Read The
// Review. The list order is the ranking; no number is printed.
export default function CasinoCard({ casino, rank }: { casino: CasinoWithAttachment; rank?: number }) {
  // The casino's "Image" (logo), not the wide banner; the banner if no logo.
  const image = resolveImageUrl(casino.image_path ?? casino.banner_image)

  return (
    <li className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-line bg-paper px-5 py-[18px] sm:gap-5">
      {image ? (
        <Image
          src={image}
          alt={casino.name}
          width={264}
          height={168}
          sizes="132px"
          className="h-16 w-24 shrink-0 rounded-[14px] border border-[#ece8df] bg-white object-contain p-1.5 sm:h-[84px] sm:w-[132px]"
        />
      ) : (
        <span className="grid h-16 w-24 shrink-0 place-items-center rounded-[14px] border border-[#ece8df] bg-white p-2 text-center font-display text-base font-semibold text-ink sm:h-[84px] sm:w-[132px] sm:text-lg">
          {casino.name}
        </span>
      )}

      <div className="min-w-0 flex-[1_1_240px]">
        <h3 className="font-display text-2xl font-semibold leading-tight text-ink">
          {casino.name}
          {rank === 1 && (
            <span className="ml-2 inline-block rounded-full bg-gold-tint px-2.5 py-1 align-middle font-sans text-[11px] font-bold tracking-[0.1em] text-gold-ink">TOP PICK</span>
          )}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink-2">
          <Stars rating={casino.rating} />
          {casino.rating.toFixed(1)}
        </div>
        {casino.bonuses && (
          <p className="mt-2.5 inline-flex items-center gap-2 rounded-[10px] bg-win-bg px-3 py-1.5 text-sm font-bold text-win">
            <GiftIcon />
            <span className="line-clamp-2">{casino.bonuses}</span>
          </p>
        )}
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-[190px] sm:flex-col sm:flex-nowrap">
        <a
          href={casino.attachment.affiliate_url}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="inline-flex min-h-[46px] flex-1 basis-[130px] items-center justify-center whitespace-nowrap rounded-xl bg-brand px-3 text-sm sm:basis-auto sm:px-4 sm:text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
        >
          {COPY.casinos.visitCasino}
        </a>
        <Link
          href={`/casinos/${casino.slug}`}
          className="inline-flex min-h-[46px] flex-1 basis-[130px] items-center justify-center whitespace-nowrap rounded-xl border border-line-soft bg-paper px-3 text-sm font-bold sm:basis-auto sm:px-4 sm:text-[15px] text-ink transition-colors hover:border-ink"
        >
          {COPY.casinos.readReview}
        </Link>
      </div>
    </li>
  )
}
