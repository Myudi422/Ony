import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Google Review NFC & QR Standee — Tingkatkan Ulasan Bintang 5 | Ony',
  description: 'Dapatkan ulasan bintang 5 Google Maps tanpa ribet dengan Standee & Kartu NFC pintar Ony. Panduan aktivasi cepat, akses dashboard kelola link, diskon grosir beli banyak lebih murah, dan gratis custom desain minimal order 25 pcs.',
  keywords: [
    'Google Review NFC',
    'Standee Google Review',
    'NFC Google Maps',
    'QR Code Review Toko',
    'Custom Standee Akrilik',
    'Ulasan Bintang 5',
    'Ony Smart Media',
    'Grosir Kartu NFC',
  ],
  openGraph: {
    title: 'Smart Google Review NFC & QR Standee — Ony',
    description: '1 Detik ke Google Review. Cukup tap NFC atau scan QR, ulasan pelanggan langsung masuk ke Google Bisnis Anda.',
    url: 'https://ony.id/google-review',
    siteName: 'Ony',
    type: 'website',
  },
}

export default function GoogleReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
