import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { cn } from "@/lib/utils"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
}

export const metadata: Metadata = {
  title: {
    default: 'Ony — Tap. Connect. Go.',
    template: '%s | Ony',
  },
  description: 'Smart NFC & QR digital identity platform. Tap your card, share your profile instantly. One tap, infinite connections.',
  keywords: ['NFC card', 'digital business card', 'QR code', 'digital identity', 'smart card', 'tap to connect'],
  authors: [{ name: 'Ony' }],
  creator: 'Ony',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://ony.id',
    siteName: 'Ony',
    title: 'Ony — Tap. Connect. Go.',
    description: 'Smart NFC & QR digital identity platform.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ony — Tap. Connect. Go.',
    description: 'Smart NFC & QR digital identity platform.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={cn("light", inter.variable, "font-sans", geist.variable)}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
