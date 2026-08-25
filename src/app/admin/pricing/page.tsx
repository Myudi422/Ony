'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Tag, Save, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, Copy, Check, Eye, EyeOff, Link2 } from 'lucide-react'

export default function AdminPricingPage() {
  const [basePrice, setBasePrice] = useState<number>(49000)
  const [promoPrice, setPromoPrice] = useState<number>(39000)
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false)

  // Cashi.id Credentials
  const [cashiApiKey, setCashiApiKey] = useState<string>('')
  const [cashiWebhookSecret, setCashiWebhookSecret] = useState<string>('')

  // UI Toggles
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [webhookUrl, setWebhookUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/cashi`)
    }
  }, [])

  const loadPricing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      if (data) {
        setBasePrice(data.card_base_price ?? 49000)
        setPromoPrice(data.card_promo_price ?? 39000)
        setIsPromoActive(Boolean(data.is_promo_active))
        setCashiApiKey(data.cashi_api_key || '7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa')
        setCashiWebhookSecret(data.cashi_webhook_secret || 'sk_b3e73f271e3c0a68fc65168d14920e7b')
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Gagal memuat data konfigurasi.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPricing()
  }, [])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 2000)
  }

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
        setMsg({ type: 'success', text: 'Pengaturan Harga & Cashi.id Gateway berhasil disimpan!' })
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
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" size={26} />
            Pengaturan Harga & Payment Gateway (Cashi.id)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Atur harga kartu blangko (unpaid) serta kredensial API & Webhook Cashi.id Gateway.
          </p>
        </div>
        <button
          onClick={loadPricing}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs cursor-pointer"
          title="Reload Pricing & Keys"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Pricing */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Tag size={18} className="text-amber-500" />
            1. Pricing Kartu Blangko (Unpaid)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Base Price */}
            <div className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <DollarSign size={16} className="text-emerald-600" />
                Harga Normal Kartu Blangko
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Harga default saat pengguna mengklaim kartu blangko.
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="number"
                  value={basePrice}
                  onChange={e => setBasePrice(Number(e.target.value))}
                  min={2000}
                  step={500}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  required
                />
              </div>
            </div>

            {/* Card Promo Price */}
            <div className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Tag size={16} className="text-amber-600" />
                Harga Promo Khusus (Untuk Testing Min. Rp 2.000)
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Harga diskon jika status promo diaktifkan.
              </p>
              <div className="relative mb-4">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="number"
                  value={promoPrice}
                  onChange={e => setPromoPrice(Number(e.target.value))}
                  min={2000}
                  step={500}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                  required
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={isPromoActive}
                  onChange={e => setIsPromoActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-amber-900 font-bold text-xs">
                  Aktifkan Harga Promo Diskon Ini
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Cashi.id Payment Gateway Setup */}
        <div className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600" />
                2. Pengaturan API Key & Webhook Key (Cashi.id)
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Kredensial dari Dashboard Cashi.id untuk memproses pembayaran QRIS, Virtual Account, & Retail.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cashi API Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Key size={14} className="text-blue-600" />
                API KEY CASHI.ID
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={cashiApiKey}
                  onChange={e => setCashiApiKey(e.target.value)}
                  placeholder="Paste API Key Cashi.id"
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(cashiApiKey, 'api_key')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title="Salin API Key"
                  >
                    {copiedField === 'api_key' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Cashi Webhook Secret Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                WEBHOOK SECRET KEY CASHI.ID
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={cashiWebhookSecret}
                  onChange={e => setCashiWebhookSecret(e.target.value)}
                  placeholder="Paste Webhook Secret Key"
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title={showSecret ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(cashiWebhookSecret, 'secret')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title="Salin Secret Key"
                  >
                    {copiedField === 'secret' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook URL Copy Box for Cashi Dashboard */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 size={14} className="text-blue-400" />
                URL WEBHOOK UNTUK DASHBOARD CASHI.ID
              </span>
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl || 'https://domain.com/api/webhooks/cashi', 'webhook_url')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedField === 'webhook_url' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedField === 'webhook_url' ? 'Tersalin!' : 'Salin URL Webhook'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tempelkan URL di bawah ini ke menu <strong>Settings → Webhooks</strong> di Dashboard Cashi.id Anda:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto select-all">
              {webhookUrl || 'https://domain.com/api/webhooks/cashi'}
            </div>
          </div>
        </div>

        {/* Live Preview & Save Floating/Bottom Bar */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Preview Tagihan Pengguna saat Klaim</div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>Rp {activeEffectivePrice.toLocaleString('id-ID')}</span>
              {isPromoActive && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Promo Diskon Aktif
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Menyimpan Pengaturan...' : 'Simpan Harga & Kredensial Cashi.id'}
          </button>
        </div>
      </form>
    </div>
  )
}
