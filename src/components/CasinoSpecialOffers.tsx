'use client'

import { useState } from 'react'
import Link from 'next/link'
import { COPY } from '@/constants/copy'
import type { SpecialOffer } from '@shared/types/specialOffer'

const PER_PAGE = 4

/**
 * A casino's attached special offers, shown 4 at a time with the total count.
 * When there are more than 4, client-side pagination pages through them (the
 * offers already arrive with the casino, so no extra fetch is needed).
 */
export default function CasinoSpecialOffers({ offers }: { offers: SpecialOffer[] }) {
  const [page, setPage] = useState(0)

  // The API may serialize an empty relation as {} rather than []; guard for it
  // so a casino with no offers doesn't crash (offers.slice is not a function).
  const list = Array.isArray(offers) ? offers : []
  const total = list.length
  if (total === 0) return null

  const pageCount = Math.ceil(total / PER_PAGE)
  const start = page * PER_PAGE
  const visible = list.slice(start, start + PER_PAGE)

  return (
    <section className="mt-11">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="min-w-0 font-display text-[30px] font-semibold text-ink">
          {COPY.casinos.offersHeading} ({total})
        </h2>
        {pageCount > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous offers"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-soft text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line-soft disabled:hover:text-muted"
            >
              ←
            </button>
            {/* `whitespace-nowrap`, and it is load-bearing: in a flex row next
                to a heading this is three tokens ("1", "/", "2"), and a long
                heading squeezed it into three stacked lines between the two
                arrows. The counter is one word, so it is told to behave like
                one. */}
            <span className="whitespace-nowrap text-sm tabular-nums text-muted">{page + 1} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              aria-label="More offers"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-soft text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line-soft disabled:hover:text-muted"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
        {visible.map((offer) => (
          <Link
            key={offer.id}
            href={`/special-offers/${offer.slug}`}
            className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-paper p-5 text-ink transition-colors hover:border-ink"
          >
            {/* The bonus TYPE, as the editor named it; an unfiled offer shows none. */}
            {offer.bonus_category_name && (
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-dark">{offer.bonus_category_name}</span>
            )}
            <span className="font-display text-[22px] font-semibold">{offer.title}</span>
            {offer.bonuses && <span className="line-clamp-2 text-sm text-ink-2">{offer.bonuses}</span>}
            <span className="mt-2 text-sm font-bold text-brand-dark">View offer →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
