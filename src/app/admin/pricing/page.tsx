'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Tag, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function AdminPricingPage() {
  const [basePrice, setBasePrice] = useState<number>(49000)
  const [promoPrice, setPromoPrice] = useState<number>(39000)
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false)
  const [cashiApiKey, setCashiApiKey] = useState<string>('7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa')
  const [cashiWebhookSecret, setCashiWebhookSecret] = useState<string>('sk_b3e73f271e3c0a68fc65168d14920e7b')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadPricing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      if (data) {
        setBasePrice(data.card_base_price ?? 49000)
        setPromoPrice(data.card_promo_price ?? 39000)
        setIsPromoActive(Boolean(data.is_promo_active))
        if (data.cashi_api_key) setCashiApiKey(data.cashi_api_key)
        if (data.cashi_webhook_secret) setCashiWebhookSecret(data.cashi_webhook_secret)
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Gagal memuat data harga & gateway.' })
    }
    setLoading(false)
  }

  useEffect(() => { loadPricing() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_base_price: Number(basePrice),
          card_promo_price: Number(promoPrice),
          is_promo_active: isPromoActive,
          cashi_api_key: cashiApiKey.trim(),
          cashi_webhook_secret: cashiWebhookSecret.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: 'Harga dinamis & Pengaturan Cash.id berhasil diperbarui!' })
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan' })
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Error koneksi' })
    }
    setSaving(false)
  }

  const activeEffectivePrice = isPromoActive ? promoPrice : basePrice

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="text-ony-blue" size={26} />
            Pengaturan Harga & Gateway Pembayaran Cash.id
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Atur harga resmi & promo untuk kartu blangko (unpaid) saat diklaim dan dibayar pengguna via Cash.id (D2D / Online).
          </p>
        </div>
        <button
          onClick={loadPricing}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all"
          title="Reload Pricing"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl mb-6 border flex items-center gap-3 text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Base Price */}
          <div className="card-surface p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-2">
              <DollarSign size={18} className="text-emerald-600" />
              Harga Normal Kartu Blangko
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Harga default yang ditagihkan saat pengguna/agen mengklaim kartu blangko di menu /c/.
            </p>
            <div className="relative mb-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={basePrice}
                onChange={e => setBasePrice(Math.max(1, Number(e.target.value)))}
                min={1}
                step={1}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-ony-blue text-lg"
                required
              />
            </div>
            <p className="text-[11px] font-bold text-emerald-600 font-mono">
              Format: Rp {Number(basePrice || 0).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Card Promo Price */}
          <div className="card-surface p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-2">
              <Tag size={18} className="text-amber-600" />
              Harga Promo Khusus
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Harga diskon yang berlaku jika status promo sedang diaktifkan.
            </p>
            <div className="relative mb-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={promoPrice}
                onChange={e => setPromoPrice(Math.max(1, Number(e.target.value)))}
                min={1}
                step={1}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                required
              />
            </div>
            <p className="text-[11px] font-bold text-amber-600 font-mono mb-4">
              Format: Rp {Number(promoPrice || 0).toLocaleString('id-ID')}
            </p>

            <label className="flex items-center gap-2.5 cursor-pointer bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <input
                type="checkbox"
                checked={isPromoActive}
                onChange={e => setIsPromoActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-900 font-semibold text-xs">
                Aktifkan Diskon Promo Ini Secara Global
              </span>
            </label>
          </div>
        </div>

        {/* Cash.id Gateway Credentials Section */}
        <div className="card-surface p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-ony-blue text-xs font-mono font-extrabold">CASH.ID</span>
            Pengaturan Kredensial Payment Gateway (Cash.id)
          </h2>
          <p className="text-slate-500 text-xs mb-4">
            Digunakan untuk memproses transaksi pembayaran kartu dur to dur & klaim blangko via QRIS / VA / Retail.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                API KEY
              </label>
              <input
                type="text"
                value={cashiApiKey}
                onChange={e => setCashiApiKey(e.target.value)}
                placeholder="7576626ad46a47041a3..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ony-blue"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                WEBHOOK SECRET KEY
              </label>
              <input
                type="text"
                value={cashiWebhookSecret}
                onChange={e => setCashiWebhookSecret(e.target.value)}
                placeholder="sk_b3e73f271e3c..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ony-blue"
                required
              />
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Preview Tagihan Pengguna saat Klaim</div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>Rp {activeEffectivePrice.toLocaleString('id-ID')}</span>
              {isPromoActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Promo Diskon Aktif
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-ony-blue hover:bg-ony-blue-dark text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  )
}
