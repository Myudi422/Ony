'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Sparkles,
  MapPin,
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ArrowRight,
  QrCode,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react'

interface ClaimPageProps {
  code: string
  mediaType?: string
  paymentStatus?: 'paid' | 'unpaid'
  cardId: string
}

export default function ClaimPage({
  code,
  mediaType = 'nfc_card',
  paymentStatus = 'paid',
  cardId,
}: ClaimPageProps) {
  const router = useRouter()

  // Form State
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [cardPurpose, setCardPurpose] = useState<'google_review' | 'business_card' | 'custom_redirect'>('google_review')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [customRedirectUrl, setCustomRedirectUrl] = useState('')

  // Pricing & Status State
  const [cardPrice, setCardPrice] = useState<number>(49000)
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false)
  const [loadingPricing, setLoadingPricing] = useState(true)

  // UI Processing State
  const [submitting, setSubmitting] = useState(false)
  const [generatingReviewLink, setGeneratingReviewLink] = useState(false)
  const [reviewLinkSuccessNote, setReviewLinkSuccessNote] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [claimedSuccess, setClaimedSuccess] = useState(false)

  // Cash.id Payment Modal & Polling State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [cashiOrder, setCashiOrder] = useState<{
    orderId: string
    price: number
    checkout_url: string
    qrUrl?: string | null
  } | null>(null)
  const [pollingStatus, setPollingStatus] = useState<string>('PENDING')
  const [isPolling, setIsPolling] = useState(false)

  // 1. Fetch live pricing on load
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch('/api/admin/pricing')
        const data = await res.json()
        if (data) {
          const effective = data.is_promo_active ? data.card_promo_price : data.card_base_price
          setCardPrice(effective || 49000)
          setIsPromoActive(Boolean(data.is_promo_active))
        }
      } catch (_) {}
      setLoadingPricing(false)
    }
    fetchPricing()
  }, [])

  // 2. Real-Time Payment Polling Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (paymentModalOpen && cashiOrder?.orderId && !claimedSuccess) {
      setIsPolling(true)

      const checkPayment = async () => {
        try {
          const query = new URLSearchParams({
            orderId: cashiOrder.orderId,
            email,
            name,
            purpose: cardPurpose,
            ...(googleMapsUrl ? { googleMapsUrl } : {}),
            ...(customRedirectUrl ? { customRedirectUrl } : {}),
          })

          const res = await fetch(`/api/cards/${cardId}/check-payment?${query.toString()}`)
          const data = await res.json()

          if (data.paid || data.status === 'SETTLED' || data.status === 'PAID') {
            setPollingStatus('SETTLED')
            setClaimedSuccess(true)
            setIsPolling(false)
            if (interval) clearInterval(interval)
            
            // Refresh page after 1.5s to load active profile
            setTimeout(() => {
              router.refresh()
            }, 1500)
          } else {
            setPollingStatus(data.status || 'PENDING')
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }

      // Initial check
      checkPayment()

      // Poll every 3 seconds
      interval = setInterval(checkPayment, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
      setIsPolling(false)
    }
  }, [paymentModalOpen, cashiOrder, claimedSuccess, cardId, email, name, cardPurpose, googleMapsUrl, customRedirectUrl, router])

  // Helper: Auto Generate Google Maps Review Link
  const handleGenerateReviewLink = () => {
    if (!googleMapsUrl) return
    setGeneratingReviewLink(true)
    setReviewLinkSuccessNote(null)

    setTimeout(() => {
      let url = googleMapsUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      setGoogleMapsUrl(url)
      setReviewLinkSuccessNote('Link Google Maps siap digunakan!')
      setGeneratingReviewLink(false)
    }, 400)
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email) {
      setErrorMessage('Email pemilik wajib diisi.')
      return
    }

    setSubmitting(true)

    try {
      if (paymentStatus === 'unpaid') {
        // Step A: Initiate Cash.id Payment Order
        const res = await fetch(`/api/cards/${cardId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            cardPurpose,
            googleMapsUrl,
            customRedirectUrl,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal membuat transaksi Cash.id.')
        }

        setCashiOrder({
          orderId: data.orderId,
          price: data.price,
          checkout_url: data.checkout_url,
          qrUrl: data.qrUrl,
        })
        setPaymentModalOpen(true)
      } else {
        // Step B: Direct Claim for Already Paid Cards
        const res = await fetch('/api/cards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            email,
            name,
            cardPurpose,
            googleMapsUrl,
            customRedirectUrl,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          if (data.requires_payment) {
            // Fallback to payment if server flags card as unpaid
            const payRes = await fetch(`/api/cards/${cardId}/pay`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name, cardPurpose, googleMapsUrl, customRedirectUrl }),
            })
            const payData = await payRes.json()
            if (payData.success) {
              setCashiOrder(payData)
              setPaymentModalOpen(true)
              setSubmitting(false)
              return
            }
          }
          throw new Error(data.error || 'Gagal mengaktifkan kartu.')
        }

        setClaimedSuccess(true)
        setTimeout(() => {
          router.refresh()
        }, 1200)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses klaim.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Subtle Glowing Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Claim Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-3">
            <Sparkles size={13} />
            <span>Aktivasi Kartu Digital Ony</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Klaim & Aktifkan Kartu
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Kode Kartu: <span className="text-blue-400 font-bold tracking-wider">{code}</span>
          </p>
        </div>

        {/* Claim Box Surface */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-xl">
          {/* Card Media Type Badge & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CreditCard size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white capitalize">
                  {mediaType.replace('_', ' ')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {paymentStatus === 'unpaid' ? 'Kartu Blangko (Belum Dibayar)' : 'Siap Diaktifkan'}
                </div>
              </div>
            </div>

            {/* Pricing Tag */}
            {paymentStatus === 'unpaid' && (
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Biaya Aktivasi</div>
                <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
                  <span>Rp {cardPrice.toLocaleString('id-ID')}</span>
                  {isPromoActive && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      PROMO
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {claimedSuccess && !paymentModalOpen && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center mb-5 flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Kartu Berhasil Diaktifkan! Memuat profil...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs text-center mb-5 flex items-center justify-center gap-2">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Claim Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Pemilik */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Pemilik / Pembuat <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="nama@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dashboard & akses kartu akan ditautkan ke email ini.
              </p>
            </div>

            {/* Nama Pemilik (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Lengkap / Nama Bisnis
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso / Ony Store"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Tipe / Tujuan Kartu */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipe / Tujuan Penggunaan Kartu <span className="text-rose-400">*</span>
              </label>
              <select
                value={cardPurpose}
                onChange={(e) => setCardPurpose(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-200 outline-none cursor-pointer transition-all"
              >
                <option value="google_review">⭐ Google Maps Review (Direct Redirect)</option>
                <option value="business_card">💳 Business Card (Profil Digital & Bio Link)</option>
                <option value="custom_redirect">🔗 Custom URL Redirect (WhatsApp / Web / Olshop)</option>
              </select>
            </div>

            {/* Google Maps Review Input */}
            {cardPurpose === 'google_review' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Link Google Maps <span className="text-slate-400 text-[10px] lowercase">(share link maps)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin size={15} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={googleMapsUrl}
                    onChange={(e) => {
                      setGoogleMapsUrl(e.target.value)
                      setReviewLinkSuccessNote(null)
                    }}
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateReviewLink}
                    disabled={generatingReviewLink || !googleMapsUrl}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] disabled:opacity-40 transition-all flex items-center gap-1"
                  >
                    {generatingReviewLink ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>Check</span>
                  </button>
                </div>
                {reviewLinkSuccessNote && (
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} /> {reviewLinkSuccessNote}
                  </p>
                )}
              </div>
            )}

            {/* Custom Redirect URL Input */}
            {cardPurpose === 'custom_redirect' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  URL Tujuan Redirect
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Link2 size={15} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://wa.me/628... atau URL website/sosmed"
                    value={customRedirectUrl}
                    onChange={(e) => setCustomRedirectUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit / Pay Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : paymentStatus === 'unpaid' ? (
                <>
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                  <span>Bayar & Aktifkan Kartu (Rp {cardPrice.toLocaleString('id-ID')})</span>
                  <ArrowRight size={16} className="ml-auto" />
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Submit & Aktifkan Kartu</span>
                  <ArrowRight size={16} className="ml-auto" />
                </>
              )}
            </button>
          </form>

          {/* CS Help & Support Box */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Butuh bantuan aktivasi? Hubungi CS WhatsApp:</span>
            </div>
            <a
              href="https://wa.me/6289654728249?text=Halo%20CS%20Ony,%20saya%20butuh%20bantuan%20aktivasi%20kartu"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-all text-[11px] whitespace-nowrap shrink-0"
            >
              0896-5472-8249
            </a>
          </div>
        </div>
      </div>

      {/* Cash.id Payment Modal / Dialog */}
      {paymentModalOpen && cashiOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <QrCode size={14} />
              <span>Pembayaran Cash.id (QRIS / Instant)</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-1">Pindai QRIS Untuk Membayar</h2>
            <p className="text-xs text-slate-400 mb-4">
              Total Tagihan: <strong className="text-emerald-400">Rp {cashiOrder.price.toLocaleString('id-ID')}</strong>
            </p>

            {/* QRIS Render Area */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              {cashiOrder.qrUrl ? (
                <img
                  src={cashiOrder.qrUrl}
                  alt="QRIS Pembayaran Cash.id"
                  className="w-48 h-48 object-contain mx-auto rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center text-slate-600 p-3 rounded-lg">
                  <QrCode size={48} className="text-slate-700 mb-2" />
                  <span className="text-[11px] font-semibold">QRIS Cash.id Ready</span>
                  <span className="text-[9px] text-slate-500">Scan via GoPay / BCA / Dana</span>
                </div>
              )}
            </div>

            {/* Polling / Status Indicator */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-3 flex flex-col items-center justify-center gap-2 text-xs">
              {claimedSuccess ? (
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Pembayaran Lunas! Memuat kartu...</span>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="text-amber-400 font-medium flex items-center gap-2 text-left">
                    <RefreshCw size={14} className="animate-spin text-amber-400 shrink-0" />
                    <span className="text-[11px]">Menunggu Pembayaran... ({pollingStatus})</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const query = new URLSearchParams({
                          orderId: cashiOrder.orderId,
                          email,
                          name,
                          purpose: cardPurpose,
                          ...(googleMapsUrl ? { googleMapsUrl } : {}),
                          ...(customRedirectUrl ? { customRedirectUrl } : {}),
                        })
                        const res = await fetch(`/api/cards/${cardId}/check-payment?${query.toString()}`)
                        const data = await res.json()
                        if (data.paid || data.status === 'SETTLED' || data.status === 'PAID') {
                          setClaimedSuccess(true)
                          setTimeout(() => router.refresh(), 1200)
                        } else {
                          setPollingStatus(data.status || 'PENDING')
                        }
                      } catch (err) {}
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] whitespace-nowrap transition-all"
                  >
                    Cek Status
                  </button>
                </div>
              )}
            </div>

            {/* Checkout Link Fallback */}
            <a
              href={cashiOrder.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>Buka Halaman Pembayaran Cash.id</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
