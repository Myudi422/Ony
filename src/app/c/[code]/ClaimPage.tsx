'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  Wifi, ArrowRight, CreditCard, Tag, Tv, Key, ShieldCheck, Zap,
  Link2, ShoppingCart, CheckCircle2, BarChart2, QrCode, RefreshCw, Sparkles,
  UserCheck, Store, Mail, MapPin, AlertCircle, Loader2, MessageCircle
} from 'lucide-react'

const MEDIA_LABELS: Record<string, { icon: React.ElementType; name: string }> = {
  nfc_card:    { icon: CreditCard, name: 'NFC Card' },
  nfc_sticker: { icon: Tag,        name: 'NFC Sticker' },
  qr_standee:  { icon: Tv,         name: 'QR Standee' },
  qr_keychain: { icon: Key,        name: 'NFC Keychain' },
  digital_qr:  { icon: CreditCard, name: 'Digital Card' },
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void
    }
  }
}

export default function ClaimPage({
  code,
  mediaType,
  paymentStatus = 'paid',
  cardId,
}: {
  code: string
  mediaType: string
  paymentStatus?: 'paid' | 'unpaid'
  cardId?: string
}) {
  const media = MEDIA_LABELS[mediaType] ?? { icon: CreditCard, name: 'Media Ony' }
  const MediaIcon = media.icon

  const { data: session, status: authStatus } = useSession()
  const searchParams = useSearchParams()
  const autoClaimParam = searchParams.get('autoClaim') || searchParams.get('claim')

  const [price, setPrice] = useState<number | null>(null)
  const [loadingPay, setLoadingPay] = useState(false)
  const isUnpaid = paymentStatus === 'unpaid'

  // Tab State: 'owner' (Google Login) | 'seller' (Email activation by Seller)
  const [activeTab, setActiveTab] = useState<'owner' | 'seller'>('owner')

  // Direct Claim State for Owner
  const [claimingOwner, setClaimingOwner] = useState(false)
  const [claimOwnerError, setClaimOwnerError] = useState<string | null>(null)

  // Seller Form State
  const [sellerEmail, setSellerEmail] = useState('')
  const [cardPurpose, setCardPurpose] = useState<'business_card' | 'google_review' | 'custom_redirect'>('google_review')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [customRedirectUrl, setCustomRedirectUrl] = useState('')
  const [generatingReviewLink, setGeneratingReviewLink] = useState(false)
  const [reviewLinkSuccessNote, setReviewLinkSuccessNote] = useState<string | null>(null)

  const [submittingSeller, setSubmittingSeller] = useState(false)
  const [sellerError, setSellerError] = useState<string | null>(null)
  const [sellerSuccess, setSellerSuccess] = useState<{
    email: string
    purpose: string
    cardName: string
  } | null>(null)

  // Unpaid setup & payment form states
  const [payEmail, setPayEmail] = useState('')
  const [payPurpose, setPayPurpose] = useState<'google_review' | 'business_card' | 'custom_redirect'>('google_review')
  const [payGoogleMapsUrl, setPayGoogleMapsUrl] = useState('')
  const [payCustomRedirectUrl, setPayCustomRedirectUrl] = useState('')
  const [payGeneratingReviewLink, setPayGeneratingReviewLink] = useState(false)
  const [payReviewLinkSuccessNote, setPayReviewLinkSuccessNote] = useState<string | null>(null)
  const [payFormError, setPayFormError] = useState<string | null>(null)

  // Auto fill payEmail if session exists
  useEffect(() => {
    if (session?.user?.email && !payEmail) {
      setPayEmail(session.user.email)
    }
  }, [session, payEmail])

  // Direct claim handler for logged in owner
  const handleDirectClaim = async () => {
    setClaimingOwner(true)
    setClaimOwnerError(null)

    // Check if there are stored session values from OAuth redirect
    const storedPurpose = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_purpose_${code}`) as 'business_card' | 'google_review' | 'custom_redirect' | null : null
    const storedReviewUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_review_url_${code}`) : null
    const storedRedirectUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_redirect_url_${code}`) : null

    const activePurpose = storedPurpose || cardPurpose
    let targetUrl = activePurpose === 'google_review' ? (googleMapsUrl || storedReviewUrl || '') :
                    activePurpose === 'custom_redirect' ? (customRedirectUrl || storedRedirectUrl || '') : ''

    // Strict URL validation if purpose is NOT business_card (profile)
    if (activePurpose === 'google_review' && !targetUrl.trim()) {
      setClaimOwnerError('Wajib memasukkan link Google Maps bisnis kamu sebelum mengklaim kartu.')
      setClaimingOwner(false)
      return
    }
    if (activePurpose === 'custom_redirect' && !targetUrl.trim()) {
      setClaimOwnerError('Wajib memasukkan URL tujuan redirect sebelum mengklaim kartu.')
      setClaimingOwner(false)
      return
    }

    // Auto format 5-Star review link if raw maps link was provided and hasn't been generated yet
    if (activePurpose === 'google_review' && targetUrl && !targetUrl.includes('writereview?placeid=')) {
      try {
        const genRes = await fetch('/api/tools/google-review-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: targetUrl }),
        })
        const genData = await genRes.json()
        if (genData.success && genData.reviewUrl) {
          targetUrl = genData.reviewUrl
        }
      } catch (_) {}
    }

    try {
      const res = await fetch('/api/cards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          purpose: activePurpose,
          redirectUrl: targetUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setClaimOwnerError(data.error || 'Gagal mengklaim kartu.')
        setClaimingOwner(false)
        return
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`ony_purpose_${code}`)
        sessionStorage.removeItem(`ony_review_url_${code}`)
        sessionStorage.removeItem(`ony_redirect_url_${code}`)
      }

      // Success! Redirect to dashboard
      window.location.href = `/dashboard?claimed=${code}`
    } catch (err: any) {
      setClaimOwnerError(err?.message || 'Terjadi kesalahan saat mengklaim kartu.')
      setClaimingOwner(false)
    }
  }

  // Load any stored session values on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = sessionStorage.getItem(`ony_purpose_${code}`) as 'business_card' | 'google_review' | 'custom_redirect' | null
      const r = sessionStorage.getItem(`ony_review_url_${code}`)
      const c = sessionStorage.getItem(`ony_redirect_url_${code}`)
      if (p) setCardPurpose(p)
      if (r) setGoogleMapsUrl(r)
      if (c) setCustomRedirectUrl(c)
    }
  }, [code])

  // Trigger auto-claim if user returned authenticated from Google login with autoClaim param
  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user && autoClaimParam && !isUnpaid && !claimingOwner) {
      handleDirectClaim()
    }
  }, [authStatus, session, autoClaimParam, isUnpaid])

  // Fetch dynamic price on mount
  useEffect(() => {
    fetch('/api/admin/pricing', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d) {
          const effPrice = d.is_promo_active ? (Number(d.card_promo_price) || 39000) : (Number(d.card_base_price) || 49000)
          setPrice(effPrice)
        } else {
          setPrice(49000)
        }
      })
      .catch(() => setPrice(49000))
  }, [])

  // Load Midtrans Snap Script dynamically if unpaid
  useEffect(() => {
    if (isUnpaid && typeof window !== 'undefined') {
      const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith('SB-')
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : 'https://app.midtrans.com/snap/snap.js'
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ''

      if (!document.getElementById('midtrans-snap-script') && clientKey) {
        const script = document.createElement('script')
        script.id = 'midtrans-snap-script'
        script.src = snapUrl
        script.setAttribute('data-client-key', clientKey)
        document.body.appendChild(script)
      }
    }
  }, [isUnpaid])

  const handlePayAndClaim = async () => {
    setLoadingPay(true)
    setPayFormError(null)

    const cleanEmail = payEmail.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setPayFormError('Email pemilik/pembeli kartu wajib diisi dengan benar.')
      setLoadingPay(false)
      return
    }

    let targetUrl = payPurpose === 'google_review' ? payGoogleMapsUrl.trim() :
                    payPurpose === 'custom_redirect' ? payCustomRedirectUrl.trim() : ''

    if (payPurpose === 'google_review' && !targetUrl) {
      setPayFormError('Link Google Maps bisnis kamu wajib diisi.')
      setLoadingPay(false)
      return
    }

    if (payPurpose === 'custom_redirect' && !targetUrl) {
      setPayFormError('URL target redirect wajib diisi.')
      setLoadingPay(false)
      return
    }

    // Auto format 5-Star review link if raw maps link provided and not yet formatted
    if (payPurpose === 'google_review' && targetUrl && !targetUrl.includes('writereview?placeid=')) {
      try {
        const genRes = await fetch('/api/tools/google-review-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: targetUrl }),
        })
        const genData = await genRes.json()
        if (genData.success && genData.reviewUrl) {
          targetUrl = genData.reviewUrl
        }
      } catch (_) {}
    }

    try {
      const res = await fetch(`/api/cards/${cardId || code}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: payPurpose,
          targetUrl,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setPayFormError(data.error || 'Gagal memulai pembayaran.')
        setLoadingPay(false)
        return
      }

      if (data.orderId && typeof window !== 'undefined') {
        sessionStorage.setItem(`last_order_${code}`, data.orderId)
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      } else if (data.snapToken && window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            alert('Pembayaran berhasil! Membuka halaman aktivasi kartu...')
            window.location.reload()
          },
          onPending: () => {
            alert('Menunggu pembayaran selesai...')
          },
          onError: () => {
            alert('Pembayaran gagal atau dibatalkan.')
          },
          onClose: () => {
            setLoadingPay(false)
          },
        })
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch (err: any) {
      setPayFormError(err?.message || 'Gagal memproses pembayaran.')
    }
    setLoadingPay(false)
  }

  const [checkingStatus, setCheckingStatus] = useState(false)

  const handleCheckPaymentStatus = async () => {
    setCheckingStatus(true)
    setPayFormError(null)
    try {
      const savedOrderId = typeof window !== 'undefined' ? sessionStorage.getItem(`last_order_${code}`) : null
      const res = await fetch(`/api/cards/${cardId || code}/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: savedOrderId || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.settled) {
        alert('Pembayaran berhasil terkonfirmasi! Kartu Anda sekarang telah aktif.')
        window.location.reload()
        return
      } else {
        const manualOrderId = prompt(`${data.message || 'Transaksi belum terdeteksi.'}\n\nJika Anda memiliki Kode Order Cashi (Contoh: CARD-CLAIM-7E553G5Z-1787674559036), silakan tempel/masukkan di bawah ini:`)
        if (manualOrderId && manualOrderId.trim()) {
          const retryRes = await fetch(`/api/cards/${cardId || code}/check-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: manualOrderId.trim() }),
          })
          const retryData = await retryRes.json()
          if (retryRes.ok && retryData.settled) {
            alert('Pembayaran berhasil terkonfirmasi! Kartu Anda sekarang telah aktif.')
            window.location.reload()
            return
          } else {
            alert(retryData.message || 'Status pembayaran untuk ID Order tersebut belum Settled.')
          }
        }
      }
    } catch (_) {
      setPayFormError('Gagal terhubung ke server untuk mengecek status pembayaran.')
    }
    setCheckingStatus(false)
  }

  // Handle auto-generating direct Google write review link from maps URL
  const handleGenerateReviewLink = async (targetInput?: string) => {
    const target = targetInput || googleMapsUrl
    if (!target || !target.trim()) return
    setGeneratingReviewLink(true)
    setReviewLinkSuccessNote(null)
    try {
      const res = await fetch('/api/tools/google-review-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: target }),
      })
      const data = await res.json()
      if (data.success && data.reviewUrl) {
        setGoogleMapsUrl(data.reviewUrl)
        setReviewLinkSuccessNote('✓ Link Direct Google Review berhasil digenerate!')
      }
    } catch (_) {
    } finally {
      setGeneratingReviewLink(false)
    }
  }

  // Handle Seller Submit
  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSellerError(null)

    if (!sellerEmail || !sellerEmail.includes('@')) {
      setSellerError('Silakan masukkan alamat email yang valid.')
      return
    }

    if (cardPurpose === 'google_review' && !googleMapsUrl.trim()) {
      setSellerError('Wajib memasukkan link Google Maps bisnis kamu sebelum mengaktifkan kartu.')
      return
    }

    if (cardPurpose === 'custom_redirect' && !customRedirectUrl.trim()) {
      setSellerError('Wajib memasukkan URL tujuan redirect sebelum mengaktifkan kartu.')
      return
    }

    setSubmittingSeller(true)

    try {
      // If user pasted a short google maps link and hasn't clicked generate yet, auto-convert it first
      let finalReviewUrl = googleMapsUrl
      if (cardPurpose === 'google_review' && googleMapsUrl && !googleMapsUrl.includes('writereview?placeid=')) {
        try {
          const genRes = await fetch('/api/tools/google-review-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: googleMapsUrl }),
          })
          const genData = await genRes.json()
          if (genData.success && genData.reviewUrl) {
            finalReviewUrl = genData.reviewUrl
          }
        } catch (_) {}
      }

      // Determine the URL to pass for each purpose
      const redirectUrlToSend =
        cardPurpose === 'google_review' ? finalReviewUrl :
        cardPurpose === 'custom_redirect' ? customRedirectUrl :
        ''

      const res = await fetch('/api/cards/seller-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email: sellerEmail,
          purpose: cardPurpose,
          googleMapsUrl: redirectUrlToSend,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setSellerError(data.error || 'Gagal mengaktifkan kartu.')
        setSubmittingSeller(false)
        return
      }

      const purposeLabel =
        cardPurpose === 'google_review' ? 'Google Maps Review' :
        cardPurpose === 'custom_redirect' ? 'Direct URL Redirect' :
        'Business Card'

      setSellerSuccess({
        email: sellerEmail,
        purpose: purposeLabel,
        cardName: data.card?.card_name || 'Media Ony',
      })
    } catch (err: any) {
      setSellerError(err?.message || 'Terjadi kesalahan saat mengaktifkan kartu.')
    } finally {
      setSubmittingSeller(false)
    }
  }

  const ONY_CAPABILITIES = [
    {
      icon: MapPin,
      title: 'Direct Google Review Form',
      desc: '1 tap NFC / scan QR langsung membuka pop-up form ulasan Google Maps bisnis kamu tanpa perlu ketik lokasi.',
    },
    {
      icon: Sparkles,
      title: 'Auto Review Link Generator',
      desc: 'Cukup paste link lokasi Google Maps bisnis, sistem otomatis mengubahnya menjadi link ulasan langsung.',
    },
    {
      icon: CreditCard,
      title: 'Profil Digital & Business Card',
      desc: 'Bisa difungsikan sebagai kartu nama digital untuk berbagi kontak WhatsApp, sosmed, & portofolio.',
    },
    {
      icon: Link2,
      title: 'Custom URL Direct Redirect',
      desc: 'Bebas dihubungkan ke link WhatsApp, Website, Instagram, Tokopedia, atau URL apapun.',
    },
    {
      icon: RefreshCw,
      title: 'Bebas Switch Mode & Update Data',
      desc: 'Bebas ubah mode (Review Maps, Profil, atau Custom Link) kapan saja via Dashboard tanpa ganti kartu.',
    },
    {
      icon: ShieldCheck,
      title: '1x Bayar Masa Aktif Selamanya',
      desc: 'Tanpa biaya bulanan atau langganan tersembunyi. Aktifkan sekali untuk pemakaian selamanya.',
    },
  ]

  const googleLoginCallbackUrl = `/c/${code}?autoClaim=${code}`

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900 selection:bg-ony-blue selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg sm:max-w-xl my-6">
        {/* Header Logo */}
        <div className="text-center mb-6 flex justify-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Image src="/logo.png" alt="Ony Smart Ecosystem" width={160} height={48} className="h-11 w-auto rounded object-contain" priority />
          </Link>
        </div>

        {/* Main Card Surface */}
        <div className="card-surface p-6 sm:p-8 shadow-2xl bg-white border border-slate-200/90 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-ony-gradient" />

          {/* Media Header Badge */}
          <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <div className="nfc-ring w-18 h-18 border-blue-300/60" />
            <div className="nfc-ring w-18 h-18 border-cyan-300/60" />
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-ony-gradient flex items-center justify-center shadow-lg text-white">
              <MediaIcon size={26} />
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-ony-blue text-xs font-bold mb-3 font-display">
              <Wifi size={13} className="animate-pulse" />
              {media.name} {isUnpaid ? 'Kosongan Terdeteksi' : 'Siap Diklaim'}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight font-display">
              {isUnpaid ? 'Selamat Datang di Ony Ecosystem' : 'Aktivasi & Klaim Media'}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
              Kode Media: <span className="font-mono text-ony-blue font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{code}</span>
            </p>
          </div>

          {/* IF UNPAID: Educate on Ony Features & Show Payment */}
          {isUnpaid ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-amber-500/10 border border-amber-200/80 text-left">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1 font-display">
                  <MapPin size={16} className="text-amber-600" />
                  Media Tap Pintar Google Review
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                  Solusi praktis memperbanyak ulasan Google Maps bisnis kamu! <strong className="text-slate-900">Cukup 1 tap NFC / scan QR</strong>, pelanggan langsung diarahkan ke form ulasan tanpa ribet cari nama lokasi.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 text-left font-display">
                  Apa saja yang bisa dilakukan Ony?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ONY_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-left transition-all hover:bg-slate-100/60">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-ony-blue mt-0.5 shadow-xs">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-display leading-tight">
                          {title}
                        </h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80">
                <div className="p-5 rounded-2xl bg-slate-900 text-white text-left relative overflow-hidden shadow-xl mb-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-ony-gradient opacity-10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Biaya Aktivasi Media</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      1x Bayar · Selamanya
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      {price === null ? (
                        <div className="w-28 h-7 bg-slate-800 animate-pulse rounded-md" />
                      ) : (
                        <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                          Rp {price.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">Termasuk fitur lengkap</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-normal">
                    Aktifkan kartu ini untuk langsung menggunakan mode Google Review Maps (atau Profil Digital & Custom URL) & kelola via Dashboard.
                  </p>
                </div>

                {/* Form Input Data Aktivasi & Pembeli */}
                <div className="space-y-4 mb-5 text-left bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                      Email Pemilik / Pembeli <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={payEmail}
                        onChange={(e) => {
                          setPayEmail(e.target.value)
                          setPayFormError(null)
                        }}
                        placeholder="Masukkan email kamu (misal: user@gmail.com)"
                        className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ony-blue font-medium shadow-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Email ini akan terhubung dengan kartu untuk mengedit data via Dashboard.</p>
                  </div>

                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                      Tujuan Utama Kartu <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'google_review', icon: MapPin, label: 'Google Review', desc: 'Form Ulasan ⭐', color: 'border-amber-400 bg-amber-50 text-amber-700', inactive: 'border-slate-200 bg-white text-slate-600' },
                        { value: 'business_card', icon: CreditCard, label: 'Business Card', desc: 'Profil & Bio', color: 'border-blue-300 bg-blue-50 text-ony-blue', inactive: 'border-slate-200 bg-white text-slate-600' },
                        { value: 'custom_redirect', icon: Link2, label: 'Custom URL', desc: 'Redirect Bebas', color: 'border-purple-300 bg-purple-50 text-purple-600', inactive: 'border-slate-200 bg-white text-slate-600' },
                      ] as const).map(({ value, icon: Icon, label, desc, color, inactive }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setPayPurpose(value)
                            setPayFormError(null)
                          }}
                          className={`flex flex-col items-center text-center gap-1 p-2.5 rounded-xl border-2 transition-all font-display cursor-pointer ${
                            payPurpose === value ? color : inactive
                          }`}
                        >
                          <Icon size={16} />
                          <span className="font-extrabold text-[11px]">{label}</span>
                          <span className="text-[9px] leading-tight opacity-70">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Google Maps / Target URL Input */}
                  {payPurpose === 'google_review' && (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                        Link Google Maps Bisnis <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={payGoogleMapsUrl}
                          onChange={(e) => {
                            setPayGoogleMapsUrl(e.target.value)
                            setPayFormError(null)
                          }}
                          placeholder="https://maps.app.goo.gl/... atau paste link lokasi Maps"
                          className="w-full pl-10 pr-24 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!payGoogleMapsUrl.trim()) return
                            setPayGeneratingReviewLink(true)
                            setPayFormError(null)
                            try {
                              const res = await fetch('/api/tools/google-review-generator', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ input: payGoogleMapsUrl }),
                              })
                              const data = await res.json()
                              if (data.success && data.reviewUrl) {
                                setPayGoogleMapsUrl(data.reviewUrl)
                                setPayReviewLinkSuccessNote('Link ulasan Google Maps berhasil dibuat!')
                              }
                            } catch (_) {}
                            setPayGeneratingReviewLink(false)
                          }}
                          disabled={payGeneratingReviewLink || !payGoogleMapsUrl}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] disabled:opacity-50 transition-all flex items-center gap-1 font-display shadow-xs cursor-pointer"
                        >
                          {payGeneratingReviewLink ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          <span>Generate</span>
                        </button>
                      </div>
                      {payReviewLinkSuccessNote ? (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 size={13} /> {payReviewLinkSuccessNote}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Paste link lokasi Google Maps bisnis kamu, lalu klik <strong>Generate</strong>.
                        </p>
                      )}
                    </div>
                  )}

                  {payPurpose === 'custom_redirect' && (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                        URL Target Redirect <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={payCustomRedirectUrl}
                          onChange={(e) => {
                            setPayCustomRedirectUrl(e.target.value)
                            setPayFormError(null)
                          }}
                          placeholder="https://wa.me/628123456789 atau link landing page"
                          className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  {payPurpose === 'business_card' && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <Sparkles size={15} className="text-ony-blue shrink-0 mt-0.5" />
                      <div>
                        <strong>Profil Digital disiapkan:</strong> Setelah pembayaran selesai, kamu bisa melengkapi nama, foto profil, dan kontak via Dashboard.
                      </div>
                    </div>
                  )}

                  {payFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{payFormError}</span>
                    </div>
                  )}
                </div>

                {price === null ? (
                  <div className="w-full h-13 rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-500 text-xs font-semibold">
                    Memuat sistem pembayaran...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handlePayAndClaim}
                      disabled={loadingPay}
                      className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-ony-gradient text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 hover:opacity-95 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 font-display cursor-pointer"
                    >
                      <ShoppingCart size={18} />
                      <span>{loadingPay ? 'Memproses Pembayaran...' : `Aktifkan & Bayar Kartu (Rp ${price.toLocaleString('id-ID')})`}</span>
                      <ArrowRight size={16} className="ml-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckPaymentStatus}
                      disabled={checkingStatus}
                      className="w-full text-center py-2.5 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
                      <span>{checkingStatus ? 'Mengecek status di Cashi.id...' : 'Sudah Bayar? Cek Status Pembayaran di Sini'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* IF PAID: 2 TABS (Login Owner vs Tab Seller) */
            <div>
              {/* Tab Navigation Switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 mb-6 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('owner')
                    setSellerError(null)
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all duration-200 font-display ${
                    activeTab === 'owner'
                      ? 'bg-white text-ony-blue shadow-md shadow-slate-200/80 border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  <UserCheck size={16} />
                  <span>Login Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('seller')
                    setSellerError(null)
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all duration-200 font-display ${
                    activeTab === 'seller'
                      ? 'bg-white text-ony-blue shadow-md shadow-slate-200/80 border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  <Store size={16} />
                  <span>Tab Seller</span>
                </button>
              </div>

              {/* TAB 1: LOGIN OWNER (Google Sign In) */}
              {activeTab === 'owner' && (
                <div className="animate-in fade-in duration-200">
                  {authStatus === 'authenticated' && session?.user ? (
                    /* IF USER IS ALREADY LOGGED IN */
                    <div className="space-y-4 text-left">
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-ony-gradient text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                          {session.user.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-slate-900 truncate font-display">{session.user.name}</p>
                          <p className="text-[11px] text-slate-600 truncate">{session.user.email}</p>
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center">
                        Pilih tujuan kartu ini, lalu klik klaim untuk mengaktifkannya ke akun kamu.
                      </p>

                      {/* Step 1: Choose purpose */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 font-display">
                          Tujuan Kartu
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            {
                              value: 'google_review',
                              icon: MapPin,
                              label: 'Google Review',
                              desc: 'Ulasan Maps ⭐',
                              color: 'border-amber-400 bg-amber-50 text-amber-700',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                            {
                              value: 'business_card',
                              icon: CreditCard,
                              label: 'Business Card',
                              desc: 'Profil & bio link',
                              color: 'border-blue-300 bg-blue-50 text-ony-blue',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                            {
                              value: 'custom_redirect',
                              icon: Link2,
                              label: 'Custom URL',
                              desc: 'Redirect bebas',
                              color: 'border-purple-300 bg-purple-50 text-purple-600',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                          ] as const).map(({ value, icon: Icon, label, desc, color, inactive }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCardPurpose(value)}
                              className={`flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-display cursor-pointer ${
                                cardPurpose === value ? color : inactive
                              }`}
                            >
                              <Icon size={18} />
                              <span className="font-extrabold text-[11px]">{label}</span>
                              <span className="text-[10px] leading-tight opacity-70">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2: Conditional URL inputs */}
                      {cardPurpose === 'google_review' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            Link Google Maps Bisnis
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                              className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateReviewLink()}
                              disabled={generatingReviewLink || !googleMapsUrl}
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-ony-gradient text-white rounded-lg font-bold text-[11px] hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 font-display shadow-xs cursor-pointer"
                            >
                              {generatingReviewLink ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              <span>Generate</span>
                            </button>
                          </div>
                          {reviewLinkSuccessNote ? (
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} /> {reviewLinkSuccessNote}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Paste link Google Maps bisnis kamu, klik <strong>Generate</strong> — sistem auto-ubah ke link ulasan langsung.
                            </p>
                          )}
                        </div>
                      )}

                      {cardPurpose === 'custom_redirect' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            URL Tujuan Redirect
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Link2 size={15} />
                            </div>
                            <input
                              type="url"
                              placeholder="https://wa.me/628... atau URL apapun"
                              value={customRedirectUrl}
                              onChange={(e) => setCustomRedirectUrl(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Setiap orang yang tap/scan kartu akan langsung diarahkan ke URL ini — WhatsApp, website, Instagram, Tokopedia, dll.
                          </p>
                        </div>
                      )}

                      {claimOwnerError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{claimOwnerError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleDirectClaim}
                        disabled={claimingOwner}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-ony-gradient text-white font-extrabold text-sm shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 font-display"
                      >
                        {claimingOwner ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Menghubungkan Kartu...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={18} />
                            <span>Klaim Kartu Ini ke Akun Saya</span>
                            <ArrowRight size={16} className="ml-auto" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(googleLoginCallbackUrl)}&claim=${code}`}
                          className="text-xs text-slate-500 hover:text-ony-blue font-semibold transition-colors"
                        >
                          Gunakan Akun Google Lain
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* IF USER IS NOT LOGGED IN YET — Purpose-first flow */
                    <div className="space-y-5">
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center">
                        Pilih tujuan kartu ini, lalu login dengan Google untuk mengklaimnya ke akun kamu.
                      </p>

                      {/* Step 1: Choose purpose */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 font-display">
                          Tujuan Kartu
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            {
                              value: 'google_review',
                              icon: MapPin,
                              label: 'Google Review',
                              desc: 'Ulasan Maps ⭐',
                              color: 'border-amber-400 bg-amber-50 text-amber-700',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                            {
                              value: 'business_card',
                              icon: CreditCard,
                              label: 'Business Card',
                              desc: 'Profil & bio link',
                              color: 'border-blue-300 bg-blue-50 text-ony-blue',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                            {
                              value: 'custom_redirect',
                              icon: Link2,
                              label: 'Custom URL',
                              desc: 'Redirect bebas',
                              color: 'border-purple-300 bg-purple-50 text-purple-600',
                              inactive: 'border-slate-200 bg-white text-slate-600',
                            },
                          ] as const).map(({ value, icon: Icon, label, desc, color, inactive }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCardPurpose(value)}
                              className={`flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-display ${
                                cardPurpose === value ? color : inactive
                              }`}
                            >
                              <Icon size={18} />
                              <span className="font-extrabold text-[11px]">{label}</span>
                              <span className="text-[10px] leading-tight opacity-70">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2: Conditional URL inputs */}
                      {cardPurpose === 'google_review' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            Link Google Maps Bisnis
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                              className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateReviewLink()}
                              disabled={generatingReviewLink || !googleMapsUrl}
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-ony-gradient text-white rounded-lg font-bold text-[11px] hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 font-display shadow-xs"
                            >
                              {generatingReviewLink ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              <span>Generate</span>
                            </button>
                          </div>
                          {reviewLinkSuccessNote ? (
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} /> {reviewLinkSuccessNote}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Paste link Google Maps bisnis kamu, klik <strong>Generate</strong> — sistem auto-ubah ke link ulasan langsung.
                            </p>
                          )}
                        </div>
                      )}

                      {cardPurpose === 'custom_redirect' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            URL Tujuan Redirect
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Link2 size={15} />
                            </div>
                            <input
                              type="url"
                              placeholder="https://wa.me/628... atau URL apapun"
                              value={customRedirectUrl}
                              onChange={(e) => setCustomRedirectUrl(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Setiap orang yang tap/scan kartu akan langsung diarahkan ke URL ini — WhatsApp, website, Instagram, Tokopedia, dll.
                          </p>
                        </div>
                      )}

                      {claimOwnerError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 text-left">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{claimOwnerError}</span>
                        </div>
                      )}

                      {/* Step 3: Login Google */}
                      <Link
                        id="claim-google-btn"
                        href={`/login?callbackUrl=${encodeURIComponent(googleLoginCallbackUrl)}&claim=${code}`}
                        onClick={(e) => {
                          setClaimOwnerError(null)
                          if (cardPurpose === 'google_review' && !googleMapsUrl.trim()) {
                            e.preventDefault()
                            setClaimOwnerError('Wajib memasukkan link Google Maps bisnis kamu sebelum mengaktifkan dengan Google.')
                            return
                          }
                          if (cardPurpose === 'custom_redirect' && !customRedirectUrl.trim()) {
                            e.preventDefault()
                            setClaimOwnerError('Wajib memasukkan URL tujuan redirect sebelum mengaktifkan dengan Google.')
                            return
                          }
                          // Store purpose & review URL to use after OAuth redirect
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem(`ony_purpose_${code}`, cardPurpose)
                            if (googleMapsUrl) sessionStorage.setItem(`ony_review_url_${code}`, googleMapsUrl)
                            if (customRedirectUrl) sessionStorage.setItem(`ony_redirect_url_${code}`, customRedirectUrl)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all duration-200 active:scale-[0.98] font-display"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Aktivasi dengan Google</span>
                        <ArrowRight size={16} className="text-slate-400 ml-auto" />
                      </Link>
                    </div>
                  )}

                  {/* Owner Freedom Reassurance Banner */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-left text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                    <Sparkles size={16} className="text-ony-blue shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 font-bold block mb-0.5 font-display">Bebas Atur & Reset Kapan Saja:</strong>
                      Setelah diklaim, pemilik bebas memilih 3 mode respons (Profile, Direct, Review Maps), mengubah isi link, atau menghapus & reset kartu kapan saja melalui Dashboard.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TAB SELLER (Form Email & Purpose) */}
              {activeTab === 'seller' && (
                <div className="animate-in fade-in duration-200">
                  {sellerSuccess ? (
                    /* SUCCESS STATE FOR SELLER ACTIVATION */
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 font-display">Kartu Berhasil Teraktivasi!</h3>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Kartu <strong className="font-mono text-emerald-700">{code}</strong> telah otomatis terklaim untuk email berikut:
                        </p>
                      </div>

                      <div className="p-3.5 bg-white border border-emerald-200/80 rounded-xl text-left space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-medium">Email Pemilik:</span>
                          <span className="font-bold text-slate-800 font-mono">{sellerSuccess.email}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-medium">Tipe Aktivasi:</span>
                          <span className="font-bold text-ony-blue">{sellerSuccess.purpose}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Status Kartu:</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            AKTIF
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-2">
                        <Link
                          href={`/c/${code}`}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-ony-gradient text-white font-bold text-xs shadow-md hover:opacity-95 transition-all font-display"
                        >
                          <span>Buka / Test Tap Kartu Ini</span>
                          <ArrowRight size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSellerSuccess(null)
                            setSellerEmail('')
                            setGoogleMapsUrl('')
                            setReviewLinkSuccessNote(null)
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all font-display"
                        >
                          Aktivasi Kartu Lainnya
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* FORM FOR SELLER ACTIVATION */
                    <div>
                      <form onSubmit={handleSellerSubmit} className="space-y-4 text-left">
                      <p className="text-slate-600 text-xs leading-relaxed">
                        Form khusus Seller / Agent untuk mengaktifkan kartu dan langsung mengklaimnya atas nama email pembeli/klien.
                      </p>

                      {sellerError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{sellerError}</span>
                        </div>
                      )}

                      {/* Email Input */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                          Email Owner / Klien <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="nama@email.com"
                            value={sellerEmail}
                            onChange={(e) => setSellerEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                          />
                        </div>
                      </div>

                      {/* Dropdown Select Mode / Purpose */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                          Tipe / Tujuan Kartu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={cardPurpose}
                            onChange={(e) => setCardPurpose(e.target.value as 'google_review' | 'business_card' | 'custom_redirect')}
                            className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-800 outline-none transition-all appearance-none cursor-pointer font-display"
                          >
                            <option value="google_review">⭐ Google Maps Review (Direct Redirect)</option>
                            <option value="business_card">💳 Business Card (Profil Digital & Bio Link)</option>
                            <option value="custom_redirect">🔗 Custom URL Redirect (Bebas Arahkan ke URL Apapun)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <Sparkles size={16} />
                          </div>
                        </div>
                      </div>

                      {/* Conditional: Google Maps Review */}
                      {cardPurpose === 'google_review' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            Link / Share Google Maps <span className="text-slate-400 font-normal">(Auto Review Link Generator)</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <MapPin size={16} />
                            </div>
                            <input
                              type="url"
                              placeholder="https://maps.app.goo.gl/..."
                              value={googleMapsUrl}
                              onChange={(e) => {
                                setGoogleMapsUrl(e.target.value)
                                setReviewLinkSuccessNote(null)
                              }}
                              className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateReviewLink()}
                              disabled={generatingReviewLink || !googleMapsUrl}
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-ony-gradient text-white rounded-lg font-bold text-[11px] hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 font-display shadow-xs"
                            >
                              {generatingReviewLink ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              <span>Generate</span>
                            </button>
                          </div>
                          {reviewLinkSuccessNote ? (
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              {reviewLinkSuccessNote}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Paste link Google Maps (seperti <span className="font-mono text-blue-600">https://maps.app.goo.gl/...</span>) lalu klik <strong>Generate</strong> untuk mengubahnya jadi link ulasan langsung.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Conditional: Custom URL Redirect */}
                      {cardPurpose === 'custom_redirect' && (
                        <div className="animate-in fade-in duration-150 space-y-2">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 font-display">
                            URL Tujuan Redirect
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Link2 size={16} />
                            </div>
                            <input
                              type="url"
                              placeholder="https://wa.me/628... atau URL apapun"
                              value={customRedirectUrl}
                              onChange={(e) => setCustomRedirectUrl(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs text-slate-900 outline-none transition-all font-sans"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Tap/scan kartu akan langsung redirect ke URL ini — WhatsApp, website, Instagram, Tokopedia, Shopee, dll.
                          </p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submittingSeller}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-ony-gradient text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 font-display mt-2"
                      >
                        {submittingSeller ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Mengaktifkan Kartu...</span>
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

                    {/* Owner Freedom Reassurance for Seller Activation */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-left text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                      <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800 font-bold block mb-0.5 font-display">Bebas Atur & Reset via Dashboard:</strong>
                        Setelah diaktifkan, pemilik email dapat kapan saja mengedit link, mengubah modus kartu, atau menghapus & reset kartu secara mandiri melalui Dashboard Ony.
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Admin WA Contact */}
        <div className="mt-5 text-center">
          <a
            href={`https://wa.me/6289654728249?text=${encodeURIComponent(`Halo Admin Ony, saya membutuhkan bantuan mengenai media dengan kode ${code}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs font-medium transition-all shadow-xs"
          >
            <MessageCircle size={15} className="text-emerald-500 shrink-0" />
            <span>Kendala atau butuh bantuan?</span>
            <span className="font-bold text-emerald-600 underline">Hubungi Admin WA</span>
          </a>
        </div>
      </div>
    </div>
  )
}
