'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Wifi, BarChart2, CreditCard, QrCode, TrendingUp, ArrowRight } from 'lucide-react'
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

  const stats = [
    { label: 'Total Interaksi', value: analytics?.totalTaps ?? 0, icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
    { label: 'Total Klik Link', value: analytics?.totalClicks ?? 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
    { label: 'NFC Tap', value: analytics?.nfcTaps ?? 0, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
    { label: 'QR Scan', value: analytics?.qrScans ?? 0, icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
  ]

  const MEDIA_ICONS: Record<string, string> = {
    nfc_card: '💳', nfc_sticker: '🏷️', qr_standee: '🖼️', qr_keychain: '🔑', digital_qr: '📱',
  }

  const safeCards = Array.isArray(cards) ? cards : []

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          Halo, {user?.name?.split(' ')[0] ?? 'Kamu'} 👋
        </h1>
        <p className="text-slate-600">Kelola kartu NFC & QR digitalmu dari sini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-surface p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-0.5">{formatNumber(value)}</div>
            <div className="text-slate-500 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Media Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Media Aktif</h2>
          <Link href="/dashboard/cards" className="text-ony-blue text-sm font-semibold hover:underline flex items-center gap-1">
            Kelola semua <ArrowRight size={14} />
          </Link>
        </div>

        {safeCards.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <CreditCard size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Belum ada kartu terhubung</p>
            <p className="text-slate-500 text-sm">Tap kartu NFC atau scan QR untuk mengklaim media pertamamu.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeCards.slice(0, 3).map((card) => (
              <Link key={card.id} href={`/dashboard/cards`} className="card-surface p-5 hover:border-blue-300 transition-all group shadow-xs">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{MEDIA_ICONS[card.media_type] ?? '📱'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    card.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}>
                    {card.status}
                  </span>
                </div>
                <div className="text-slate-900 font-semibold text-sm mb-1 group-hover:text-ony-blue transition-colors">{card.card_name}</div>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Wifi size={10} />
                  {formatNumber(card.total_taps)} interaksi
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/cards',     icon: CreditCard, label: 'Edit Profil',    bg: 'bg-blue-50/60 hover:bg-blue-100/70 border-blue-200/60' },
            { href: '/dashboard/analytics', icon: BarChart2,  label: 'Lihat Analytics', bg: 'bg-purple-50/60 hover:bg-purple-100/70 border-purple-200/60' },
            { href: '/dashboard/qr-studio', icon: QrCode,     label: 'QR Studio',       bg: 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200/60' },
            { href: '/dashboard/store',     icon: Wifi,       label: 'Beli Media',      bg: 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-200/60' },
          ].map(({ href, icon: Icon, label, bg }) => (
            <Link key={href} href={href}
              className={`p-4 flex flex-col items-center gap-2 text-center rounded-xl border transition-all hover:-translate-y-0.5 shadow-xs ${bg}`}>
              <Icon size={20} className="text-ony-blue" />
              <span className="text-slate-800 text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
