'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  Wifi, Zap, BarChart2, Layers, QrCode, ShoppingBag,
  ArrowRight, Check, Menu, X, ChevronRight, Star, Shield,
  Globe, Download, CreditCard, Tag, Tv, Key,
  MessageCircle, Instagram, Linkedin
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
            ['Cara Kerja', '#how-it-works'],
            ['Fitur', '#features'],
            ['Produk', '#products'],
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
            ['Cara Kerja', '#how-it-works'],
            ['Fitur', '#features'],
            ['Produk', '#products'],
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
    price: 'Rp 89.000',
    badge: 'Paling Populer',
    features: ['Chip NFC NTAG213', 'QR Code tercetak HD', 'Custom nama/brand', 'Tahan air & aus'],
  },
  {
    name: 'NFC Sticker Smart',
    icon: Tag,
    desc: 'Stiker NFC+QR adhesif kuat untuk laptop, hp, notebook, atau packaging produk kamu.',
    price: 'Rp 39.000',
    badge: null,
    features: ['Chip NFC NTAG213', 'QR Code tercetak', 'Adhesif 3M kuat', 'Waterproof finish'],
  },
  {
    name: 'QR Standee Akrilik',
    icon: Tv,
    desc: 'Standee akrilik 3mm UV print premium untuk meja kasir, cafe, atau booth pameran.',
    price: 'Rp 149.000',
    badge: 'Premium',
    features: ['Akrilik 3mm UV Print', 'Embedded QR + NFC', 'Base dudukan kokoh', 'Tampilan profesional'],
  },
  {
    name: 'NFC Keychain Epoxy',
    icon: Key,
    desc: 'Gantungan kunci ring baja epoxy tangguh. Selalu bawa identitas digitalmu di mana saja.',
    price: 'Rp 59.000',
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-ony-blue text-xs font-bold mb-5 shadow-xs">
              <Wifi size={14} className="animate-pulse" />
              Satu Kartu. NFC + QR Digital Identity.
            </div>

            {/* 2. Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tight font-display text-slate-900">
              Tap. <span className="ony-gradient-text">Connect.</span> Go.
            </h1>

            {/* 3. Subtext (Max 20 words) */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              Hubungkan identitas fisikmu ke dunia digital. Satu tap NFC atau scan QR langsung membuka profil lengkap dan analytics real-time.
            </p>

            {/* 4. Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center">
              <Link href="/login" id="hero-cta" className="btn-primary py-3.5 px-7 text-sm font-bold shadow-md">
                Mulai Gratis
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-ghost py-3.5 px-6 text-sm font-semibold">
                Lihat Cara Kerja
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Trust badge strip under hero */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-6 border-t border-slate-200/80">
              {[
                { label: '10.000+ Active Users', icon: Star },
                { label: 'Dual Access (NFC + QR)', icon: Wifi },
                { label: 'Midtrans Payment', icon: Shield },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
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

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-24 bg-white border-y border-slate-200/70">
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
            {steps.map(({ step, title, desc, icon: Icon }, i) => (
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
      <section id="features" className="py-20 md:py-24 bg-slate-50">
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
      <section id="products" className="py-20 md:py-24 bg-white border-y border-slate-200/70">
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
            {products.map(({ name, icon: ProductIcon, desc, price, badge, features: pf }) => (
              <div key={name} className="card-surface p-6 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 relative flex flex-col bg-white">
                {badge && (
                  <div className="absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-ony-gradient text-white shadow-xs tracking-wider">
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
                  <div className="text-2xl font-extrabold text-slate-900 font-display mb-3">{price}</div>
                  <Link href="/login" className="btn-primary w-full text-xs py-2.5">
                    Pesan Sekarang
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Digital Profile Live Demo ───────────── */}
      <section className="py-20 bg-slate-50">
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
      <section className="py-20 md:py-24 bg-white border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <div className="card-surface p-8 sm:p-14 relative overflow-hidden bg-white border border-slate-200 shadow-2xl">
            <div className="absolute inset-0 bg-ony-gradient opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-ony-gradient flex items-center justify-center mx-auto mb-5 text-white shadow-md">
                <Wifi size={26} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">
                Siap untuk <span className="ony-gradient-text">Beralih ke NFC Digital</span>?
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
                {['Cara Kerja', 'Fitur', 'Analytics', 'Store'].map(l => (
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
