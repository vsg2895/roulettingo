import type { Metadata } from 'next'
import { Fraunces, Archivo, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'
import SocialIcons from '@/components/SocialIcons'
import CookieConsent from '@/components/CookieConsent'
import ToastProvider from '@/components/ToastProvider'
import CookieSettingsButton from '@/components/CookieSettingsButton'
import Logo from '@/components/Logo'
import { getSocialLinks } from '@/lib/api'
import { buildOrganizationSchema } from '@/lib/seo'
import { SITE_URL } from '@/lib/config'
import { COPY } from '@/constants/copy'
import { LEGAL_PAGES } from '@/constants/legalPages'
import type { SocialLink } from '@shared/types/socialLink'
import './globals.css'

const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], style: ['normal', 'italic'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Roulettingo'

const SITE_TITLE = `${SITE_NAME} — Expert Online Casino Reviews, Bonuses & Offers`
const SITE_DESCRIPTION = `${SITE_NAME} is your independent guide to the best online casinos — expert reviews, exclusive bonuses and hand-picked special offers.`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL || 'https://roulettingo.com'),
  title: {
    // Home & inner pages set their own; this is the SEO-friendly fallback title.
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['online casino reviews', 'casino bonuses', 'special offers', 'best online casinos', SITE_NAME],
  // Explicit per-site favicon so the browser tab always shows this site's mark.
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL || 'https://roulettingo.com',
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
}

const NAV_LINKS = [
  { href: '/casinos', label: COPY.nav.casinos },
  { href: '/special-offers', label: COPY.nav.specialOffers },
  { href: '/categories', label: COPY.nav.categories },
]

// Roulette-wheel mark, matching the header Logo, for the footer brand block.
function WheelMark() {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 place-items-center rounded-full"
      style={{
        background:
          'conic-gradient(#b3382f 0 45deg, #1c2430 45deg 90deg, #b3382f 90deg 135deg, #1c2430 135deg 180deg, #b3382f 180deg 225deg, #1c2430 225deg 270deg, #b3382f 270deg 315deg, #1c2430 315deg 360deg)',
      }}
    >
      <span className="grid h-4 w-4 place-items-center rounded-full bg-cream">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
    </span>
  )
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let socialLinks: SocialLink[] = []
  try {
    socialLinks = (await getSocialLinks()).data
  } catch {
    socialLinks = []
  }

  // Site-wide Organization structured data. Rendered once here in the root
  // layout so every page carries it. Next.js manages the document <head> (manual
  // <head> tags in a root layout are discouraged), so per the framework's JSON-LD
  // guide the <script> is rendered in the layout body — crawlers read JSON-LD
  // from anywhere in the document. The `<` escaping keeps the payload XSS-safe.
  const organizationSchema = buildOrganizationSchema()

  return (
    <html lang="en" className={`${archivo.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <ToastProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
          }}
        />
        <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-xl">
          <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
            <Logo />
            <nav aria-label="Main navigation" className="no-scrollbar -mr-4 min-w-0 overflow-x-auto pr-4">
              <ul className="flex items-center gap-0.5 sm:gap-1" role="list">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="block whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand/10 hover:text-brand sm:px-4">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        {/* Newsletter strip — directly under the header */}
        <section className="border-b border-line bg-paper/50 backdrop-blur-xl">
          <div className="container mx-auto max-w-6xl px-4 py-5">
            <NewsletterForm />
          </div>
        </section>

        <div className="flex-1">{children}</div>

        <footer className="mt-auto border-t border-line bg-[#f2f0ea]">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-3">
                  <WheelMark />
                  <p className="font-sans text-xl font-bold text-ink">
                    Roulett<span className="text-brand">ingo</span>
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  A curated, independent guide to the finest online casinos and exclusive offers. Play responsibly — 18+.
                </p>
                {socialLinks.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">Follow us</p>
                    <SocialIcons links={socialLinks} />
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">Explore</p>
                <ul className="flex flex-col gap-2">
                  {NAV_LINKS.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-ink-soft transition-colors hover:text-brand">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <nav aria-label="Legal" className="mt-10 border-t border-line pt-6">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {LEGAL_PAGES.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link href={`/${slug}`} className="text-xs text-faint transition-colors hover:text-brand">{label}</Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsButton />
                </li>
              </ul>
            </nav>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
              <p className="text-xs text-faint">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
              <p className="text-xs text-faint">18+ · Gamble responsibly</p>
            </div>
            <p className="mt-4 text-xs text-faint">{COPY.footer.disclaimer}</p>
          </div>
        </footer>

        <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  )
}
