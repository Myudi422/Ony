'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Wifi, ArrowRight, CreditCard, Tag, Tv, Key, ShieldCheck, Zap, Link2, ShoppingCart, CheckCircle2 } from 'lucide-react'

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

  const [price, setPrice] = useState<number | null>(null)
  const [loadingPay, setLoadingPay] = useState(false)
  const isUnpaid = paymentStatus === 'unpaid'

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
    try {
      const res = await fetch(`/api/cards/${cardId || code}/pay`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok || data.error) {
        if (res.status === 401) {
          // Redirect to login first, then return to claim page to pay
          window.location.href = `/login?callbackUrl=/c/${code}`
          return
        }
        alert(data.error || 'Gagal memulai pembayaran.')
        setLoadingPay(false)
        return
      }

      if (data.snapToken && window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            alert('Pembayaran berhasil! Membuka dashboard...')
            window.location.href = `/dashboard?claimed=${code}`
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
      alert(err?.message || 'Gagal memproses pembayaran.')
    }
    setLoadingPay(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Single Header Logo */}
        <div className="text-center mb-8 flex justify-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Image src="/logo.png" alt="Ony" width={160} height={48} className="h-12 w-auto rounded object-contain" priority />
          </Link>
        </div>

        {/* Claim Card Surface */}
        <div className="card-surface p-8 text-center shadow-xl bg-white border border-slate-200/90 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-ony-gradient" />

          {/* NFC Wave Animation Ring */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="nfc-ring w-20 h-20 border-blue-200/60" />
            <div className="nfc-ring w-20 h-20 border-blue-200/60" />
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-ony-gradient flex items-center justify-center shadow-md text-white">
              <MediaIcon size={26} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-4">
            <Wifi size={13} />
            {media.name} {isUnpaid ? 'Blangko' : 'Baru'} Terdeteksi
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {isUnpaid ? 'Aktivasi & Bayar Kartu' : 'Klaim Kartu Ini'}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-2">
            Kode: <span className="font-mono text-ony-blue font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{code}</span>
          </p>

          {isUnpaid ? (
            <div className="my-5 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                <ShoppingCart size={14} className="text-amber-600" />
                Kartu Belum Teraktivasi
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-slate-600 text-xs font-medium">Biaya Aktivasi Media:</span>
                {price === null ? (
                  <span className="w-24 h-6 bg-amber-200/70 animate-pulse rounded-md inline-block" />
                ) : (
                  <span className="text-lg font-bold text-slate-900 font-mono">Rp {price.toLocaleString('id-ID')}</span>
                )}
              </div>
              <p className="text-[11px] text-amber-700 mt-2 leading-normal">
                Selesaikan pembayaran satu kali untuk mengaktifkan kartu kosongan ini secara permanent.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Kartu ini sudah siap diaktifkan secara gratis. Login dengan Google untuk mengklaim sebagai profil kamu.
            </p>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: CreditCard, text: 'Kartu Bisnis Digital' },
              { icon: Link2, text: 'Tautan Serbaguna' },
              { icon: ShieldCheck, text: 'Aktivasi Instan' },
              { icon: Zap, text: 'Tap NFC & Scan QR' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Icon size={16} className="text-ony-blue shrink-0" />
                  <span className="text-slate-800 text-xs font-semibold">{item.text}</span>
                </div>
              )
            })}
          </div>

          {/* Claim or Payment Button */}
          {isUnpaid ? (
            price === null ? (
              <div className="w-full h-12 rounded-2xl bg-slate-200/80 animate-pulse flex items-center justify-center text-slate-500 text-xs font-semibold">
                Memuat harga aktivasi...
              </div>
            ) : (
              <button
                onClick={handlePayAndClaim}
                disabled={loadingPay}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-ony-gradient text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all duration-200 active:scale-98 disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                <span>{loadingPay ? 'Memproses Midtrans...' : `Bayar & Aktifkan (Rp ${price.toLocaleString('id-ID')})`}</span>
                <ArrowRight size={16} className="ml-auto" />
              </button>
            )
          ) : (
            <Link
              id="claim-google-btn"
              href={`/login?callbackUrl=/dashboard&claim=${code}`}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm transition-all duration-200 active:scale-98"
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
          )}
        </div>
      </div>
    </div>
  )
}
