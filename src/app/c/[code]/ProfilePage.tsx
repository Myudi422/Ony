'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Download, ExternalLink, CreditCard, Tag, Tv, Key, QrCode } from 'lucide-react'
import { LINK_ICONS } from '@/lib/utils'

const MEDIA_ICONS: Record<string, React.ElementType> = {
  nfc_card: CreditCard,
  nfc_sticker: Tag,
  qr_standee: Tv,
  qr_keychain: Key,
  digital_qr: QrCode,
}

interface LinkItem { id: string; title: string; url: string; icon_type: string; total_clicks?: number }
interface User { id: string; name: string; email: string; avatar_url?: string }
interface Card { id: string; activation_code: string; media_type: string; card_name: string; total_taps?: number }

async function trackClick(linkId: string, cardId: string) {
  await fetch('/api/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkId, cardId }),
  }).catch(() => {})
}

export default function ProfilePage({
  card, user, links,
}: {
  card: Card
  user: User
  links: LinkItem[]
}) {
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'
  const MediaIcon = MEDIA_ICONS[card.media_type] ?? CreditCard

  const handleLinkClick = (linkId: string) => {
    trackClick(linkId, card.id)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center text-slate-900">
      {/* Mobile container */}
      <div className="w-full max-w-md pt-10 pb-16 px-5">

        {/* Large Logo Header */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Image src="/logo.png" alt="Ony" width={160} height={48} className="h-11 md:h-12 w-auto object-contain rounded" priority />
          </Link>
        </div>

        {/* Profile Card */}
        <div className="card-surface p-8 mb-5 text-center shadow-lg bg-white border border-slate-200/90 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-ony-gradient" />

          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.name}
                fill
                className="rounded-full object-cover ring-4 ring-blue-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-ony-gradient flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {initials}
              </div>
            )}
            {/* NFC Card Badge Indicator (Replaced Phone with Card Icon) */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-blue-200 shadow-md flex items-center justify-center">
              <MediaIcon size={14} className="text-ony-blue" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">{user.name}</h1>
          <p className="text-slate-500 text-sm font-medium">{card.card_name}</p>
          {/* Note: Interaksi count removed as requested */}
        </div>

        {/* Links List */}
        {links.length > 0 ? (
          <div className="space-y-3 mb-5">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                id={`link-${link.id}`}
                className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-white border border-slate-200/90
                  hover:border-blue-300 hover:bg-blue-50/50 active:scale-98 shadow-xs
                  transition-all duration-200 group"
              >
                <span className="text-xl shrink-0">
                  {LINK_ICONS[link.icon_type] ?? '🔗'}
                </span>
                <span className="text-slate-800 font-semibold text-sm flex-1">{link.title}</span>
                <ExternalLink size={15} className="text-slate-400 group-hover:text-ony-blue transition-colors shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <div className="card-surface text-center py-8 text-slate-500 text-sm mb-5 bg-white border border-slate-200">
            Belum ada link yang ditambahkan.
          </div>
        )}

        {/* vCard Download */}
        <button
          onClick={() => {
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${user.name}\nEMAIL:${user.email}\nNOTE:Profil Ony NFC & QR\nEND:VCARD`
            const blob = new Blob([vcard], { type: 'text/vcard' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `${user.name.replace(/\s+/g, '_')}.vcf`; a.click()
            URL.revokeObjectURL(url)
          }}
          id="vcard-download-btn"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-blue-300 transition-all text-sm font-semibold shadow-xs mb-8"
        >
          <Download size={16} className="text-ony-blue" />
          Simpan Kontak
        </button>

        {/* Footer Ony Branding */}
        <div className="text-center pt-4 border-t border-slate-200/80">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Buat Profil Digital Ony Kamu</span>
            <ChevronRight size={14} className="text-ony-blue" />
          </Link>
        </div>
      </div>
    </div>
  )
}
