'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  Wifi, Zap, BarChart2, Layers, QrCode, ShoppingBag,
  ArrowRight, Check, Menu, X, ChevronRight, Star, Shield,
  Globe, Download, CreditCard, Tag, Tv, Key,
  MessageCircle, Instagram, Linkedin, Store, UserCheck, TrendingUp, Sparkles, Building, MapPin, ExternalLink, Sliders
} from 'lucide-react'

import { useSession } from 'next-auth/react'

// ─── Airbnb-style Clean Navbar ─────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as { name?: string; role?: string; image?: string } | undefined
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-3.5 shadow-2xs' : 'bg-white/50 backdrop-blur-xs py-5 border-b border-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.png" alt="Ony" width={130} height={38} className="h-9 w-auto object-contain transition-opacity group-hover:opacity-80" priority />
        </Link>

        {/* Minimalist Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-7">
          {[
            ['Cara Kerja', '#how-it-works'],
            ['Kategori', '#use-cases'],
            ['Fitur', '#features'],
            ['Google Review', '#qr-review'],
            ['Perbandingan', '#comparison'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition-colors">
              {label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="px-3.5 py-2 rounded-full text-xs font-semibold border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                  Admin Panel
                </Link>
              )}
              <Link href="/dashboard" className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
                Dashboard <ArrowRight size={13} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors">Login</Link>
              <Link href="/login" className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs">Mulai Gratis</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-5 py-5 flex flex-col gap-3 shadow-lg animate-fade-in">
          {[
            ['Cara Kerja', '#how-it-works'],
            ['Kategori', '#use-cases'],
            ['Fitur', '#features'],
            ['Google Review', '#qr-review'],
            ['Perbandingan', '#comparison'],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              className="text-slate-800 text-sm font-medium py-1.5 border-b border-slate-100">{label}</a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {session ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="w-full text-center py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full text-center py-2.5 text-slate-700 text-xs font-semibold">Login</Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full text-center py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Mulai Gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Minimalist NFC Interactive Visual ──────────────────────
function NFCAnimation() {
  return (
    <div className="relative w-full max-w-sm mx-auto flex items-center justify-center p-4">
      {/* Outer subtle shadow container */}
      <div className="w-full bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl text-white space-y-4">
        {/* Header line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider">ONY SMART MEDIA</span>
          </div>
          <Wifi className="text-cyan-400" size={18} />
        </div>

        {/* Card Body Mockup */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Pemilik Kartu</div>
            <div className="text-sm font-bold text-white font-display mt-0.5">Alexandra Chen</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: ONY-8829-PRO</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
            <Zap size={20} />
          </div>
        </div>

        {/* Phone Receiver Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Check size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white font-display">1-Tap Connected</div>
            <div className="text-[10px] text-slate-400 truncate">vCard tersimpan otomatis ke Kontak HP</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Category Showcase Modes (Airbnb Pill Selector) ─────────
const CATEGORIES = [
  {
    id: 'business-card',
    name: 'Business Card',
    icon: CreditCard,
    title: 'NFC Business Card Physical',
    desc: 'Cukup 1 tap kartu fisik ke HP prospek. Kontak WhatsApp, profil, dan media sosial tersimpan tanpa aplikasi tambahan.',
    target: 'Eksekutif, Sales, Real Estate, Business Owner',
    badge: 'Populer',
  },
  {
    id: 'review-card',
    name: 'Google Review',
    icon: Star,
    title: 'QR Google Review Display',
    desc: 'Bantu pelanggan toko & restoran memberikan ulasan Google dalam 1 scan QR. Tanpa ribet cari alamat Maps manual.',
    target: 'Kafe, Restoran, Salon, Klinik, Retail',
    badge: 'Favorit UMKM',
  },
  {
    id: 'custom-link',
    name: 'Custom Profile Link',
    icon: Layers,
    title: 'Multi-Link Profile Digital',
    desc: 'Tampilkan semua tautan portofolio, Instagram, TikTok, & WhatsApp dalam 1 link page bersih dan cepat.',
    target: 'Freelancer, Creator, Event Organizer',
    badge: 'Serbaguna',
  },
  {
    id: 'qr-standee',
    name: 'QR Standee Akrilik',
    icon: Tv,
    title: 'Akrilik Display Kasir & Meja',
    desc: 'Standee meja berbahan akrilik 3mm UV print dengan chip NFC & QR Code. Cocok untuk meja kasir & customer service.',
    target: 'Cafe Meja, Front Desk Hotel, Exhibition Booth',
    badge: 'Premium Display',
  },
]

// ─── Main Landing Page ──────────────────────────────────────
export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('business-card')
  const currentCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Navbar />

      {/* ── 1. Clean Airbnb-style Hero Section ──────────────── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Platform Media NFC & QR Digital Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-[1.1]">
              Satu Kartu Pintar untuk Semua Kontak & Identitas Kamu.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Beralih dari kartu nama kertas yang boros. Sekali tap NFC atau scan QR, kontak & portofoliomu langsung tersimpan di smartphone prospek.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login"
                id="hero-cta"
                className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all text-center flex items-center justify-center gap-2"
              >
                Mulai Pakai Ony Gratis <ArrowRight size={16} />
              </Link>
              <a
                href="https://shopee.co.id/onynfc"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold transition-all text-center flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Order Kartu Fisik Shopee
              </a>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg text-xs">
              <div>
                <div className="font-bold text-slate-900 text-base font-display">1-Tap Save</div>
                <div className="text-slate-500">vCard Auto-Save</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base font-display">NFC + QR</div>
                <div className="text-slate-500">Dual Access</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base font-display">1x Bayar</div>
                <div className="text-slate-500">Tanpa Biaya Langganan</div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual */}
          <div className="lg:col-span-5">
            <NFCAnimation />
          </div>
        </div>
      </section>

      {/* ── 2. Category Selector (Airbnb Tab Style) ─────────── */}
      <section id="use-cases" className="py-16 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display mb-2">
              Pilih Solusi Sesuai Kebutuhan Bisnis
            </h2>
            <p className="text-slate-600 text-sm">
              Satu ekosistem media pintar Ony mendukung berbagai skenario penggunaan.
            </p>
          </div>

          {/* Pill Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const isActive = cat.id === activeCategory
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon size={15} />
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Active Category Details Card */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                {currentCat.badge}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">{currentCat.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{currentCat.desc}</p>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                <UserCheck size={14} className="text-slate-400" />
                <span>Cocok untuk: <strong className="text-slate-800">{currentCat.target}</strong></span>
              </div>
            </div>
            <a
              href="https://shopee.co.id/onynfc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              Lihat di Shopee <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works (3 Steps) ───────────────────────── */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cara Kerja</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
            3 Langkah Mudah Menghubungkan Kartu
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Tap atau Scan',
              desc: 'Tempelkan kartu NFC ke bagian belakang smartphone atau scan Kode QR.',
              icon: Wifi,
            },
            {
              step: '02',
              title: 'Klaim Akun Google',
              desc: 'Login 1-klik dengan akun Google untuk menghubungkan kartu secara aman.',
              icon: Zap,
            },
            {
              step: '03',
              title: 'Atur Profil & Siap Pakai',
              desc: 'Masukkan nomor kontak, link sosial media, atau direct link sesuai keinginan.',
              icon: Globe,
            },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono">LANGKAH {step}</span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <Icon size={18} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">{title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Core Features Grid ───────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fitur Utama</div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
              Semua Fitur Kelola Kartu dalam Satu Tempat
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Wifi,
                title: 'Dual Access (NFC + QR)',
                desc: 'Mendukung semua tipe smartphone lewat tap sensor NFC maupun scan QR Code.',
              },
              {
                icon: BarChart2,
                title: 'Analitik Interaksi Real-time',
                desc: 'Pantau jumlah tap dan klik link profil kamu langsung dari dashboard.',
              },
              {
                icon: Layers,
                title: 'Multi-Media Management',
                desc: 'Kelola banyak kartu bisnis, stiker, dan standee dalam satu akun Google.',
              },
              {
                icon: QrCode,
                title: 'Export QR Studio HD',
                desc: 'Download file QR Code kualitas cetak tinggi (PNG & Vector) siap pakai.',
              },
              {
                icon: Shield,
                title: 'Mode Proteksi Kartu Hilang',
                desc: 'Kunci atau matikan kartu fisik secara instan jika hilang agar data tetap aman.',
              },
              {
                icon: ShoppingBag,
                title: 'Official Store Integration',
                desc: 'Pesan kartu tambahan atau gantungan akrilik baru dengan mudah.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Minimalist Comparison (Paper vs Ony) ─────────── */}
      <section id="comparison" className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perbandingan Efisiensi</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
            Mengapa Memilih Ony Smart Media?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Paper card */}
          <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kartu Kertas Konvensional</div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Boros & Mudah Hilang</h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <X size={15} className="text-rose-500 shrink-0" />
                Cetak berulang setiap kali nomor atau jabatan berubah
              </li>
              <li className="flex items-center gap-2">
                <X size={15} className="text-rose-500 shrink-0" />
                80%+ kartu terbuang tanpa disimpan penerima
              </li>
              <li className="flex items-center gap-2">
                <X size={15} className="text-rose-500 shrink-0" />
                Lawan bicara harus mengetik nomor HP manual
              </li>
              <li className="flex items-center gap-2">
                <X size={15} className="text-rose-500 shrink-0" />
                Tidak ada statistik data berapa kali kartu dibaca
              </li>
            </ul>
          </div>

          {/* Ony card */}
          <div className="p-7 rounded-3xl bg-slate-900 text-white space-y-4 shadow-lg border border-slate-800">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ony Smart Media</div>
            <h3 className="text-xl font-bold text-white font-display">1 Kartu Berlaku Seumur Hidup</h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400 shrink-0" />
                Bebas edit kontak & link profil kapan saja gratis
              </li>
              <li className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400 shrink-0" />
                Kontak tersimpan otomatis 1-tap via vCard
              </li>
              <li className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400 shrink-0" />
                Analitik tap & scan terpantau di dashboard
              </li>
              <li className="flex items-center gap-2">
                <Check size={15} className="text-emerald-400 shrink-0" />
                Desain fisik modern & profesional saat networking
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Clean CTA ─────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            Siap Memodernisasi Kartu Bisnismu?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Gunakan Ony gratis sekarang dengan akun Google. Siapkan kartu pintar pertamamu dalam hitungan detik.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/login"
              id="bottom-cta"
              className="px-7 py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Mulai Gratis <ArrowRight size={16} />
            </Link>
            <a
              href="https://shopee.co.id/onynfc"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              Order Kartu di Shopee <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. Airbnb-style Minimalist Footer ───────────────── */}
      <footer className="border-t border-slate-200 py-10 bg-white text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Ony" width={110} height={32} className="h-7 w-auto object-contain" />
            <span className="text-slate-400">|</span>
            <span>© 2026 Ony Ecosystem. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">Cara Kerja</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Fitur</a>
            <a href="#use-cases" className="hover:text-slate-900 transition-colors">Kategori</a>
            <a href="https://shopee.co.id/onynfc" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Shopee Store</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
