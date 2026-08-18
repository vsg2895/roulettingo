/**
 * Frequently asked questions for this site.
 *
 * Rendered VISIBLY on the home page and emitted as FAQPage structured data from
 * this same array. Google requires the two to match; markup-only FAQ is a
 * guidelines violation, which is why the page maps over this constant rather
 * than duplicating the text.
 *
 * The wording is unique to this site: these answers are indexable page content,
 * and they are exactly the kind of text an answer engine quotes.
 */
export const FAQ_ITEMS = [
  {
    question: "Which roulette variants do you cover?",
    answer:
      "European, French and American wheels, plus live dealer studios and game-show formats. We note the house edge on each: French with La Partage offers the best value, American double-zero the worst.",
  },
  {
    question: "Do bonuses actually work on roulette?",
    answer:
      "Usually only in part. Table games often contribute 10 percent or less towards wagering, and some casinos exclude roulette from bonus play entirely. We state the contribution for each offer before you claim it.",
  },
  {
    question: "What table limits should I expect?",
    answer:
      "Most live studios run from around 0.50 on outside bets up to several thousand on VIP tables. We list the minimum and maximum for the studios each casino carries.",
  },
  {
    question: "Are live dealer tables fair?",
    answer:
      "Live tables use a physical wheel filmed in a licensed studio and audited by the operator regulator. That is a different fairness model from RNG roulette, and we say which one a casino offers.",
  },
  {
    question: "How quickly can I withdraw a win?",
    answer:
      "It depends on the method and on verification. Crypto is often same-day, while card withdrawals commonly take two to five working days. We publish observed times rather than advertised ones.",
  },
] as const
