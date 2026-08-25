'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Tag, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function AdminPricingPage() {
  const [basePrice, setBasePrice] = useState<number>(49000)
  const [promoPrice, setPromoPrice] = useState<number>(39000)
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false)
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
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Gagal memuat data harga.' })
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
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: 'Harga dinamis berhasil diperbarui!' })
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal menyimpan harga' })
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
            Pengaturan Harga Dinamis Media (Dynamic Pricing)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Atur harga resmi & promo untuk kartu blangko (unpaid) saat diklaim dan dibayar pengguna via Midtrans.
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
              Harga default yang ditagihkan via Midtrans saat pengguna mengklaim kartu blangko.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={basePrice}
                onChange={e => setBasePrice(Number(e.target.value))}
                min={10000}
                step={1000}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-ony-blue text-lg"
                required
              />
            </div>
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
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={promoPrice}
                onChange={e => setPromoPrice(Number(e.target.value))}
                min={10000}
                step={1000}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                required
              />
            </div>

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
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Harga'}
          </button>
        </div>
      </form>
    </div>
  )
}
