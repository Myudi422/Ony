'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard, Tag, Tv, Key, ShieldCheck, Sparkles,
  Link2, ShoppingCart, Check, CheckCircle2, QrCode, RefreshCw,
  UserCheck, Store, Mail, MapPin, AlertCircle, Loader2, PlayCircle,
  X, Maximize2, HelpCircle, Search, ExternalLink, ArrowRight, ArrowLeft,
  Smartphone, Wifi, Star, Clipboard
} from 'lucide-react'
import GoogleMapsHelpModal from '@/components/GoogleMapsHelpModal'

const MEDIA_LABELS: Record<string, { icon: React.ElementType; name: string }> = {
  nfc_card: { icon: CreditCard, name: 'NFC Card' },
  nfc_sticker: { icon: Tag, name: 'NFC Sticker' },
  qr_standee: { icon: Tv, name: 'QR Standee' },
  qr_keychain: { icon: Key, name: 'NFC Keychain' },
  digital_qr: { icon: Smartphone, name: 'Digital Card' },
}

function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || !url.trim()) return false
  const clean = url.trim().toLowerCase()
  return (
    clean.includes('maps.app.goo.gl') ||
    clean.includes('goo.gl/maps') ||
    clean.includes('writereview?placeid=')
  )
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

  const [step, setStep] = useState(1) // 1: Tujuan, 2: Konfigurasi, 3: Aktivasi
  const [price, setPrice] = useState<number | null>(null)
  const [loadingPay, setLoadingPay] = useState(false)
  const isUnpaid = paymentStatus === 'unpaid'

  // Modals
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showMapsHelpModal, setShowMapsHelpModal] = useState(false)
  const tutorialVideoRef = useRef<HTMLVideoElement>(null)

  const handleFullscreenVideo = async () => {
    const v = tutorialVideoRef.current
    if (!v) return
    try {
      if (v.requestFullscreen) {
        await v.requestFullscreen()
      } else if ((v as any).webkitRequestFullscreen) {
        await (v as any).webkitRequestFullscreen()
      } else if ((v as any).webkitEnterFullscreen) {
        ; (v as any).webkitEnterFullscreen()
      }
    } catch (_) { }
  }

  // Tab for Paid Cards: 'owner' | 'seller'
  const [activeTab, setActiveTab] = useState<'owner' | 'seller'>('owner')

  // Purpose State
  const [cardPurpose, setCardPurpose] = useState<'google_review' | 'business_card' | 'custom_redirect' | null>(null)
  const [cardName, setCardName] = useState('')
  const [isCardNameCustomized, setIsCardNameCustomized] = useState(false)
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [customRedirectUrl, setCustomRedirectUrl] = useState('')
  const [generatingReviewLink, setGeneratingReviewLink] = useState(false)
  const [reviewLinkSuccessNote, setReviewLinkSuccessNote] = useState<string | null>(null)

  // Smart Review Filter (Rating 1-4 ke WA, 5 ke Google Maps)
  const [enableReviewFilter, setEnableReviewFilter] = useState(false)
  const [complaintWa, setComplaintWa] = useState('')

  // Seller State
  const [sellerEmail, setSellerEmail] = useState('')
  const [submittingSeller, setSubmittingSeller] = useState(false)
  const [sellerError, setSellerError] = useState<string | null>(null)
  const [sellerSuccess, setSellerSuccess] = useState<{
    email: string
    purpose: string
    cardName: string
  } | null>(null)

  // Unpaid State
  const [payEmail, setPayEmail] = useState('')
  const [payFormError, setPayFormError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Error & loading
  const [claimingOwner, setClaimingOwner] = useState(false)
  const [claimOwnerError, setClaimOwnerError] = useState<string | null>(null)
  const [stepValidationNotice, setStepValidationNotice] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email && !payEmail) {
      setPayEmail(session.user.email)
    }
  }, [session, payEmail])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = sessionStorage.getItem(`ony_purpose_${code}`) as 'business_card' | 'google_review' | 'custom_redirect' | null
      const n = sessionStorage.getItem(`ony_card_name_${code}`)
      const r = sessionStorage.getItem(`ony_review_url_${code}`)
      const c = sessionStorage.getItem(`ony_redirect_url_${code}`)
      if (p) setCardPurpose(p)
      if (n) {
        setCardName(n)
        const defaults = ['Google Review Toko', 'Kartu Nama Digital', 'Direct Link']
        if (!defaults.includes(n.trim())) {
          setIsCardNameCustomized(true)
        }
      }
      if (r) setGoogleMapsUrl(r)
      if (c) setCustomRedirectUrl(c)
    }
  }, [code])

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

  const handleDirectClaim = async () => {
    setClaimingOwner(true)
    setClaimOwnerError(null)

    const storedPurpose = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_purpose_${code}`) as 'business_card' | 'google_review' | 'custom_redirect' | null : null
    const storedReviewUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_review_url_${code}`) : null
    const storedRedirectUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_redirect_url_${code}`) : null

    const isSmartReview = enableReviewFilter && complaintWa.trim()
    const activePurpose = isSmartReview ? 'smart_review' : (storedPurpose || cardPurpose)
    let targetUrl = (activePurpose === 'google_review' || activePurpose === 'smart_review') ? (googleMapsUrl || storedReviewUrl || '') :
      activePurpose === 'custom_redirect' ? (customRedirectUrl || storedRedirectUrl || '') : ''

    if (activePurpose === 'google_review' || activePurpose === 'smart_review') {
      if (!targetUrl.trim()) {
        setClaimOwnerError('Wajib memasukkan link Google Maps bisnis kamu.')
        setClaimingOwner(false)
        return
      }
      if (!isValidGoogleMapsUrl(targetUrl)) {
        setClaimOwnerError('Link Google Maps tidak valid! Format wajib: https://maps.app.goo.gl/...')
        setClaimingOwner(false)
        return
      }
    }
    if (activePurpose === 'custom_redirect' && !targetUrl.trim()) {
      setClaimOwnerError('Wajib memasukkan URL tujuan redirect.')
      setClaimingOwner(false)
      return
    }

    if ((activePurpose === 'google_review' || activePurpose === 'smart_review') && targetUrl && !targetUrl.includes('writereview?placeid=')) {
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
      } catch (_) { }
    }

    if (isSmartReview && complaintWa.trim()) {
      let cleanWa = complaintWa.trim().replace(/\D/g, '')
      if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1)
      if (!targetUrl.includes('#wa=')) {
        targetUrl = `${targetUrl}#wa=${cleanWa}`
      }
    }

    try {
      const res = await fetch('/api/cards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          purpose: activePurpose,
          redirectUrl: targetUrl,
          cardName: cardName.trim() || undefined,
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
        sessionStorage.removeItem(`ony_card_name_${code}`)
        sessionStorage.removeItem(`ony_review_url_${code}`)
        sessionStorage.removeItem(`ony_redirect_url_${code}`)
      }

      window.location.href = `/dashboard?claimed=${code}`
    } catch (err: any) {
      setClaimOwnerError(err?.message || 'Terjadi kesalahan saat mengklaim kartu.')
      setClaimingOwner(false)
    }
  }

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user && autoClaimParam && !isUnpaid && !claimingOwner) {
      handleDirectClaim()
    }
  }, [authStatus, session, autoClaimParam, isUnpaid])

  const handleGenerateReviewLink = async (targetInput?: string) => {
    const target = targetInput || googleMapsUrl
    if (!target || !target.trim()) return
    if (!isValidGoogleMapsUrl(target)) {
      setReviewLinkSuccessNote(null)
      return
    }
    setGeneratingReviewLink(true)
    setReviewLinkSuccessNote(null)
    try {
      const res = await fetch('/api/tools/google-review-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: target.trim() }),
      })
      const data = await res.json()
      if (data.success && data.reviewUrl) {
        setGoogleMapsUrl(data.reviewUrl)
        setReviewLinkSuccessNote('Link ulasan Google Maps berhasil diverifikasi!')
        setStepValidationNotice(null)
      } else {
        setStepValidationNotice(data.error || 'Link Google Maps tidak dikenali. Mohon gunakan link bagikan resmi.')
      }
    } catch (_) {
      setStepValidationNotice('Terjadi kesalahan saat memproses link Google Maps.')
    } finally {
      setGeneratingReviewLink(false)
    }
  }

  // Automatic review link generation when valid link is entered/pasted
  useEffect(() => {
    if (step !== 2 || cardPurpose !== 'google_review') return
    const clean = googleMapsUrl.trim()
    if (!clean) {
      setReviewLinkSuccessNote(null)
      return
    }

    if (clean.includes('writereview?placeid=')) {
      setReviewLinkSuccessNote('Link ulasan Google Maps terverifikasi')
      return
    }

    if (isValidGoogleMapsUrl(clean) && !generatingReviewLink) {
      const timer = setTimeout(() => {
        handleGenerateReviewLink(clean)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [googleMapsUrl, step, cardPurpose])

  // One-tap paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText()
        if (text) {
          const clean = text.trim()
          setGoogleMapsUrl(clean)
          setStepValidationNotice(null)
          if (isValidGoogleMapsUrl(clean)) {
            handleGenerateReviewLink(clean)
          }
        }
      }
    } catch (_) {
      // Permission denied or clipboard empty
    }
  }

  const handleSellerSubmit = async () => {
    setSellerError(null)
    setSubmittingSeller(true)

    if (!sellerEmail || !sellerEmail.includes('@')) {
      setSellerError('Silakan masukkan alamat email penerima yang valid.')
      setSubmittingSeller(false)
      return
    }

    const isSmartReview = enableReviewFilter && complaintWa.trim()
    const activePurpose = isSmartReview ? 'smart_review' : cardPurpose
    let redirectUrlToSend = (cardPurpose === 'google_review' || isSmartReview) ? googleMapsUrl :
      cardPurpose === 'custom_redirect' ? customRedirectUrl : ''

    if (cardPurpose === 'google_review' || isSmartReview) {
      if (!redirectUrlToSend.trim()) {
        setSellerError('Link Google Maps bisnis klien wajib diisi.')
        setSubmittingSeller(false)
        return
      }
      if (!isValidGoogleMapsUrl(redirectUrlToSend)) {
        setSellerError('Format link Google Maps tidak valid! Contoh: https://maps.app.goo.gl/...')
        setSubmittingSeller(false)
        return
      }
    }

    if (cardPurpose === 'custom_redirect' && !redirectUrlToSend.trim()) {
      setSellerError('URL redirect tujuan wajib diisi.')
      setSubmittingSeller(false)
      return
    }

    if ((cardPurpose === 'google_review' || isSmartReview) && redirectUrlToSend && !redirectUrlToSend.includes('writereview?placeid=')) {
      try {
        const genRes = await fetch('/api/tools/google-review-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: redirectUrlToSend }),
        })
        const genData = await genRes.json()
        if (genData.success && genData.reviewUrl) {
          redirectUrlToSend = genData.reviewUrl
        }
      } catch (_) { }
    }

    if (isSmartReview && complaintWa.trim()) {
      let cleanWa = complaintWa.trim().replace(/\D/g, '')
      if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1)
      if (!redirectUrlToSend.includes('#wa=')) {
        redirectUrlToSend = `${redirectUrlToSend}#wa=${cleanWa}`
      }
    }

    try {
      const res = await fetch('/api/cards/seller-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email: sellerEmail.trim().toLowerCase(),
          purpose: activePurpose,
          googleMapsUrl: redirectUrlToSend,
          cardName: cardName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setSellerError(data.error || 'Gagal mentransfer kartu.')
        setSubmittingSeller(false)
        return
      }

      setSellerSuccess({
        email: sellerEmail,
        purpose: cardPurpose === 'google_review' ? 'Google Maps Review' : cardPurpose === 'custom_redirect' ? 'Custom Redirect' : 'Business Card',
        cardName: cardName.trim() || data.card?.card_name || 'Media Ony',
      })
    } catch (err: any) {
      setSellerError(err?.message || 'Terjadi kesalahan sistem saat mentransfer kartu.')
    } finally {
      setSubmittingSeller(false)
    }
  }

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

    const isSmartReview = enableReviewFilter && complaintWa.trim()
    const activePurpose = isSmartReview ? 'smart_review' : (cardPurpose || 'google_review')
    let targetUrl = (cardPurpose === 'google_review' || isSmartReview) ? googleMapsUrl.trim() :
      cardPurpose === 'custom_redirect' ? customRedirectUrl.trim() : ''

    if (cardPurpose === 'google_review' || isSmartReview) {
      if (!targetUrl) {
        setPayFormError('Link Google Maps bisnis kamu wajib diisi.')
        setLoadingPay(false)
        return
      }
      if (!isValidGoogleMapsUrl(targetUrl)) {
        setPayFormError('Link Google Maps tidak valid! Format: https://maps.app.goo.gl/...')
        setLoadingPay(false)
        return
      }
    }

    if (cardPurpose === 'custom_redirect' && !targetUrl) {
      setPayFormError('URL target redirect wajib diisi.')
      setLoadingPay(false)
      return
    }

    if ((cardPurpose === 'google_review' || isSmartReview) && targetUrl && !targetUrl.includes('writereview?placeid=')) {
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
      } catch (_) { }
    }

    if (isSmartReview && complaintWa.trim()) {
      let cleanWa = complaintWa.trim().replace(/\D/g, '')
      if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1)
      if (!targetUrl.includes('#wa=')) {
        targetUrl = `${targetUrl}#wa=${cleanWa}`
      }
    }

    try {
      const res = await fetch(`/api/cards/${cardId || code}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: activePurpose,
          targetUrl,
          cardName: cardName.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setPayFormError(data.error || 'Gagal memulai pembayaran.')
        setLoadingPay(false)
        return
      }

      if (typeof window !== 'undefined') {
        if (data.orderId) sessionStorage.setItem(`last_order_${code}`, data.orderId)
        sessionStorage.setItem(`ony_pay_email_${code}`, cleanEmail)
        sessionStorage.setItem(`ony_pay_purpose_${code}`, activePurpose)
        sessionStorage.setItem(`ony_pay_target_url_${code}`, targetUrl)
        sessionStorage.setItem(`ony_card_name_${code}`, cardName.trim())
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      } else if (data.snapToken && window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            alert('Pembayaran berhasil! Membuka aktivasi kartu...')
            window.location.reload()
          },
          onPending: () => {
            alert('Menunggu pembayaran selesai...')
          },
          onError: () => {
            alert('Pembayaran dibatalkan atau gagal.')
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

  const handleCheckPaymentStatus = async () => {
    setCheckingStatus(true)
    setPayFormError(null)
    try {
      const savedOrderId = typeof window !== 'undefined' ? sessionStorage.getItem(`last_order_${code}`) : null
      const savedEmail = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_pay_email_${code}`) : null
      const savedPurpose = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_pay_purpose_${code}`) : null
      const savedTargetUrl = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_pay_target_url_${code}`) : null
      const savedCardName = typeof window !== 'undefined' ? sessionStorage.getItem(`ony_card_name_${code}`) : null

      const payload = {
        order_id: savedOrderId || undefined,
        email: savedEmail || payEmail || undefined,
        purpose: savedPurpose || cardPurpose || undefined,
        targetUrl: savedTargetUrl || (cardPurpose === 'google_review' ? googleMapsUrl : cardPurpose === 'custom_redirect' ? customRedirectUrl : '') || undefined,
        cardName: savedCardName || cardName || undefined,
      }

      const res = await fetch(`/api/cards/${cardId || code}/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.settled) {
        alert('Pembayaran terkonfirmasi! Kartu Anda sekarang telah aktif.')
        window.location.reload()
        return
      } else {
        const manualOrderId = prompt(`${data.message || 'Transaksi belum terdeteksi.'}\n\nMasukkan Kode Order Cashi jika ada:`)
        if (manualOrderId && manualOrderId.trim()) {
          const retryRes = await fetch(`/api/cards/${cardId || code}/check-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, order_id: manualOrderId.trim() }),
          })
          const retryData = await retryRes.json()
          if (retryRes.ok && retryData.settled) {
            alert('Pembayaran terkonfirmasi! Kartu Anda sekarang telah aktif.')
            window.location.reload()
            return
          } else {
            alert(retryData.message || 'Status pembayaran belum settled.')
          }
        }
      }
    } catch (_) {
      setPayFormError('Gagal terhubung ke server untuk mengecek pembayaran.')
    }
    setCheckingStatus(false)
  }

  const handleNextStep = () => {
    setStepValidationNotice(null)

    if (step === 1) {
      if (!cardPurpose) {
        setStepValidationNotice('Silakan pilih salah satu fungsi kartu terlebih dahulu.')
        return
      }
      if (!cardName.trim()) {
        setStepValidationNotice('Silakan isi nama kartu kamu terlebih dahulu.')
        return
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`ony_purpose_${code}`, cardPurpose)
        sessionStorage.setItem(`ony_card_name_${code}`, cardName.trim())
      }
      setStep(2)
      return
    }

    if (step === 2) {
      if (isUnpaid) {
        const cleanEmail = payEmail.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          setStepValidationNotice('Silakan masukkan email yang valid terlebih dahulu.')
          return
        }
      } else if (activeTab === 'seller') {
        const cleanEmail = sellerEmail.trim().toLowerCase()
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setStepValidationNotice('Silakan masukkan email klien/pembeli kartu.')
          return
        }
      }

      if (cardPurpose === 'google_review') {
        if (!googleMapsUrl.trim()) {
          setStepValidationNotice('Link Google Maps bisnis wajib dimasukkan.')
          return
        }
        if (!isValidGoogleMapsUrl(googleMapsUrl)) {
          setStepValidationNotice('Format link Google Maps tidak valid. Pastikan diawali dengan https://maps.app.goo.gl/...')
          return
        }
        if (!googleMapsUrl.includes('writereview?placeid=')) {
          setStepValidationNotice('Sedang memproses dan memvalidasi link ulasan Google Maps, mohon tunggu sebentar...')
          return
        }
        if (enableReviewFilter && !complaintWa.trim()) {
          setStepValidationNotice('Nomor WhatsApp penerima komplain wajib diisi jika Proteksi Ulasan Negatif diaktifkan.')
          return
        }
      } else if (cardPurpose === 'custom_redirect') {
        if (!customRedirectUrl.trim()) {
          setStepValidationNotice('URL tujuan redirect wajib dimasukkan.')
          return
        }
      }

      if (typeof window !== 'undefined') {
        if (cardPurpose) sessionStorage.setItem(`ony_purpose_${code}`, cardPurpose)
        if (googleMapsUrl) sessionStorage.setItem(`ony_review_url_${code}`, googleMapsUrl)
        if (customRedirectUrl) sessionStorage.setItem(`ony_redirect_url_${code}`, customRedirectUrl)
      }

      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setStepValidationNotice(null)
    setClaimOwnerError(null)
    setPayFormError(null)
    setSellerError(null)
    if (step > 1) setStep(step - 1)
  }

  const googleLoginCallbackUrl = `/c/${code}?autoClaim=${code}`

  const PURPOSE_OPTIONS = [
    {
      id: 'google_review' as const,
      icon: MapPin,
      title: 'Google Review Form',
      desc: '1 tap NFC langsung buka form ulasan resmi Google Maps tanpa repot ketik lokasi.',
      tag: '⭐ Paling Populer',
    },
    {
      id: 'business_card' as const,
      icon: CreditCard,
      title: 'Kartu Nama & Bio Link',
      desc: 'Halaman profil digital lengkap dengan kontak WhatsApp, medsos & portofolio.',
      tag: '💼 Profil Digital',
    },
    {
      id: 'custom_redirect' as const,
      icon: Link2,
      title: 'Custom URL Redirect',
      desc: 'Arahkan langsung ke link website, menu digital, WhatsApp, atau katalog toko.',
      tag: '🔗 Bebas URL',
    },
  ]

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] lg:bg-slate-100/60 flex flex-col justify-between text-slate-900 selection:bg-ony-blue selection:text-white antialiased">
      {/* Top Header Bar for Mobile & Desktop */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo.png"
            alt="Ony"
            width={110}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Video Tutorial Pill Button */}
        <button
          type="button"
          onClick={() => setShowTutorialModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-ony-blue hover:border-blue-300 text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlayCircle size={14} className="text-ony-blue" />
          <span>Tutorial Aktivasi</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-3 sm:py-6 flex-1 flex items-center justify-center">
        {/* Split Layout Container: 
            On mobile: Completely borderless, seamless, NO rigid nested box ("gak pakai shape kotak")!
            On desktop: Elegant two-column split layout with artwork on the left and form on the right! */}
        <div className="w-full bg-transparent lg:bg-white lg:rounded-[36px] lg:border lg:border-slate-200/90 lg:shadow-xl lg:shadow-slate-200/40 overflow-hidden flex flex-col lg:flex-row items-stretch">

          {/* ================= LEFT COLUMN (Visual Banner - Desktop Only) ================= */}
          <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 flex-col justify-between relative overflow-hidden text-white">
            {/* Ambient Background Glow */}
            <div className="absolute top-10 left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Media Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200">
                <MediaIcon size={14} className="text-cyan-400" />
                <span>{media.name}</span>
                <span className="text-white/30">•</span>
                <span className="font-mono font-bold text-white">{code}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Wifi size={12} className="animate-pulse" />
                <span>NFC & QR Ready</span>
              </div>
            </div>

            {/* Central 3D Visual Asset */}
            <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[310px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/15 group">
                <Image
                  src="/ony-claim-visual.jpg"
                  alt="Ony Smart NFC Experience"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                {/* Floating Micro-Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-left">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-0.5">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <span className="text-[11px] text-white/90 ml-1">5.0 Star Rating</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-tight">
                    Tingkatkan ulasan Google Maps & bagikan kontak dengan sekali tap.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Benefit Footer */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Masa Aktif Selamanya</span>
              <span className="text-white font-semibold">Tanpa Biaya Langganan</span>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (Interactive Wizard Form) ================= */}
          <div className="flex-1 p-3 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between">
            <div>
              {/* Wizard Step Progress & Top Indicators */}
              <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                {/* Mobile Only: Compact Media Tag */}
                <div className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                  <MediaIcon size={13} className="text-ony-blue" />
                  <span className="font-mono font-bold text-slate-900">{code}</span>
                </div>

                {/* Segmented Pill Progress Indicator */}
                <div className="flex items-center gap-2.5 ml-auto">
                  <span className="text-xs font-semibold text-slate-400">
                    Langkah {step} dari 3
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-2 rounded-full transition-all duration-300 ${s === step
                          ? 'w-7 bg-ony-blue'
                          : s < step
                            ? 'w-3.5 bg-emerald-500'
                            : 'w-3.5 bg-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Headline & Subtext */}
              <div className="mb-6 sm:mb-8 text-left">
                {step === 1 && (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                      Pilih Tujuan Kartu Anda
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-lg">
                      Tentukan apa yang terbuka saat media di-tap atau di-scan. Mode ini bebas diubah kapan saja di kemudian hari.
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                      {cardPurpose === 'google_review'
                        ? 'Hubungkan Lokasi Google Maps'
                        : cardPurpose === 'custom_redirect'
                          ? 'Tentukan Link Tujuan'
                          : 'Profil Digital & Kartu Nama'}
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-lg">
                      {cardPurpose === 'google_review'
                        ? 'Masukkan link bagikan Google Maps bisnis Anda untuk otomatis diarahkan ke form ulasan bintang 5.'
                        : cardPurpose === 'custom_redirect'
                          ? 'Tautan website, toko, katalog WhatsApp, atau sosial media yang ingin dibuka saat kartu disentuh.'
                          : 'Kartu ini akan menampilkan halaman profil online Anda dengan foto, bio, dan tombol sosial media.'}
                    </p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                      {isUnpaid ? 'Konfirmasi Pembayaran' : 'Hubungkan Akun & Selesai'}
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-lg">
                      {isUnpaid
                        ? 'Periksa kembali data aktivasi Anda dan selesaikan pembayaran 1x untuk masa aktif selamanya.'
                        : activeTab === 'seller'
                          ? 'Konfirmasi transfer kepemilikan kartu ini langsung ke alamat email klien Anda.'
                          : 'Masuk dengan akun Google untuk mengklaim kartu ini ke dashboard pribadi Anda.'}
                    </p>
                  </>
                )}
              </div>

              {/* Friendly Validation Alert */}
              {stepValidationNotice && (
                <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 text-left">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{stepValidationNotice}</div>
                </div>
              )}

              {/* ================= STEP 1: OPTIONS ================= */}
              {step === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Paid Tab Switcher (Klaim Sendiri vs Kirim ke Klien) */}
                  {!isUnpaid && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl max-w-xs border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setActiveTab('owner')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'owner'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                          }`}
                      >
                        Klaim Sendiri
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('seller')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'seller'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                          }`}
                      >
                        Kirim ke Klien
                      </button>
                    </div>
                  )}

                  {/* 3 Interactive Cards (Fluid & Clean - NOT aggressive boxes!) */}
                  <div className="space-y-2.5 sm:space-y-3">
                    {PURPOSE_OPTIONS.map((opt) => {
                      const isSelected = cardPurpose === opt.id
                      const Icon = opt.icon

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setCardPurpose(opt.id)
                            setStepValidationNotice(null)
                            const defaultNames: Record<string, string> = {
                              google_review: 'Google Review Toko',
                              business_card: 'Kartu Nama Digital',
                              custom_redirect: 'Direct Link',
                            }
                            const defaultList = Object.values(defaultNames)
                            if (!isCardNameCustomized || !cardName.trim() || defaultList.includes(cardName.trim())) {
                              setCardName(defaultNames[opt.id] || '')
                            }
                          }}
                          className={`w-full flex items-center justify-between text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer ${isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                            }`}
                        >
                          <div className="flex items-start sm:items-center gap-3.5 pr-2">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isSelected
                                ? 'bg-white/15 text-white'
                                : 'bg-blue-50 text-ony-blue'
                                }`}
                            >
                              <Icon size={22} />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected
                                    ? 'bg-white/15 text-slate-200'
                                    : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                  {opt.tag}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm sm:text-base font-display leading-tight">
                                {opt.title}
                              </h3>
                              <p
                                className={`text-xs mt-0.5 leading-normal ${isSelected ? 'text-slate-300' : 'text-slate-500'
                                  }`}
                              >
                                {opt.desc}
                              </p>
                            </div>
                          </div>

                          {/* Checkmark Badge */}
                          <div className="shrink-0 ml-2">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Dynamic Card Name Input (Appears once purpose is selected) */}
                  {cardPurpose && (
                    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200/90 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                          Nama Kartu Kamu <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Bisa diubah kapan saja</span>
                      </div>
                      <div className="relative">
                        <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => {
                            const val = e.target.value
                            setCardName(val)
                            setStepValidationNotice(null)
                            const defaultNames = ['Google Review Toko', 'Kartu Nama Digital', 'Direct Link']
                            if (!val.trim()) {
                              setIsCardNameCustomized(false)
                            } else if (!defaultNames.includes(val.trim())) {
                              setIsCardNameCustomized(true)
                            }
                          }}
                          placeholder={
                            cardPurpose === 'google_review'
                              ? 'Contoh: Kasir Resto Meja 1 / Google Review Toko'
                              : cardPurpose === 'business_card'
                                ? 'Contoh: Kartu Nama John Doe / Sales Manager'
                                : 'Contoh: Linktree Instagram / WhatsApp CS'
                          }
                          className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ony-blue font-medium text-slate-900 shadow-2xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Beri nama kartu ini agar mudah dibedakan dan dikelola di dasbor kamu nanti.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ================= STEP 2: LINK SETUP ================= */}
              {step === 2 && (
                <div className="space-y-4 sm:space-y-5 text-left">
                  {/* Card Overview Pill */}
                  <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{cardName || 'Kartu Baru'}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium shrink-0 ml-2">
                      {cardPurpose === 'google_review' ? 'Google Review' : cardPurpose === 'business_card' ? 'Kartu Nama' : 'Direct Link'}
                    </span>
                  </div>
                  {/* Unpaid Email Field */}
                  {isUnpaid && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
                        Email Pemilik / Pembeli <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={payEmail}
                          onChange={(e) => {
                            setPayEmail(e.target.value)
                            setStepValidationNotice(null)
                          }}
                          placeholder="Masukkan email kamu (misal: user@gmail.com)"
                          className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ony-blue font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Digunakan untuk kelola data via Dashboard setelah pembayaran.</p>
                    </div>
                  )}

                  {/* Seller Client Email Field */}
                  {!isUnpaid && activeTab === 'seller' && (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 font-display">
                        Email Klien / Penerima Kartu <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={sellerEmail}
                          onChange={(e) => {
                            setSellerEmail(e.target.value)
                            setStepValidationNotice(null)
                          }}
                          placeholder="Masukkan email klien (contoh: klien@gmail.com)"
                          className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ony-blue font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Kartu akan otomatis terdaftar dan bisa dikelola lewat email ini.</p>
                    </div>
                  )}

                  {/* Google Review URL Input */}
                  {cardPurpose === 'google_review' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                          Link Maps <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMapsHelpModal(true)}
                          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors cursor-pointer"
                        >
                          <HelpCircle size={14} />
                          <span>Cara Ambil Link?</span>
                        </button>
                      </div>

                      <div className="relative flex items-center">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="Tempel link bagikan (contoh: https://maps.app.goo.gl/...)"
                          value={googleMapsUrl}
                          onChange={(e) => {
                            setGoogleMapsUrl(e.target.value)
                            setReviewLinkSuccessNote(null)
                            setStepValidationNotice(null)
                          }}
                          className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all font-mono"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {generatingReviewLink ? (
                            <div className="p-1.5 text-amber-500 flex items-center" title="Memproses link ulasan...">
                              <Loader2 size={16} className="animate-spin" />
                            </div>
                          ) : googleMapsUrl.includes('writereview?placeid=') ? (
                            <div className="p-1.5 text-emerald-500 flex items-center" title="Link ulasan terverifikasi">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePasteClipboard}
                              title="Tempel link dari Clipboard"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-ony-blue hover:bg-blue-50 transition-all cursor-pointer"
                            >
                              <Clipboard size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {generatingReviewLink ? (
                        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                          <Loader2 size={13} className="animate-spin" /> Memproses dan menyiapkan link ulasan Google Maps...
                        </p>
                      ) : googleMapsUrl.includes('writereview?placeid=') ? (
                        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Link ulasan Google Maps berhasil diverifikasi!
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Cukup tempel link bagikan (<span className="font-mono text-blue-600 font-semibold">https://maps.app.goo.gl/...</span>). Sistem otomatis memproses link ulasan begitu link dimasukkan.
                        </p>
                      )}

                      {/* Optional Review Filter Gatekeeper Toggle */}
                      <div className="pt-2">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={enableReviewFilter}
                              onChange={(e) => {
                                setEnableReviewFilter(e.target.checked)
                                setStepValidationNotice(null)
                              }}
                              className="mt-1 w-4 h-4 rounded text-ony-blue focus:ring-blue-500 border-slate-300 cursor-pointer"
                            />
                            <div className="text-xs">
                              <div className="font-bold text-slate-900 font-display flex items-center gap-1.5">
                                <span>Filter Ulasan Negatif (Proteksi Rating ⭐)</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Opsional</span>
                              </div>
                              <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                                Cegah ulasan bintang 1–4 masuk ke Google Maps. Pengunjung yang memberi rating 1–4 dialihkan ke WhatsApp untuk komplain privat, sedangkan yang memberi rating 5 diarahkan langsung membuka form ulasan Google Maps.
                              </p>
                            </div>
                          </label>

                          {enableReviewFilter && (
                            <div className="pt-3 border-t border-slate-200 space-y-1.5 animate-in fade-in duration-150">
                              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                                No. WA Aktif <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  placeholder="Contoh: 08123456789 atau 628123456789"
                                  value={complaintWa}
                                  onChange={(e) => {
                                    setComplaintWa(e.target.value)
                                    setStepValidationNotice(null)
                                  }}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none"
                                />
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Nomor WA pengelola/CS yang akan menerima pesan keluhan dari pelanggan.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom URL Input */}
                  {cardPurpose === 'custom_redirect' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                        URL Tujuan Redirect <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://wa.me/628... atau URL website/toko Anda"
                          value={customRedirectUrl}
                          onChange={(e) => {
                            setCustomRedirectUrl(e.target.value)
                            setStepValidationNotice(null)
                          }}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all"
                        />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Pengunjung yang menempelkan HP ke kartu akan langsung diarahkan ke halaman tujuan ini secara instan.
                      </p>
                    </div>
                  )}

                  {/* Business Card Mode Notice */}
                  {cardPurpose === 'business_card' && (
                    <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 text-left space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-ony-blue flex items-center justify-center mb-1">
                        <CreditCard size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm font-display">Halaman Profil Siap Digunakan</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Setelah aktivasi selesai, Anda dapat langsung mengatur foto profil, bio, nomor WhatsApp, serta tautan media sosial secara lengkap lewat dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ================= STEP 3: CONFIRMATION ================= */}
              {step === 3 && (
                <div className="space-y-5 text-left">
                  {/* Summary Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                      Ringkasan Pengaturan Kartu
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Kode Kartu</span>
                        <span className="font-mono font-bold text-slate-900">{code}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jenis Media</span>
                        <span className="font-bold text-slate-900">{media.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tujuan Utama</span>
                        <span className="font-bold text-ony-blue">
                          {cardPurpose === 'google_review'
                            ? enableReviewFilter
                              ? 'Google Review (Filter Bintang 1–4 ⭐)'
                              : 'Google Review Langsung'
                            : cardPurpose === 'custom_redirect'
                              ? 'Custom Redirect'
                              : 'Business Card'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{isUnpaid || activeTab === 'seller' ? 'Email Terkait' : 'Kepemilikan'}</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {isUnpaid ? payEmail : activeTab === 'seller' ? sellerEmail : session?.user?.email || 'Akun Google Anda'}
                        </span>
                      </div>
                    </div>

                    {cardPurpose === 'google_review' && enableReviewFilter && complaintWa && (
                      <div className="pt-2 border-t border-slate-200/80 text-xs">
                        <span className="text-slate-500 block mb-0.5">WA Penerima Komplain:</span>
                        <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-block">
                          {complaintWa} (Bintang 1–4 diarahkan ke sini)
                        </span>
                      </div>
                    )}

                    {(cardPurpose === 'google_review' || cardPurpose === 'custom_redirect') && (
                      <div className="pt-2 border-t border-slate-200/80 text-xs">
                        <span className="text-slate-500 block mb-0.5">Tautan Tujuan:</span>
                        <span className="font-mono text-[11px] text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-200 block">
                          {cardPurpose === 'google_review' ? googleMapsUrl : customRedirectUrl}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions for Unpaid / Seller / Owner */}
                  {isUnpaid ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Biaya Aktivasi 1x Selamanya</span>
                          <span className="text-xl font-extrabold font-mono text-white">
                            {price ? `Rp ${price.toLocaleString('id-ID')}` : 'Rp 49.000'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Aktif Selamanya
                        </span>
                      </div>

                      {payFormError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle size={15} />
                          <span>{payFormError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handlePayAndClaim}
                        disabled={loadingPay}
                        className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-ony-blue hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-display disabled:opacity-50"
                      >
                        {loadingPay ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                        <span>{loadingPay ? 'Memproses...' : `Bayar & Aktifkan Sekarang`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckPaymentStatus}
                        disabled={checkingStatus}
                        className="w-full text-center py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
                        <span>{checkingStatus ? 'Mengecek...' : 'Sudah Bayar? Cek Status Pembayaran'}</span>
                      </button>
                    </div>
                  ) : activeTab === 'seller' ? (
                    <div className="space-y-3">
                      {sellerError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle size={15} />
                          <span>{sellerError}</span>
                        </div>
                      )}

                      {sellerSuccess ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                          <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                          <h4 className="font-bold text-slate-900 text-sm font-display">Kartu Berhasil Ditransfer!</h4>
                          <p className="text-xs text-slate-600">Kartu telah aktif untuk {sellerSuccess.email}.</p>
                          <Link
                            href={`/c/${code}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-display"
                          >
                            <span>Uji Tap Kartu Ini</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSellerSubmit}
                          disabled={submittingSeller}
                          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-display disabled:opacity-50"
                        >
                          {submittingSeller ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
                          <span>{submittingSeller ? 'Mentransfer Kartu...' : 'Konfirmasi Transfer ke Klien'}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {claimOwnerError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle size={15} />
                          <span>{claimOwnerError}</span>
                        </div>
                      )}

                      {authStatus === 'authenticated' && session?.user ? (
                        <button
                          type="button"
                          onClick={handleDirectClaim}
                          disabled={claimingOwner}
                          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-ony-blue hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-display disabled:opacity-50"
                        >
                          {claimingOwner ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                          <span>{claimingOwner ? 'Menghubungkan...' : 'Klaim Kartu ke Akun Saya'}</span>
                        </button>
                      ) : (
                        <Link
                          id="claim-google-btn"
                          href={`/login?callbackUrl=${encodeURIComponent(googleLoginCallbackUrl)}&claim=${code}`}
                          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer font-display"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Lanjutkan dengan Google</span>
                        </Link>
                      )}
                      <p className="text-[11px] text-slate-500 text-center">
                        Aman dan resmi. Hanya digunakan untuk verifikasi pemilik kartu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Nav: Kembali & Lanjutkan */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={step === 1}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${step === 1
                  ? 'opacity-0 pointer-events-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                  }`}
              >
                <ArrowLeft size={16} />
                <span>Kembali</span>
              </button>

              {step < 3 && (() => {
                const isNextStepDisabled =
                  (step === 1 && (!cardPurpose || !cardName.trim())) ||
                  (step === 2 && (
                    (cardPurpose === 'google_review' && (!googleMapsUrl.trim() || !googleMapsUrl.includes('writereview?placeid=') || generatingReviewLink)) ||
                    (cardPurpose === 'custom_redirect' && !customRedirectUrl.trim()) ||
                    (isUnpaid && (!payEmail.trim() || !payEmail.includes('@'))) ||
                    (activeTab === 'seller' && (!sellerEmail.trim() || !sellerEmail.includes('@'))) ||
                    generatingReviewLink
                  ))

                return (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isNextStepDisabled}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs font-display ${isNextStepDisabled
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.98]'
                      }`}
                  >
                    <span>{generatingReviewLink ? 'Menyiapkan Link...' : 'Lanjutkan'}</span>
                    {generatingReviewLink ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={16} />}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer Support */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 text-center">
        <a
          href={`https://wa.me/6289654728249?text=${encodeURIComponent(`Halo Admin Ony, saya membutuhkan bantuan mengenai media dengan kode ${code}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span>Butuh bantuan aktivasi?</span>
          <span className="font-bold underline text-slate-700">Hubungi WhatsApp Admin</span>
        </a>
      </footer>

      {/* Video Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm font-display">
                <PlayCircle size={16} className="text-ony-blue" />
                <span>Tutorial Aktivasi Ony</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFullscreenVideo}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 transition-colors"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowTutorialModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={tutorialVideoRef}
                src="https://file.legalpilar.id/file/ccgnimex/tutorial.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Browser Anda tidak mendukung pemutaran video.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Maps Help Modal */}
      <GoogleMapsHelpModal
        isOpen={showMapsHelpModal}
        onClose={() => setShowMapsHelpModal(false)}
      />
    </div>
  )
}
