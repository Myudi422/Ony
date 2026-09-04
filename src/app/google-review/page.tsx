'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Star,
  Wifi,
  QrCode,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Palette,
  Settings,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  PlayCircle
} from 'lucide-react'

// ─── Pricing Config ──────────────────────────────────────────
const WA_PHONE = '6289654728249'
const SHOPEE_STORE_URL = 'https://shopee.co.id/onynfc'

function getPrice(qty: number) {
  if (qty >= 50) return 18000
  if (qty >= 25) return 19000
  if (qty >= 10) return 20000
  return 25000
}

const FAQS = [
  {
    q: 'Berapa harga grosir dan apa saja yang didapat?',
    a: 'Minimal order grosir 10 pcs seharga Rp200.000 (Rp20.000/pcs). Sudah termasuk kartu NFC + QR bahan PVC Vinyl dan masing-masing kartu sudah lengkap dengan stand akrilik bening.',
  },
  {
    q: 'Kenapa beli via WhatsApp lebih murah daripada marketplace?',
    a: 'Pembelian via WhatsApp adalah harga grosir tangan pertama langsung dari kami tanpa potongan biaya admin marketplace. Jika Anda ingin memanfaatkan promo Gratis Ongkir, Anda juga bisa pesan melalui Shopee Official Store kami.',
  },
  {
    q: 'Bagaimana syarat custom desain logo sendiri?',
    a: 'Minimal order 25 pcs untuk mendapatkan GRATIS custom desain (cetak logo brand, warna tema toko, serta nomor meja). Cukup kirim file logo via WhatsApp.',
  },
  {
    q: 'Apakah kartu bisa diatur manual untuk dijual kembali (reseller)?',
    a: 'Bisa. Kartu bisa diaktivasi manual oleh Anda sebelum diserahkan ke klien, atau diserahkan dalam kondisi kosong untuk diaktivasi sendiri oleh pemilik toko.',
  },
  {
    q: 'Bagaimana jika alamat Google Maps toko berubah?',
    a: 'Anda tidak perlu membeli kartu baru. Cukup login ke Dashboard Ony (ony.id/dashboard) dan ganti link tujuan kapan saja secara gratis.',
  },
]

