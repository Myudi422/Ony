'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'
import { Wifi, QrCode, TrendingUp, MousePointerClick, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

interface Analytics {
  totalTaps: number; totalClicks: number; nfcTaps: number; qrScans: number; totalCards?: number;
  taps: { date: string; count: number }[]
}

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-md rounded-xl p-3 text-xs">
        <div className="text-slate-500 mb-1 font-medium">{label as string}</div>
        <div className="text-ony-blue font-bold">{(payload[0] as { value: number }).value} interaksi</div>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    fetch(`/api/analytics?days=${period}`)
      .then(r => r.json())
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
  }, [period])

  const metrics = [
    { label: 'Total Interaksi', value: data?.totalTaps ?? 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100', desc: 'Tap NFC & Scan QR' },
    { label: 'Total Klik Link', value: data?.totalClicks ?? 0, icon: MousePointerClick, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100', desc: 'Link diklik pengunjung' },
    { label: 'Total Media', value: data?.totalCards ?? 0, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100', desc: 'Kartu & standee terhubung' },
  ]

  const chartData = Array.isArray(data?.taps) ? data.taps.map(d => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    count: d.count,
  })) : []

  return (
    <div className="max-w-5xl w-full mx-auto min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">Analytics</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Pantau performa kartu NFC & QR kamu secara real-time.</p>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              period === d
                ? 'bg-ony-blue text-white'
                : 'border border-slate-200 text-slate-600 hover:text-slate-900 bg-white'
            }`}
          >
            {d} hari
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
        {metrics.map(({ label, value, icon: Icon, color, bg, desc }) => (
          <div key={label} className="card-surface p-4 sm:p-5 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5 font-display">{formatNumber(value)}</div>
            <div className="text-slate-800 text-xs font-semibold mb-0.5 truncate">{label}</div>
            <div className="text-slate-500 text-[11px] sm:text-xs truncate">{desc}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card-surface p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-ony-blue" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">Tren Interaksi</h2>
          </div>
          <span className="text-slate-500 text-xs font-medium">{period} hari terakhir</span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
            <TrendingUp size={24} className="text-slate-300 mb-1" />
            <p className="font-semibold text-slate-600">Belum ada grafik tren harian pada periode ini</p>
            <p className="text-slate-400 text-[11px]">Tren akan terbentuk secara otomatis saat pengunjung mengeklik link pada profil kartu kamu.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip active={false} payload={[]} label="" />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="url(#gradient)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#087CFF', strokeWidth: 0 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#087CFF" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* NFC vs QR Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <div className="card-surface p-4 sm:p-6 min-w-0 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-display">Performa & Kecepatan Pengalihan</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seluruh statistik dihitung secara real-time untuk memberikan gambaran akurat mengenai interaksi media kamu tanpa mengorbankan kecepatan pengalihan kustom.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            <span>⚡ High Performance System</span>
          </div>
        </div>

        <div className="card-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 font-display">Info Analitik</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Rata-rata interaksi / hari', value: formatNumber(Math.round((data?.totalTaps ?? 0) / period)) },
              { label: 'Tap-to-click rate', value: data?.totalTaps ? `${Math.round(((data?.totalClicks ?? 0) / data.totalTaps) * 100)}%` : '0%' },
              { label: 'Rentang Periode', value: `${period} hari` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-900 font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
