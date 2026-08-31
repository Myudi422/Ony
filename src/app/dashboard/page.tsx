'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Wifi, BarChart2, CreditCard, QrCode, TrendingUp, ArrowRight, ShoppingBag, Settings, Tag, Tv, Key, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

interface Analytics {
  totalTaps: number
  totalClicks: number
  nfcTaps: number
  qrScans: number
  taps: { date: string; count: number }[]
}

interface Card {
  id: string; card_name: string; status: string; media_type: string; total_taps: number; mode: string;
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const user = session?.user as { name?: string; role?: string } | undefined

  useEffect(() => {
    fetch('/api/analytics?days=30')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setAnalytics(d) })
      .catch(() => {})

    fetch('/api/cards/mine')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCards(d) })
      .catch(() => {})
  }, [])

  const safeCards = Array.isArray(cards) ? cards : []
  const totalInteractions = analytics?.totalTaps ?? safeCards.reduce((acc, c) => acc + (c.total_taps || 0), 0)

  const stats = [
    { label: 'Total Interaksi', value: totalInteractions, icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
    { label: 'Total Klik Link', value: analytics?.totalClicks ?? 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
    { label: 'Total Media', value: safeCards.length, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
  ]

  const MEDIA_ICONS: Record<string, React.ElementType> = {
    nfc_card: CreditCard,
    nfc_sticker: Tag,
    qr_standee: Tv,
    qr_keychain: Key,
    digital_qr: QrCode,
  }

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight font-display">
          Halo, {user?.name?.split(' ')[0] ?? 'Kamu'} 👋
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">Kelola kartu NFC & QR digitalmu secara terpusat dari sini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-surface p-4 sm:p-5 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-2xl flex items-center justify-center mb-2.5 shadow-xs`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5 font-display">{formatNumber(value)}</div>
            <div className="text-slate-500 text-[11px] sm:text-xs font-semibold truncate">{label}</div>
          </div>
        ))}
      </div>

      {/* Media Cards */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">Media Aktif</h2>
          <Link href="/dashboard/cards" className="text-ony-blue text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1">
            Kelola semua <ArrowRight size={14} />
          </Link>
        </div>

        {safeCards.length === 0 ? (
          <div className="card-surface p-6 sm:p-8 text-center bg-white border border-slate-200">
            <CreditCard size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-sm mb-1 font-display">Belum ada kartu terhubung</p>
            <p className="text-slate-500 text-xs">Tap kartu NFC atau scan QR untuk mengklaim media pertamamu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
            {safeCards.slice(0, 3).map((card) => {
              const CardIcon = MEDIA_ICONS[card.media_type] ?? CreditCard
              return (
                <Link key={card.id} href={`/dashboard/cards`} className="card-surface p-4 sm:p-5 hover:border-blue-300 transition-all group shadow-xs bg-white min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-ony-blue border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-ony-blue group-hover:text-white transition-colors">
                      <CardIcon size={20} />
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                      card.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                      {card.status}
                    </span>
                  </div>
                  <div className="text-slate-900 font-bold text-sm mb-1 group-hover:text-ony-blue transition-colors font-display truncate">{card.card_name}</div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Wifi size={12} className="text-ony-blue" />
                    {formatNumber(card.total_taps)} interaksi
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 font-display">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          {[
            { href: '/dashboard/cards',     icon: CreditCard,  label: 'Edit Profil',     bg: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80' },
            { href: '/dashboard/analytics', icon: BarChart2,   label: 'Lihat Analytics',  bg: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/80' },
            { href: '/dashboard/store',     icon: ShoppingBag, label: 'Official Store',   bg: 'bg-orange-50/70 hover:bg-orange-100/80 border-orange-200/80' },
            { href: '/dashboard/settings',  icon: Settings,    label: 'Pengaturan',      bg: 'bg-slate-100/70 hover:bg-slate-200/80 border-slate-300/80' },
          ].map(({ href, icon: Icon, label, bg }) => (
            <Link key={href} href={href}
              className={`p-3.5 sm:p-4 flex flex-col items-center gap-2 text-center rounded-2xl border transition-all hover:-translate-y-0.5 shadow-xs ${bg}`}>
              <Icon size={20} className="text-ony-blue" />
              <span className="text-slate-800 text-xs font-bold truncate w-full">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
