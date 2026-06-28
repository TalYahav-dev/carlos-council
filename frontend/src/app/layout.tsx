import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
});

const SITE_DESCRIPTION =
  'Submit a business brief and watch six AI strategists analyze, debate, and craft a comprehensive plan in real-time.';

// Public site origin used to resolve absolute OpenGraph/Twitter image URLs.
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://carloscouncil.app); falls
// back to localhost for local development.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Carlos Council — Strategic Advisory Board',
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: '/carlos-mark.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Carlos Council — more than one AI opinion',
    description: SITE_DESCRIPTION,
    siteName: 'Carlos Council',
    type: 'website',
    images: [
      {
        url: '/carlos-og.png',
        width: 1200,
        height: 630,
        alt: 'Carlos Council — more than one AI opinion.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carlos Council — more than one AI opinion',
    description: SITE_DESCRIPTION,
    images: ['/carlos-og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
