'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Wifi, ArrowRight, CreditCard, Tag, Tv, Key, ShieldCheck, Zap,
  Link2, ShoppingCart, CheckCircle2, BarChart2, QrCode, RefreshCw, Sparkles, Check
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

  const ONY_CAPABILITIES = [
    {
      icon: CreditCard,
      title: 'Kartu Nama & Profil Digital',
      desc: 'Bagikan bio, kontak telepon, WhatsApp, sosial media & portofolio hanya dengan 1 tap NFC atau scan QR.',
    },
    {
      icon: RefreshCw,
      title: 'Update Data Kapan Saja',
      desc: 'Nomor atau sosmed berubah? Edit langsung dari dashboard tanpa perlu cetak kartu nama fisik baru.',
    },
    {
      icon: BarChart2,
      title: 'Laporan Analytics Real-Time',
      desc: 'Pantau statistik interaksi: berapa banyak orang yang tap NFC atau scan QR media kamu setiap hari.',
    },
    {
      icon: QrCode,
      title: 'QR Studio & Dynamic Link',
      desc: 'Gunakan QR code dinamis yang bisa dihubungkan ke link website, WhatsApp, atau landing page custom.',
    },
    {
      icon: ShieldCheck,
      title: '1x Bayar Masa Aktif Selamanya',
      desc: 'Tidak ada biaya bulanan atau langganan tersembunyi. Aktifkan sekali dan gunakan media selamanya.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900 selection:bg-ony-blue selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg my-6">
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
              {isUnpaid ? 'Selamat Datang di Ony Ecosystem' : 'Klaim Media Ini'}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
              Kode Media: <span className="font-mono text-ony-blue font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{code}</span>
            </p>
          </div>

          {/* IF UNPAID: Educate on Ony Features FIRST */}
          {isUnpaid ? (
            <div className="space-y-6">
              {/* Value Proposition Intro Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-blue-200/80 text-left">
                <div className="flex items-center gap-2 text-ony-blue font-bold text-xs uppercase tracking-wider mb-1 font-display">
                  <Sparkles size={16} className="text-ony-cyan" />
                  Media Fisik Pintar Serbaguna
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                  Kartu ini adalah <strong className="text-slate-900">Media Fisik Ony</strong> yang terhubung langsung dengan profil digital kamu. Cukup tap ke HP siapapun tanpa install aplikasi!
                </p>
              </div>

              {/* Capabilities Showcase */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 text-left font-display">
                  Apa saja yang bisa dilakukan Ony?
                </h3>
                <div className="space-y-3">
                  {ONY_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5 text-left transition-all hover:bg-slate-100/60">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-ony-blue mt-0.5 shadow-xs">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                          {title}
                        </h4>
                        <p className="text-slate-600 text-xs leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA Block — Payment & Activation */}
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
                    Aktifkan media kosongan ini untuk langsung menghubungkan profil digital & mulai berbagi kontak secara praktis.
                  </p>
                </div>

                {price === null ? (
                  <div className="w-full h-13 rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-500 text-xs font-semibold">
                    Memuat sistem pembayaran Midtrans...
                  </div>
                ) : (
                  <button
                    onClick={handlePayAndClaim}
                    disabled={loadingPay}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-ony-gradient text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 hover:opacity-95 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 font-display"
                  >
                    <ShoppingCart size={18} />
                    <span>{loadingPay ? 'Memproses Midtrans...' : `Aktifkan & Bayar Kartu (Rp ${price.toLocaleString('id-ID')})`}</span>
                    <ArrowRight size={16} className="ml-auto" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* IF PAID: Simple Google Sign In Claim Flow */
            <div>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
                Kartu ini sudah siap diaktifkan secara gratis. Login dengan Google untuk menghubungkannya ke akun kamu.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {[
                  { icon: CreditCard, text: 'Profil Kartu Digital' },
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

              <Link
                id="claim-google-btn"
                href={`/login?callbackUrl=/dashboard&claim=${code}`}
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
        </div>
      </div>
    </div>
  )
}
