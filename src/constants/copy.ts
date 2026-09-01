/**
 * All user-facing and SEO-facing wording for this site.
 *
 * The KEY STRUCTURE is identical across idevaffiliation, winpalack and
 * roulettingo — same groups, same keys, same order — so the three apps stay
 * interchangeable and a component written for one works on all of them.
 *
 * The WORDS are deliberately unique to this site. That is not decoration: the
 * three brands are separate domains serving the same catalogue, and if they
 * shipped the same titles, descriptions and headings, Google would treat them as
 * duplicate content and suppress all but one. Every string that reaches a
 * <title>, a meta description, an <h1>/<h2> or a JSON-LD field must therefore
 * read differently here than on the sibling sites.
 *
 * roulettingo's angle: the table-game specialist — roulette variants, live
 * studios, table limits and how fast a win actually reaches your account.
 */
export const COPY = {
  // SEO identity. These three reach the <title>, the meta description and the
  // keywords tag on EVERY page that does not set its own — which is most of
  // them — so they are the strings most likely to be read as duplicate content
  // if a sibling domain ships the same words. Kept here, beside the rest of this
  // site's wording, rather than inline in layout.tsx where they drifted into
  // being byte-identical with idevaffiliation.
  site: {
    titleTail: 'Roulette & Live Table Casino Reviews',
    description:
      'reviews casinos on what matters at the table: roulette variants, live dealer studios, table limits and how quickly a win actually clears.',
    keywords: [
      'online roulette casinos',
      'live dealer roulette',
      'roulette table limits',
      'european vs american roulette',
      'live casino reviews',
    ],
  },
  nav: {
    casinos: 'Casinos',
    specialOffers: 'Special Offers',
    categories: 'Categories',
  },
  home: {
    heroEyebrow: 'Roulette & Table Games',
    // Split in two so the JSX keeps its emphasised <em> while the words change.
    heroHeadline: 'Every table, every bonus,',
    heroHighlight: 'one honest spin',
    heroSubtitle:
      "Roulettingo rates the internet's casinos the way table players actually experience them — payouts, bonuses and support, verified by hand.",
    topCasinosTitle: 'Best Casinos for Table Players',
    topCasinosSubtitle: 'Ranked on roulette variants, live studios and table limits. Filter by category.',
    featuredCasinos: 'Find A Table',
    specialOffers: 'Table Game Offers',
    viewAll: 'Show All',
    // Leads the home <title>; the year and brand are appended in page.tsx.
    homeTitle: 'Best Roulette & Table Casinos',
    faqTitle: 'Roulette questions, answered',
    metaDescription:
      'Casinos built for table players — roulette variants, live dealer studios, table limits and payout speed, checked by hand.',
  },
  casinos: {
    pageTitle: 'Rated for Roulette & Table Play',
    pageDescription:
      'Casinos rated on what table players care about: roulette variants, live dealer studios, table limits and how quickly a win lands.',
    // Meta-description fallback for a casino review page. Casino records are
    // GLOBAL master data shared by every site, so without a per-site line here
    // all four domains would ship the identical description for the same casino.
    // Short per-site tail appended to an ADMIN-ENTERED casino meta description.
    // Casino records are shared by every site, so without this the same
    // description would ship on all four domains the moment the field is filled.
    // Appended to og:title / twitter:title on a casino review. The casino's
    // own meta_title is shared master data, so without this every domain
    // shipped an IDENTICAL share-card title for the same casino.
    // H2 over the offers block on a casino page. The literal 'Special Offers'
    // was hardcoded in the component on all six sites — an identical H2 on
    // every review page in the network.
    offersHeading: 'Table Offers',
    // Tail of the summary-panel H2: `{casino.name} table facts`.
    glanceHeadingTail: 'table facts',
    reviewTitleTail: 'Rated for Table Play',
    reviewSignature: 'Rated for roulette and table play.',
    reviewSummary: 'rated on roulette variants, live dealer studios, table limits and payout speed.',
    visitCasino: 'Open Casino',
    readReview: 'Read The Review',
    rating: 'Table Rating',
    noResults: 'No tables match those filters yet. Try another variant or limit.',
  },
  specialOffers: {
    pageTitle: 'Roulette & Table Offers',
    pageDescription:
      'Bonuses that actually count on table games, with the wagering contribution stated before you claim them.',
    // Appended to an offer's (shared) bonus text so the four sites do not ship
    // an identical meta description for the same offer.
    offerMetaSuffix: 'Checked for how it actually counts on table games before you claim it.',
    claim: 'Grab Offer',
    noResults: 'No table-game offers are running right now.',
  },
  categories: {
    pageTitle: 'Game Categories',
    pageDescription:
      'Browse casinos by table game, live dealer studio and how fast they pay a win out.',
    // Meta-description tail for a single category page. Category records are
    // shared master data, so this is what keeps the four sites distinct there.
    categoryMetaSuffix: 'ranked on table variants, live dealer studios and how fast a win reaches your account.',
    noResults: 'Nothing to show here yet.',
  },
  newsletter: {
    title: 'New tables, new offers',
    subtitle: 'A short email when we add a roulette casino or spot an offer that counts on table games.',
    placeholder: 'Email address',
    button: 'Join',
    success: 'Nearly there — check your inbox and confirm your address to finish.',
    error: 'That did not send. Please try again.',
  },
  footer: {
    // Short brand blurb in the footer, above the legal links.
    //
    // KEEP THIS UNDER ~72 CHARACTERS. The footer's brand column is
    // (1152 - 32 padding - 40 gap) / 2 = 540px at the sm: breakpoint where the
    // grid becomes two columns, and the text renders at 14px — about 77
    // characters to a line. Anything longer wraps to a second line, which is
    // what this wording was trimmed to fix. It still wraps on a phone, where a
    // single column is ~340px; that is unavoidable for any real sentence and is
    // the correct behaviour there.
    tagline:
      'Independent roulette and live table reviews. Play responsibly — 18+.',
    // Registered postal address, shown beside the copyright line. A physical
    // address in the footer is what mailbox providers and the gambling
    // affiliate compliance checks both look for, and it must match the address
    // used in the email templates.
    postalAddress: '40 George Square, Edinburgh EH8 9LH, United Kingdom',
    disclaimer:
      'Roulette is a game of chance and the table always holds an edge. Play for entertainment, never to chase a loss, and only if you are 18 or over. We may earn a commission from casinos listed here; it never changes how a table is rated.',
  },
  errors: {
    notFound: 'This page is not on the board.',
    apiError: 'Could not load this content. Please try again in a moment.',
  },
} as const
