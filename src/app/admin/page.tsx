'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, Activity, DollarSign } from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface AdminStats { totalUsers: number; totalMedia: number; totalRevenue: number; totalInteractions: number }

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalMedia: 0, totalRevenue: 0, totalInteractions: 0 })

  useEffect(() => {
    // Fetch stats
    Promise.all([
      fetch('/api/admin/users?limit=1').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/media').then(r => r.json()).catch(() => ({})),
    ]).then(([users, media]) => {
      setStats({
        totalUsers: users.total ?? 0,
        totalMedia: media.total ?? 0,
        totalRevenue: 0,
        totalInteractions: (media.cards ?? []).reduce((s: number, c: { total_taps: number }) => s + (c.total_taps ?? 0), 0),
      })
    }).catch(() => {})
  }, [])

  const metrics = [
    { label: 'Total Users', value: formatNumber(stats.totalUsers), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
    { label: 'Total Media', value: formatNumber(stats.totalMedia), icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
    { label: 'Total Interaksi', value: formatNumber(stats.totalInteractions), icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
  ]

  return (
    <div className="max-w-5xl w-full mx-auto min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">Admin Overview</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Kontrol ekosistem Ony dari satu panel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-surface p-4 sm:p-5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
            <div className="text-slate-500 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="card-surface p-5 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 font-display">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          {[
            { href: '/admin/users',  label: 'Kelola Users',    emoji: '👥' },
            { href: '/admin/media',  label: 'Generate Kode',   emoji: '📲' },
            { href: '/admin/orders', label: 'Proses Pesanan',  emoji: '📦' },
            { href: '/admin/audit',  label: 'Lihat Audit Log', emoji: '📋' },
          ].map(({ href, label, emoji }) => (
            <a key={href} href={href}
              className="card-surface p-4 text-center hover:border-blue-300 transition-all hover:-translate-y-0.5 shadow-xs">
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="text-slate-800 text-xs font-semibold">{label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
