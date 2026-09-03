'use client'

import Image from 'next/image'
import { ExternalLink, CreditCard, Tag, Tv, Key, QrCode, Sparkles } from 'lucide-react'

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
    <div className="min-h-[100dvh] bg-slate-50/90 flex items-center justify-center text-slate-900 py-10 px-4 sm:px-6 selection:bg-slate-900 selection:text-white relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Bento Container */}
      <div className="relative w-full max-w-md my-auto space-y-3.5">
        
        {/* Bento Card 1: User Profile Header */}
        <div className="relative p-6 sm:p-7 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl text-center overflow-hidden group">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          
          {/* Avatar Container */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.name}
                fill
                className="rounded-full object-cover ring-4 ring-slate-100 shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-2xl font-black text-white shadow-md font-display group-hover:scale-105 transition-transform duration-300">
                {initials}
              </div>
            )}
            {/* NFC Card Badge Indicator */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-slate-100 shadow-md flex items-center justify-center text-slate-800">
              <MediaIcon size={14} />
            </div>
          </div>

          {/* User Info */}
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5 tracking-tight font-display">{user.name}</h1>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-[11px] font-extrabold tracking-wider font-display uppercase">
            <Sparkles size={12} className="text-amber-500" />
            <span>{card.card_name}</span>
          </div>
        </div>

        {/* Dynamic Links Stack (Sleek Uniform Shape Buttons) */}
        {links.length > 0 ? (
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                id={`link-${link.id}`}
                className="group w-full py-4 px-5 rounded-2xl bg-white border border-slate-200/90
                  hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]
                  shadow-xs transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className="font-extrabold text-sm font-display flex-1 leading-snug truncate">
                  {link.title}
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-white/10 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <ExternalLink size={14} />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs font-medium bg-white/90 backdrop-blur-xs border border-slate-200 rounded-3xl shadow-xs font-sans">
            Belum ada link tautan yang ditambahkan.
          </div>
        )}

        {/* Footer: Ony Ecosystem */}
        <footer className="pt-6 pb-2 text-center">
          <p className="text-[11px] font-medium text-slate-400 font-sans">
            &copy; 2026 Ony Ecosystem. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  )
}
