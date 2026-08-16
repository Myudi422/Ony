'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  Wifi, Zap, BarChart2, Layers, QrCode, ShoppingBag,
  ArrowRight, Check, Menu, X, ChevronRight, Star, Shield,
  Globe, Download, CreditCard, Tag, Tv, Key,
  MessageCircle, Instagram, Linkedin, AlertCircle, XCircle, CheckCircle,
  Briefcase, Store, UserCheck, TrendingUp, Sparkles, Building
} from 'lucide-react'

import { useSession } from 'next-auth/react'

// ─── Navbar ─────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as { name?: string; role?: string; image?: string } | undefined
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 py-3 shadow-xs' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image src="/logo.png" alt="Ony" width={150} height={44} className="h-10 md:h-11 w-auto rounded object-contain transition-transform group-hover:scale-[1.02]" priority />
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ['Solusi Niche', '#problem-solution'],
            ['Cara Kerja', '#how-it-works'],
            ['Fitur', '#features'],
            ['Produk', '#products'],
            ['Perbandingan', '#comparison'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-slate-600 hover:text-ony-blue text-sm font-semibold transition-colors">
              {label}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="px-4 py-2 rounded-full text-xs font-semibold border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                  Admin Panel
                </Link>
              )}
              <Link href="/dashboard" className="btn-primary text-xs px-5 py-2.5">
                Dashboard <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-xs px-4 py-2">Login</Link>
              <Link href="/login" className="btn-primary text-xs px-5 py-2.5">Mulai Gratis</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-6 py-6 flex flex-col gap-4 shadow-xl animate-fade-up">
          {[
            ['Solusi Niche', '#problem-solution'],
            ['Cara Kerja', '#how-it-works'],
            ['Fitur', '#features'],
            ['Produk', '#products'],
            ['Perbandingan', '#comparison'],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              className="text-slate-800 text-base font-semibold py-1 border-b border-slate-100">{label}</a>
          ))}
          <div className="pt-2 flex flex-col gap-3">
            {session ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm py-3">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-ghost text-center text-sm py-3">Login</Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm py-3">Mulai Gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero NFC Animation Mockup ─────────────────────────────
function NFCAnimation() {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
      {/* Dynamic Pulse Rings */}
      <div className="nfc-ring w-56 h-56 md:w-72 md:h-72 border-blue-400/30" />
      <div className="nfc-ring w-56 h-56 md:w-72 md:h-72 border-cyan-400/30" />
      <div className="nfc-ring w-56 h-56 md:w-72 md:h-72 border-blue-400/30" />

      {/* NFC Physical Card Visual */}
      <div className="animate-float relative z-10 w-52 h-32 md:w-64 md:h-40 rounded-2xl p-4 md:p-5 shadow-2xl overflow-hidden cursor-default transition-all duration-300 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid #334155' }}>
        <div className="absolute inset-0 bg-ony-gradient opacity-20 pointer-events-none" />
        <div className="flex flex-col justify-between h-full relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-5 rounded bg-amber-400/90 border border-amber-300/40 shadow-xs" />
              <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider ml-1">ONY SMART</span>
            </div>
            <Wifi className="text-ony-cyan animate-pulse" size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-200 font-bold tracking-wide">ALEXANDRA CHEN</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">**** **** ONY 2026</div>
          </div>
        </div>
      </div>

      {/* Floating Smartphone Mockup */}
      <div className="absolute -right-2 -bottom-2 md:-right-6 md:-bottom-4 animate-float z-20"
        style={{ animationDelay: '1.5s' }}>
        <div className="w-24 h-44 md:w-28 md:h-52 rounded-[26px] bg-slate-950 border-2 border-slate-700 shadow-2xl p-1.5 flex flex-col justify-between relative overflow-hidden">
          {/* Top Notch */}
          <div className="w-8 h-1.5 bg-slate-800 rounded-full mx-auto mb-1 z-10" />
          
          {/* Screen Display */}
          <div className="flex-1 bg-gradient-to-b from-blue-50/90 to-white rounded-[20px] p-2.5 flex flex-col items-center justify-between border border-blue-100 text-center overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mt-1 shadow-xs">
              <Wifi size={14} className="text-ony-blue animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-900 leading-tight font-display">Ony Ecosystem</div>
              <div className="text-[8px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full mt-1 border border-emerald-200 inline-block">
                NFC & QR Tap
              </div>
            </div>
            <div className="w-10 h-1 bg-slate-300 rounded-full mb-0.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Niche Problems Data ─────────────────────────────
const NICHE_PROBLEMS = [
  {
    icon: XCircle,
    title: '88% Kartu Kertas Berakhir di Tempat Sampah',
    desc: 'Berapa kali kamu membagikan kartu nama kertas dan klien tidak pernah menghubungi kembali karena kartunya terselip atau hilang?',
    color: 'text-rose-500 bg-rose-50 border-rose-200',
  },
  {
    icon: XCircle,
    title: 'Kemalasan Mengetik Kontak Manual',
    desc: 'Lawan bicaramu malas mengetik 12 digit nomor HP, nama, dan email satu per satu saat networking di acara bisnis yang ramai.',
    color: 'text-orange-500 bg-orange-50 border-orange-200',
  },
  {
    icon: XCircle,
    title: 'Biaya Cetak Ulang yang Terus Berulang',
    desc: 'Setiap kali nomor WhatsApp, alamat toko, atau jabatan bisnis kamu berubah, kamu terpaksa membuang sisa kartu dan bayar biaya cetak lagi.',
    color: 'text-amber-500 bg-amber-50 border-amber-200',
  },
]

// ─── Target Audience Solutions ──────────────────────
const USE_CASES = [
  {
    icon: Briefcase,
    role: 'Pengusaha & Eksekutif',
    problem: 'Membutuhkan impresi eksklusif saat bertemu investor atau klien VIP.',
    solution: 'Cukup 1 tap kartu fisik Ony ke HP klien. Kontak & portofolio langsung tersimpan tanpa perlu aplikasi tambahan.',
    badge: 'Executive',
  },
  {
    icon: UserCheck,
    role: 'Sales & Real Estate Agent',
    problem: 'Sering kehilangan prospek di lapangan karena calon pembeli tidak menyimpan nomor telepon.',
    solution: 'Kirim link katalog jualan, nomor WhatsApp, dan lokasi properti dalam 1 detik dengan fitur 1-Tap Auto vCard Save.',
    badge: 'High Conversion',
  },
  {
    icon: Store,
    role: 'Pemilik Cafe & Retail',
    problem: 'Pengunjung sering bingung mencari menu online, ulasan Google Maps, atau program diskon.',
    solution: 'Pasang QR Standee Akrilik Ony di meja kasir. Pelanggan bisa tap NFC atau scan QR untuk order & beri ulasan.',
    badge: 'Store Growth',
  },
  {
    icon: Sparkles,
    role: 'Freelancer & Content Creator',
    problem: 'Sulit menampilkan banyak link (Instagram, TikTok, Portfolio PDF, WhatsApp) secara bersamaan.',
    solution: 'Gunakan profil digital Ony yang bisa disesuaikan secara dinamis dan dipantau analitik kliknya secara real-time.',
    badge: 'Creator Suite',
  },
]

// ─── Features Data ────────────────────────────────────
const features = [
  {
    icon: Wifi,
    title: 'NFC + QR Dual Access',
    desc: 'Satu media, satu kode aktivasi. Menjangkau seluruh smartphone melalui Tap NFC maupun Scan Kode QR.',
    color: 'from-blue-500/10 to-blue-500/5',
  },
  {
    icon: BarChart2,
    title: 'Analytics Real-time',
    desc: 'Pantau setiap interaksi tap, scan, dan klik link secara presisi dengan grafik harian & tipe perangkat.',
    color: 'from-indigo-500/10 to-indigo-500/5',
  },
  {
    icon: Layers,
    title: 'Multi-Card Management',
    desc: 'Kelola banyak kartu bisnis, personal, dan event dalam 1 akun Google tanpa batas.',
    color: 'from-purple-500/10 to-purple-500/5',
  },
  {
    icon: QrCode,
    title: 'QR Studio HD Export',
    desc: 'Generate Kode QR resolusi tinggi (PNG, SVG, PDF) siap cetak untuk stiker, banner, atau standee.',
    color: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    icon: ShoppingBag,
    title: 'Toko & Payment Midtrans',
    desc: 'Pesan media fisik tambahan (Kartu PVC, Stiker, Akrilik, Keychain) dan bayar instan via QRIS/VA.',
    color: 'from-amber-500/10 to-amber-500/5',
  },
  {
    icon: Shield,
    title: 'Keamanan Mode Hilang',
    desc: 'Fitur Report Lost instan untuk memblokir kartu yang tidak sengaja hilang agar data tetap terproteksi.',
    color: 'from-rose-500/10 to-rose-500/5',
  },
]

// ─── Physical Products Data ────────────────────────────
const products = [
  {
    name: 'NFC Card PVC',
    icon: CreditCard,
    desc: 'Kartu bisnis digital fisik PVC premium tahan air dengan Chip NTAG213 dan Kode QR tercetak.',
    customTag: 'Custom Desain & Cetak Nama',
    badge: 'Paling Populer',
    features: ['Chip NFC NTAG213', 'QR Code tercetak HD', 'Custom nama & logo brand', 'Tahan air & aus'],
  },
  {
    name: 'NFC Sticker Smart',
    icon: Tag,
    desc: 'Stiker NFC+QR adhesif kuat untuk laptop, hp, notebook, atau packaging produk kamu.',
    customTag: 'Ukuran & Bentuk Custom',
    badge: null,
    features: ['Chip NFC NTAG213', 'QR Code tercetak', 'Adhesif 3M super kuat', 'Waterproof finish'],
  },
  {
    name: 'QR Standee Akrilik',
    icon: Tv,
    desc: 'Standee akrilik 3mm UV print premium untuk meja kasir, cafe, atau booth pameran.',
    customTag: 'Bahan Akrilik UV Custom',
    badge: 'Premium',
    features: ['Akrilik 3mm UV Print', 'Embedded QR + NFC', 'Base dudukan kokoh', 'Tampilan profesional'],
  },
  {
    name: 'NFC Keychain Epoxy',
    icon: Key,
    desc: 'Gantungan kunci ring baja epoxy tangguh. Selalu bawa identitas digitalmu di mana saja.',
    customTag: 'Custom Desain Ring',
    badge: null,
    features: ['Chip NFC NTAG213', 'QR Code di belakang', 'Lapisan Epoxy bening', 'Gantungan baja tahan karat'],
  },
]

// ─── Steps Data ────────────────────────────────────────
const steps = [
  {
    step: '01',
    title: 'Tap NFC atau Scan QR',
    desc: 'Tempelkan kartu ke HP atau pindai Kode QR fisik yang ada pada media Ony.',
    icon: Wifi,
  },
  {
    step: '02',
    title: 'Aktivasi 1 Klik Google',
    desc: 'Login Google OAuth untuk menghubungkan media secara mandiri ke akun kamu.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Atur Profil & Bagikan',
    desc: 'Edit susunan link, ganti mode direct redirect, dan pantau grafik analitik interaksi.',
    icon: Globe,
  },
]

// ─── Main Landing Page ──────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-ony-blue selection:text-white">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-up">
            {/* 1. Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-ony-blue text-xs font-bold mb-5 shadow-xs font-display">
              <Wifi size={14} className="animate-pulse" />
              Stop Buang Uang untuk Kartu Nama Kertas Konvensional
            </div>

            {/* 2. Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tight font-display text-slate-900">
              Tap. <span className="ony-gradient-text font-display">Connect.</span> Close Deals.
            </h1>

            {/* 3. Subtext */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              Solusi kartu bisnis digital NFC & QR pintar. Sekali tap ke HP prospek, kontakmu langsung tersimpan tanpa perlu aplikasi tambahan.
            </p>

            {/* 4. Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center">
              <Link href="/login" id="hero-cta" className="btn-primary py-3.5 px-7 text-sm font-bold shadow-md">
                Coba Ony Sekarang
                <ArrowRight size={16} />
              </Link>
              <a href="#problem-solution" className="btn-ghost py-3.5 px-6 text-sm font-semibold">
                Mengapa Harus Ony?
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Trust badge strip under hero */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-6 border-t border-slate-200/80">
              {[
                { label: '1-Tap Auto Save vCard', icon: Download },
                { label: 'Dual Access (NFC + QR)', icon: Wifi },
                { label: '1x Bayar Selamanya', icon: Shield },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                  <Icon size={14} className="text-ony-blue shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Interactive Visual */}
          <div className="flex justify-center items-center">
            <NFCAnimation />
          </div>
        </div>
      </section>

      {/* ── Niche Problem Breakdown ─────────────────────────────── */}
      <section id="problem-solution" className="py-20 md:py-24 bg-white border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-rose-600 text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Masalah Lapangan</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Mengapa Kartu Nama Kertas Sudah Tidak Efektif?
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Metode lama menyia-nyiakan uang, waktu, dan peluang penjualan kamu di era serba cepat ini.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {NICHE_PROBLEMS.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card-surface p-7 bg-white border border-slate-200/90 hover:border-rose-200 transition-all shadow-xs">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-display leading-snug">{title}</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Solution Highlight Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-ony-gradient opacity-15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 grid lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-3 border border-blue-500/30 font-display">
                  <CheckCircle size={14} className="text-emerald-400" />
                  Solusi Pintar Ekosistem Ony
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-display leading-tight">
                  Tinggalkan Kertas. Beralih ke Kartu Fisik Pintar NFC + QR.
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                  Satu kartu fisik Ony berlaku seumur hidup. Bebas update kontak, portofolio, dan sosial media dari smartphone kamu tanpa biaya cetak tambahan.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link href="/login" className="btn-primary py-3.5 px-8 text-sm font-bold shadow-lg">
                  Mulai Gunakan Ony
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Niche Target Audience Use-Cases ─────────────────────── */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-ony-blue text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Niche Solutions</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Dirancang Spesifik untuk Profesi & Bisnis Kamu
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Lihat bagaimana Ony membantu menyelesaikan masalah komunikasi di berbagai lini bisnis.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {USE_CASES.map(({ icon: Icon, role, problem, solution, badge }) => (
              <div key={role} className="card-surface p-7 bg-white hover:border-blue-300 transition-all duration-300 group shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-ony-blue group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider font-display">
                    {badge}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">{role}</h3>
                
                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Tantangan:</strong> {problem}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-ony-blue">Solusi Ony:</strong> {solution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Visual ROI Comparison Section ─────────────────────── */}
      <section id="comparison" className="py-20 md:py-24 bg-white border-y border-slate-200/70">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold mb-3 uppercase tracking-wider font-display">
              <TrendingUp size={14} />
              Kalkulasi ROI Realistis (Simulasi 3 Tahun)
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Bandingkan Efisiensi Kartu Kertas vs Ony Smart Media
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Lihat berapa banyak uang, waktu, dan prospek bisnis yang bisa kamu hemat hanya dengan beralih ke Ony.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch mb-10">
            {/* ❌ Card 1: Traditional Paper Business Card */}
            <div className="card-surface p-7 sm:p-8 bg-slate-50/80 border-2 border-rose-200/80 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider font-display">
                    Metode Kuno
                  </span>
                  <XCircle className="text-rose-500" size={24} />
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-1 font-display">Kartu Nama Kertas Biasa</h3>
                <p className="text-slate-500 text-xs mb-6">Metode konvensional yang boros dan cepat dibuang</p>

                {/* Big Price Tag */}
                <div className="p-4 rounded-2xl bg-white border border-rose-100 mb-6 text-left shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Model Pembiayaan:</div>
                  <div className="text-2xl font-extrabold text-rose-600 font-display mt-0.5">Biaya Terus Membengkak</div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-1">
                    *Bayar cetak berulang kali setiap kali ganti nomor, posisi, atau kartu rusak
                  </div>
                </div>

                {/* Metric Items */}
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Tingkat Simpan Kontak:</span>
                    <span className="font-extrabold text-rose-600 font-mono">Hanya ~12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Fleksibilitas Update:</span>
                    <span className="font-bold text-rose-600">0% (Wajib Cetak Ulang)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Analitik Interaksi:</span>
                    <span className="font-bold text-slate-400">Buta Total (0 Data)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-slate-600 font-medium">Impresi First Meeting:</span>
                    <span className="font-bold text-slate-500">Biasa Saja / Pasif</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-rose-200/60 text-center">
                <span className="text-xs text-rose-600 font-bold">❌ Berisiko hilang di dompet atau terbuang ke sampah</span>
              </div>
            </div>

            {/* ✅ Card 2: Ony Smart NFC + QR Media */}
            <div className="card-surface p-7 sm:p-8 bg-slate-900 text-white border-2 border-blue-400/50 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-2xl scale-[1.02] transform">
              <div className="absolute top-0 right-0 w-64 h-64 bg-ony-gradient opacity-20 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-ony-gradient text-white text-xs font-extrabold uppercase tracking-wider font-display shadow-md flex items-center gap-1">
                    <Sparkles size={12} /> Pilihan 98% Eksekutif
                  </span>
                  <CheckCircle className="text-emerald-400" size={24} />
                </div>

                <h3 className="text-xl font-extrabold text-white mb-1 font-display relative z-10">Ony NFC & QR Smart Media</h3>
                <p className="text-slate-300 text-xs mb-6 relative z-10">Identitas fisik pintar berlaku seumur hidup</p>

                {/* Big Price Tag */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 mb-6 text-left shadow-lg relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Model Pembiayaan:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Sangat Efisien
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-display mt-0.5">1x Investasi Selamanya</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-1">
                    ✓ Custom desain, ukuran & variasi bahan sesuai kebutuhan bisnis kamu
                  </div>
                </div>

                {/* Metric Items */}
                <div className="space-y-3.5 text-xs sm:text-sm relative z-10">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300 font-medium">Tingkat Simpan Kontak:</span>
                    <span className="font-extrabold text-emerald-400 font-mono">~98% Auto vCard</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300 font-medium">Fleksibilitas Update:</span>
                    <span className="font-bold text-cyan-300">100% Edit Kapan Saja</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300 font-medium">Analitik Interaksi:</span>
                    <span className="font-bold text-white font-mono">Terlacak Real-Time</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-300 font-medium">Impresi First Meeting:</span>
                    <span className="font-bold text-emerald-300">Sangat Modern (Wow Factor)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 text-center relative z-10">
                <span className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                  <Check size={14} /> Kontak tersimpan instan ke buku HP prospek dalam 1 detik!
                </span>
              </div>
            </div>
          </div>

          {/* Bottom ROI Savings Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border border-blue-200/80 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="text-left">
              <div className="text-slate-900 font-extrabold text-sm sm:text-base font-display">
                💡 Kesimpulan Efisiensi Ony:
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                Kamu menghemat biaya cetak berulang jangka panjang dan meningkatkan konversi kontak tersimpan hingga <strong className="text-emerald-700 font-bold">8x lebih banyak</strong>.
              </p>
            </div>
            <Link href="/login" className="btn-primary shrink-0 py-3 px-6 text-xs font-bold shadow-md">
              Mulai Pakai Ony Sekarang <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-ony-blue text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Cara Kerja</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Semudah 3 Langkah Mandiri
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Aktifkan media fisikmu secara instan tanpa perlu instalasi aplikasi tambahan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="card-surface p-7 hover:border-blue-300 transition-all duration-300 group relative overflow-hidden bg-white">
                <div className="text-5xl font-black font-display ony-gradient-text opacity-25 mb-4">{step}</div>
                <div className="w-12 h-12 rounded-2xl bg-ony-gradient flex items-center justify-center mb-4 text-white shadow-xs group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="py-20 md:py-24 bg-white border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-ony-blue text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Fitur Unggulan</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Ekosistem Lengkap dalam Satu Dashboard
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Semua alat kontrol kartu, QR code generator, analitik interaksi, dan store terintegrasi.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="card-surface p-6 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 group bg-white"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} border border-blue-100 flex items-center justify-center mb-4 text-ony-blue group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Section ─────────────────────────── */}
      <section id="products" className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-ony-blue text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Produk Fisik</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
              Pilih Media Pintar Favoritmu
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              NFC + QR dalam 1 media fisik. Pilih bentuk sesuai kebutuhan bisnis dan gaya hidupmu.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(({ name, icon: ProductIcon, desc, customTag, badge, features: pf }) => (
              <div key={name} className="card-surface p-6 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 relative flex flex-col bg-white">
                {badge && (
                  <div className="absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-ony-gradient text-white shadow-xs tracking-wider font-display">
                    {badge}
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-ony-blue shrink-0">
                  <ProductIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-display">{name}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4 flex-1">{desc}</p>
                
                <ul className="space-y-1.5 mb-6">
                  {pf.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Check size={14} className="text-ony-blue shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-ony-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl mb-3 text-center font-display">
                    {customTag}
                  </div>
                  <Link href="/login" className="btn-primary w-full text-xs py-2.5">
                    Pesan & Custom
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Digital Profile Live Demo ───────────── */}
      <section className="py-20 bg-white border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-ony-blue text-xs font-extrabold uppercase tracking-widest mb-2 font-display">Tampilan Digital</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight font-display">
                Profil Profesional yang Siap Dipamerkan
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                Saat kartu di-tap atau QR di-scan, lawan bicaramu langsung melihat landing page profil seluler yang bersih, cepat, dan modern.
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Foto Profil, Nama, & Bio Profesional',
                  'Link Sosial Media & Tautan Kustom',
                  'Fitur vCard: Simpan kontak instan ke buku HP',
                  'Mode Direct Redirect ke 1 Link Spesifik',
                  'Analitik Real-time Setiap Klik',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
                    <Check size={18} className="text-ony-blue shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm">
                Buat Profil Sekarang
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Simulated Live Mobile Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm card-surface p-6 text-center bg-white shadow-xl border border-slate-200/90 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-ony-gradient" />

                <div className="w-20 h-20 rounded-full bg-ony-gradient mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-md font-display">
                  JD
                </div>
                <h3 className="text-slate-900 font-bold text-xl mb-0.5 font-display">John Doe</h3>
                <p className="text-ony-blue text-xs font-semibold mb-1">Senior Creative Lead</p>
                <p className="text-slate-400 text-xs mb-5">Jakarta, Indonesia</p>

                <div className="space-y-2.5 mb-4">
                  {[
                    { icon: MessageCircle, label: 'WhatsApp', color: 'from-emerald-50 to-white', border: 'border-emerald-200/60' },
                    { icon: Instagram,     label: 'Instagram', color: 'from-pink-50 to-white', border: 'border-pink-200/60' },
                    { icon: Linkedin,      label: 'LinkedIn',  color: 'from-blue-50 to-white', border: 'border-blue-200/60' },
                    { icon: Globe,         label: 'Portfolio', color: 'from-purple-50 to-white', border: 'border-purple-200/60' },
                  ].map(({ icon: LinkIcon, label, color, border }) => (
                    <div key={label}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r ${color} border ${border} cursor-pointer hover:border-blue-300 transition-colors shadow-xs`}>
                      <LinkIcon size={18} className="text-slate-700 shrink-0" />
                      <span className="text-slate-800 text-sm font-semibold">{label}</span>
                      <ChevronRight size={14} className="text-slate-400 ml-auto" />
                    </div>
                  ))}
                </div>

                <button className="w-full flex items-center justify-center gap-2 text-ony-blue text-xs font-bold py-3 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <Download size={14} />
                  Simpan Kontak (vCard)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────── */}
      <section className="py-20 md:py-24 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <div className="card-surface p-8 sm:p-14 relative overflow-hidden bg-white border border-slate-200 shadow-2xl">
            <div className="absolute inset-0 bg-ony-gradient opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-ony-gradient flex items-center justify-center mx-auto mb-5 text-white shadow-md">
                <Wifi size={26} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
                Siap untuk <span className="ony-gradient-text font-display">Beralih ke NFC Digital</span>?
              </h2>
              <p className="text-slate-600 text-base mb-8 max-w-lg mx-auto">
                Bergabung dengan pengguna Ony. Registrasi gratis dengan akun Google hanya dalam hitungan detik.
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link href="/login" id="bottom-cta" className="btn-primary text-sm px-8 py-3.5 font-bold shadow-md">
                  Mulai Gratis Sekarang
                  <ArrowRight size={16} />
                </Link>
                <a href="#products" className="btn-ghost text-sm px-8 py-3.5 font-semibold">
                  Lihat Katalog Produk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <Link href="/" className="inline-block mb-3">
                <Image src="/logo.png" alt="Ony" width={140} height={40} className="h-9 w-auto rounded object-contain" />
              </Link>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs mb-3">
                Smart NFC & QR Digital Identity Ecosystem. Tap. Connect. Go.
              </p>
              <div className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">TAP. CONNECT. GO.</div>
            </div>

            <div>
              <div className="text-slate-900 font-bold text-sm mb-4 font-display">Platform</div>
              <ul className="space-y-2.5">
                {['Solusi Niche', 'Cara Kerja', 'Fitur', 'Perbandingan'].map(l => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-600 hover:text-ony-blue text-sm font-medium transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-slate-900 font-bold text-sm mb-4 font-display">Produk</div>
              <ul className="space-y-2.5">
                {['NFC Card PVC', 'NFC Sticker', 'QR Standee', 'NFC Keychain'].map(l => (
                  <li key={l}>
                    <a href="#products" className="text-slate-600 hover:text-ony-blue text-sm font-medium transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs font-medium">© 2026 Ony Ecosystem. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Support'].map(l => (
                <a key={l} href="#" className="text-slate-500 hover:text-slate-900 text-xs font-medium transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
