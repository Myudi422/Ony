'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'
import { Wifi, QrCode, TrendingUp, MousePointerClick, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

interface Analytics {
  totalTaps: number; totalClicks: number; nfcTaps: number; qrScans: number;
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
    { label: 'Total Interaksi', value: data?.totalTaps ?? 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100', desc: 'Tap NFC + Scan QR' },
    { label: 'Total Klik Link', value: data?.totalClicks ?? 0, icon: MousePointerClick, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100', desc: 'Link diklik pengunjung' },
    { label: 'NFC Tap', value: data?.nfcTaps ?? 0, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100', desc: 'Via chip NFC' },
    { label: 'QR Scan', value: data?.qrScans ?? 0, icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100', desc: 'Via kode QR' },
  ]

  const chartData = Array.isArray(data?.taps) ? data.taps.map(d => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    count: d.count,
  })) : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Analytics</h1>
        <p className="text-slate-600">Pantau performa kartu NFC & QR kamu secara real-time.</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-xs ${
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, color, bg, desc }) => (
          <div key={label} className="card-surface p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-0.5">{formatNumber(value)}</div>
            <div className="text-slate-800 text-xs font-semibold mb-0.5">{label}</div>
            <div className="text-slate-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card-surface p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-ony-blue" />
          <h2 className="text-lg font-bold text-slate-900">Tren Interaksi</h2>
          <span className="text-slate-500 text-xs ml-auto">{period} hari terakhir</span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            Belum ada data untuk periode ini.
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
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Sumber Interaksi</h3>
          <div className="space-y-3">
            {[
              { label: 'NFC Tap', value: data?.nfcTaps ?? 0, total: data?.totalTaps ?? 1, color: 'bg-ony-blue' },
              { label: 'QR Scan', value: data?.qrScans ?? 0, total: data?.totalTaps ?? 1, color: 'bg-indigo-600' },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="text-slate-900 font-bold">{pct}% ({formatNumber(value)})</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Info Analitik</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Rata-rata / hari', value: formatNumber(Math.round((data?.totalTaps ?? 0) / period)) },
              { label: 'Tap-to-click rate', value: data?.totalTaps ? `${Math.round(((data?.totalClicks ?? 0) / data.totalTaps) * 100)}%` : '0%' },
              { label: 'Total Periode', value: `${period} hari` },
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