export default function GoogleReviewPage() {
  const [qty, setQty] = useState<number>(10)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const unitPrice = useMemo(() => getPrice(qty), [qty])
  const totalPrice = unitPrice * qty
  const hasCustomDesign = qty >= 25

  const waUrl = useMemo(() => {
    const msg = `Halo Admin Ony, saya ingin pesan Kartu Google Review (PVC + Stand) sebanyak *${qty} pcs* (Total Rp${totalPrice.toLocaleString('id-ID')}).${
      hasCustomDesign ? ' Saya ingin request Free Custom Desain Logo.' : ''
    } Mohon dibantu cara ordernya via WhatsApp.`
    return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`
  }, [qty, totalPrice, hasCustomDesign])

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* ── Minimal Clean Navbar ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Ony"
              width={100}
              height={28}
              className="h-7 w-auto object-contain transition-opacity group-hover:opacity-80"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-500">
            <a href="#harga" className="hover:text-slate-900 transition-colors">Harga Grosir</a>
            <a href="#custom" className="hover:text-slate-900 transition-colors">Custom Desain</a>
            <a href="#tutorial-video" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-semibold text-emerald-700">
              <PlayCircle size={13} />
              <span>Video Tutorial</span>
            </a>
            <a href="#cara-kerja" className="hover:text-slate-900 transition-colors">Cara Aktivasi</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          {/* Nav Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={SHOPEE_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Shopee (Gratis Ongkir)
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs"
            >
              Order via WA (Lebih Murah)
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-6 py-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
              <a href="#harga" onClick={() => setMobileMenuOpen(false)}>Harga Grosir</a>
              <a href="#custom" onClick={() => setMobileMenuOpen(false)}>Custom Desain</a>
              <a href="#tutorial-video" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <PlayCircle size={15} />
                <span>Video Tutorial</span>
              </a>
              <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)}>Cara Aktivasi</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold"
              >
                Pesan via WhatsApp (Lebih Murah)
              </a>
              <a
                href={SHOPEE_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Buka Shopee (Gratis Ongkir)
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. Hero Section (Spacious & Clean) ────────────────────── */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Kartu Pintar Google Review NFC &amp; QR</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Banjir Ulasan Bintang 5 di Google Maps.
            </h1>

            <p className="text-slate-600 text-base leading-relaxed max-w-lg">
              Cukup 1 tap smartphone pelanggan, form ulasan toko Anda langsung terbuka. Berbahan kartu PVC tebal dilapisi vinyl putih, sudah lengkap include stand akrilik bening untuk meja kasir.
            </p>

            {/* Price Highlight Card (Spacious & Crisp) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Harga Grosir Spesial
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Rp200.000 <span className="text-xs font-normal text-slate-500">/ 10 pcs</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Hanya Rp20.000/pcs • <strong>Sudah Termasuk 10 Stand Bening</strong>
                </div>
              </div>
              <a
                href="#harga"
                className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Hitung Order
              </a>
            </div>

            {/* Dual CTAs: WA vs Shopee */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle size={16} />
                <span>Beli via WA (Lebih Murah)</span>
              </a>
              <a
                href={SHOPEE_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 text-center"
              >
                <ShoppingBag size={16} />
                <span>Shopee (Gratis Ongkir)</span>
              </a>
            </div>

            {/* Quick Link to Video Tutorial */}
            <div className="pt-1">
              <a
                href="#tutorial-video"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PlayCircle size={14} />
                </div>
                <span>Tonton Video Tutorial Aktivasi &amp; Penggunaan (1 Menit)</span>
              </a>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                <span>Bisa Diatur Manual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                <span>Bisa Dijual Kembali</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                <span>Garansi 1 Tahun</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean, Uncluttered Real Photo Presentation */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-900 group">
              <Image
                src="/google-review-card.png"
                alt="Foto Asli Kartu Google Review Ony PVC Vinyl dengan Stand Bening"
                width={600}
                height={600}
                className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                priority
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 text-white text-xs flex items-center justify-between border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-slate-200 text-[11px]">PVC + Vinyl (8.5 x 5.4 cm)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">Include Stand Bening</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Clean 4-Item Specifications Bar ────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60 py-12 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Ukuran Kartu</div>
            <div className="text-base font-bold text-slate-900">8.5 x 5.4 cm</div>
            <div className="text-[11px] text-slate-500">Standar ATM / KTP</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Material Fisik</div>
            <div className="text-base font-bold text-slate-900">PVC + Vinyl Putih</div>
            <div className="text-[11px] text-slate-500">Tahan air &amp; awet</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Konektivitas</div>
            <div className="text-base font-bold text-slate-900">NFC + QR Universal</div>
            <div className="text-[11px] text-slate-500">Support iOS &amp; Android</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Kelengkapan</div>
            <div className="text-base font-bold text-emerald-600">Include Stand!</div>
            <div className="text-[11px] text-slate-500">Holder akrilik bening</div>
          </div>
        </div>
      </section>

      {/* ── 3. Simple & Spacious Pricing Calculator ───────────────── */}
      <section id="harga" className="py-20 md:py-24 px-5 sm:px-8 max-w-5xl mx-auto scroll-mt-12">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilihan Grosir</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pesan Grosir Lebih Hemat
          </h2>
          <p className="text-slate-500 text-sm">
            Semua paket sudah termasuk kartu dan stand akrilik bening siap pajang di meja kasir.
          </p>
        </div>

        {/* 3 Clean Price Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 items-stretch">
          {/* 10 pcs */}
          <div
            onClick={() => setQty(10)}
            className={`cursor-pointer p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between ${
              qty === 10
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-102'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Grosir Dasar</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  Best Seller
                </span>
              </div>
              <div className="text-2xl font-bold font-display">10 Pcs</div>
              <div className="text-3xl font-extrabold font-display">
                Rp200.000
                <span className="text-xs font-normal opacity-60"> (Rp20.000/pcs)</span>
              </div>
              <p className="text-xs opacity-75">Sudah include 10 stand akrilik bening.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/20 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Bisa diaktivasi manual</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Bisa dijual kembali</span>
              </div>
            </div>
          </div>

          {/* 25 pcs - Custom Brand */}
          <div
            onClick={() => setQty(25)}
            className={`cursor-pointer p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between ${
              qty === 25
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-102'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Custom Brand</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Free Custom Desain
                </span>
              </div>
              <div className="text-2xl font-bold font-display">25 Pcs</div>
              <div className="text-3xl font-extrabold font-display">
                Rp475.000
                <span className="text-xs font-normal opacity-60"> (Rp19.000/pcs)</span>
              </div>
              <p className="text-xs opacity-75">GRATIS custom desain logo &amp; nama toko.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/20 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>Free cetak logo toko</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>Bisa request nomor meja</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>Include 25 stand bening</span>
              </div>
            </div>
          </div>

          {/* 50 pcs - Reseller */}
          <div
            onClick={() => setQty(50)}
            className={`cursor-pointer p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between ${
              qty === 50
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-102'
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Reseller / Cabang</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                  Harga Termurah
                </span>
              </div>
              <div className="text-2xl font-bold font-display">50 Pcs</div>
              <div className="text-3xl font-extrabold font-display">
                Rp900.000
                <span className="text-xs font-normal opacity-60"> (Rp18.000/pcs)</span>
              </div>
              <p className="text-xs opacity-75">Cocok untuk franchise atau dijual kembali.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/20 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 shrink-0" />
                <span>Harga grosir pabrik</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 shrink-0" />
                <span>Free custom logo &amp; stand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Order Action Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-medium text-slate-500">Pilihan Anda:</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {qty} Pcs = Rp{totalPrice.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Sudah termasuk {qty} kartu + {qty} stand akrilik bening
              {hasCustomDesign && ' • Bonus Free Custom Desain Logo'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 text-center shrink-0"
            >
              <MessageCircle size={16} />
              <span>Order via WhatsApp (Lebih Murah)</span>
            </a>
            <a
              href={SHOPEE_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 text-center shrink-0"
            >
              <ShoppingBag size={16} />
              <span>Shopee</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. Custom Desain Min 25 Pcs (Focused & Clean) ─────────── */}
      <section id="custom" className="py-20 md:py-24 bg-slate-900 text-white px-5 sm:px-8 scroll-mt-12">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-cyan-300 text-xs font-semibold">
              <Palette size={13} />
              <span>Layanan Spesial Custom Brand</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Bisa Custom Desain Logo Sendiri. Minimal 25 Pcs.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Cantumkan logo brand, warna identitas toko, serta nomor meja unik (*Meja 01, Meja 02, dst.*). Hasil cetak tajam, tahan air, dan awet.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-cyan-400 shrink-0" />
                <span>Kirim file logo toko (PNG/PDF/Canva), kami siapkan preview 3D gratis.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-cyan-400 shrink-0" />
                <span>Bisa cetak penomoran meja yang berbeda di setiap kartu.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check size={16} className="text-cyan-400 shrink-0" />
                <span>Setiap kartu sudah lengkap dengan stand akrilik bening siap pasang.</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${WA_PHONE}?text=${encodeURIComponent('Halo Admin Ony, saya ingin order Custom Desain Kartu Google Review minimal 25 pcs dengan logo toko saya.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold transition-all shadow-md"
              >
                <MessageCircle size={16} />
                <span>Konsultasi Desain via WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 max-w-sm w-full space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Alur Order Custom:</h3>
                <p className="text-xs text-slate-400">Hanya 3 langkah sederhana</p>
              </div>
              <div className="text-left text-xs space-y-3 pt-2 text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Kirim materi logo via WhatsApp</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Review &amp; ACC mockup digital</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Produksi 2-3 hari &amp; dikirim ke lokasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Cara Aktivasi & Dashboard (Simple 3 Steps) ──────────── */}
      <section id="cara-kerja" className="py-20 md:py-24 px-5 sm:px-8 max-w-5xl mx-auto scroll-mt-12">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Praktis &amp; Fleksibel</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Aktivasi Cepat &amp; Bebas Ganti Link
          </h2>
          <p className="text-slate-500 text-sm">
            Bisa diaktivasi manual dalam hitungan detik, dan link bisa diubah kapan saja di Dashboard Ony.
          </p>
        </div>

        {/* ── Video Tutorial Player ── */}
        <div id="tutorial-video" className="scroll-mt-24 mb-12">
          <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-7 border border-slate-800 shadow-xl overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Video Tutorial Aktivasi &amp; Penggunaan</h3>
                  <p className="text-[11px] text-slate-400">Putar video di bawah untuk melihat proses aktivasi kartu dan pengaturan link Google Maps.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold self-start sm:self-auto">
                Video Tutorial MP4
              </span>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              <video
                src="https://file.legalpilar.id/file/ccgnimex/tutorial.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              >
                Browser Anda tidak mendukung pemutaran video HTML5.
              </video>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Tap / Scan Kartu</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dekatkan HP ke sensor NFC atau scan QR code di kartu. Halaman aktivasi otomatis terbuka.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Tempel Link Ulasan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Masukkan URL Google Maps ulasan toko Anda lalu klik aktifkan. Aktivasi bisa dilakukan manual.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Siap Dipajang di Meja</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pasang kartu pada stand akrilik bening di meja kasir. Pelanggan tinggal tap untuk review!
            </p>
          </div>
        </div>

        {/* Dashboard Ony Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 mb-1">
              <Settings size={14} /> Disediakan Dashboard Kartu yang Diatur
            </div>
            <h3 className="text-lg font-bold text-slate-900">Toko pindah atau link Google Maps berganti?</h3>
            <p className="text-xs text-slate-600 max-w-lg">
              Tidak perlu beli kartu baru. Cukup login ke Dashboard Ony dan update URL baru kapan saja seumur hidup secara gratis.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Buka Dashboard Ony
          </Link>
        </div>
      </section>

      {/* ── 6. Clean FAQ Section ──────────────────────────────────── */}
      <section id="faq" className="py-20 bg-slate-50/70 border-t border-slate-100 px-5 sm:px-8 scroll-mt-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Pertanyaan Umum
            </h2>
            <p className="text-xs text-slate-500">Hal-hal yang sering ditanyakan seputar kartu Google Review.</p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((f, i) => {
              const isOpen = activeFaq === i
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-900 hover:text-emerald-700"
                  >
                    <span>{f.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 7. Minimal Bottom Footer ──────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10 px-5 sm:px-8 bg-white text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Ony" width={85} height={24} className="h-5 w-auto object-contain" />
            <span>© 2026 Ony Ecosystem</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#harga" className="hover:text-slate-900 transition-colors">Grosir 10 Pcs</a>
            <a href="#custom" className="hover:text-slate-900 transition-colors">Custom Desain</a>
            <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
              Shopee
            </a>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
