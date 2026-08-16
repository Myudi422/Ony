'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, Shield, Wifi, CreditCard, Tag, Tv, Key, QrCode } from 'lucide-react'
import { cn, MEDIA_TYPE_LABELS, STATUS_COLORS } from '@/lib/utils'

interface Card { id: string; card_name: string; media_type: string; status: string; activation_code: string; total_taps: number }

const MEDIA_ICONS: Record<string, React.ElementType> = {
  nfc_card: CreditCard,
  nfc_sticker: Tag,
  qr_standee: Tv,
  qr_keychain: Key,
  digital_qr: QrCode,
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [cards, setCards] = useState<Card[]>([])
  const user = session?.user as { name?: string; email?: string; image?: string; role?: string } | undefined

  useEffect(() => {
    fetch('/api/cards/mine')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCards(d) })
      .catch(() => {})
  }, [])

  const reportLost = async (cardId: string) => {
    if (!confirm('Tandai kartu ini sebagai hilang? Kartu tidak dapat diakses hingga direaktivasi.')) return
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'lost' }),
      })
      setCards(c => Array.isArray(c) ? c.map(card => card.id === cardId ? { ...card, status: 'lost' } : card) : [])
    } catch (_) {}
  }

  const safeCards = Array.isArray(cards) ? cards : []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-600">Kelola akun dan keamanan media kamu.</p>
      </div>

      {/* Profile */}
      <div className="card-surface p-6 mb-5">
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Shield size={18} className="text-ony-blue" />
          Profil Akun
        </h2>
        <div className="flex items-center gap-4">
          {user?.image ? (
            <Image src={user.image} alt={user.name ?? ''} width={60} height={60} className="rounded-full ring-2 ring-slate-200" />
          ) : (
            <div className="w-[60px] h-[60px] rounded-full bg-ony-gradient flex items-center justify-center text-white text-xl font-bold shadow-xs">
              {user?.name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <div className="text-slate-900 font-bold text-lg">{user?.name}</div>
            <div className="text-slate-500 text-sm">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold uppercase">
                {user?.role ?? 'user'}
              </span>
              <span className="text-xs text-slate-500 font-medium">Google OAuth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media Inventory */}
      <div className="card-surface p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Wifi size={18} className="text-ony-blue" />
          Inventori Media ({safeCards.length})
        </h2>

        {safeCards.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Belum ada media terhubung.</p>
        ) : (
          <div className="space-y-3">
            {safeCards.map(card => {
              const Icon = MEDIA_ICONS[card.media_type] ?? CreditCard
              return (
                <div key={card.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-ony-blue" />
                  </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-semibold text-sm">{card.card_name}</div>
                  <div className="text-slate-500 text-xs">{MEDIA_TYPE_LABELS[card.media_type]} · {card.activation_code}</div>
                  <div className="text-slate-400 text-xs">{card.total_taps} interaksi</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLORS[card.status])}>
                    {card.status}
                  </span>
                  {card.status === 'active' && (
                    <button
                      onClick={() => reportLost(card.id)}
                      className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-all font-semibold"
                      id={`report-lost-${card.id}`}
                    >
                      <AlertTriangle size={12} />
                      Hilang
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}

        <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-amber-800 text-xs leading-relaxed">
              Jika kartu kamu hilang atau dicuri, gunakan tombol <strong>Hilang</strong> untuk langsung memblokir akses.
              Kartu tidak dapat diakses hingga kamu atau admin merekativasinya.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
