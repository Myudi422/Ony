'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  Wifi, Zap, BarChart2, Layers, QrCode, ShoppingBag,
  ArrowRight, Check, Menu, X, ChevronRight, Star, Shield,
  Smartphone, Globe, Download, CreditCard, Tag, Tv, Key,
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
      scrolled ? 'bg-white/85 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-xs' : 'py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Full Logo image without text */}
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Ony" width={160} height={48} className="h-11 md:h-12 w-auto rounded object-contain" priority />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {[['Cara Kerja', '#how-it-works'], ['Fitur', '#features'], ['Produk', '#products']].map(([label, href]) => (
            <a key={href} href={href} className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="btn-ghost text-sm px-4 py-2 border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100">
                  Admin Panel
                </Link>
              )}
              <Link href="/dashboard" className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
                Dashboard <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
              <Link href="/login" className="btn-primary text-sm px-5 py-2">Mulai Gratis</Link>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-slate-600 hover:text-slate-900"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex flex-col gap-4 shadow-lg">
          {[['Cara Kerja', '#how-it-works'], ['Fitur', '#features'], ['Produk', '#products']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              className="text-slate-700 text-sm font-semibold">{label}</a>
          ))}
          {session ? (
            <Link href="/dashboard" className="btn-primary text-center text-sm">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-primary text-center text-sm">Mulai Gratis</Link>
          )}
        </div>
      )}
    </nav>
  )
}

// ─── Hero NFC Animation ───────────────────────────────
function NFCAnimation() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      {/* Rings */}
      <div className="nfc-ring w-48 h-48 md:w-64 md:h-64 border-blue-200/50" />
      <div className="nfc-ring w-48 h-48 md:w-64 md:h-64 border-blue-200/50" />
      <div className="nfc-ring w-48 h-48 md:w-64 md:h-64 border-blue-200/50" />

      {/* Card */}
      <div className="animate-float relative z-10 w-44 h-28 md:w-56 md:h-36 rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', border: '1px solid #334155' }}>
        <div className="absolute inset-0 bg-ony-gradient opacity-20" />
        <div className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <div className="w-6 h-4 rounded bg-amber-400/80" />
              <div className="w-6 h-4 rounded bg-amber-400/40" />
            </div>
            <Wifi className="text-ony-cyan opacity-90" size={18} />
          </div>
          <div>
            <div className="text-xs text-slate-300 font-semibold mb-0.5">John Doe</div>
            <div className="text-[10px] text-slate-400 font-mono">**** **** **** 1337</div>
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="absolute -right-8 -bottom-4 md:-right-12 md:-bottom-6 animate-float"
        style={{ animationDelay: '1.5s' }}>
        <div className="w-20 h-36 md:w-24 md:h-44 rounded-[22px] bg-slate-900 border-2 border-slate-700 shadow-2xl p-1.5 flex flex-col justify-between relative overflow-hidden">
          {/* Speaker Notch */}
          <div className="w-6 h-1 bg-slate-700 rounded-full mx-auto mb-1 z-10" />
          
          {/* Screen Content */}
          <div className="flex-1 bg-gradient-to-b from-blue-50 to-white rounded-[16px] p-2 flex flex-col items-center justify-between border border-blue-100 text-center overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
              <Wifi size={12} className="text-ony-blue animate-pulse" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-800 leading-tight">Ony NFC</div>
              <div className="text-[7px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded mt-0.5 border border-emerald-100">Tap Active</div>
            </div>
            <div className="w-8 h-1 bg-slate-300 rounded-full mb-0.5" />
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
    title: 'NFC + QR Satu Media',
    desc: 'Satu kartu, satu kode aktivasi. Tap NFC atau scan QR — keduanya membuka profil yang sama.',
    color: 'from-blue-500/10 to-transparent',
  },
  {
    icon: BarChart2,
    title: 'Analytics Real-time',
    desc: 'Pantau setiap tap, scan, dan klik link. Grafik harian, mingguan, bulanan tersedia di dashboard.',
    color: 'from-indigo-500/10 to-transparent',
  },
  {
    icon: Layers,
    title: 'Multi-Card Management',
    desc: 'Kelola banyak kartu dalam satu akun Google. Kartu bisnis, personal, event — semua terpusat.',
    color: 'from-purple-500/10 to-transparent',
  },
  {
    icon: QrCode,
    title: 'QR Code HD',
    desc: 'Generate QR code resolusi tinggi. Download PNG, SVG, atau PDF — siap cetak untuk stiker & standee.',
    color: 'from-emerald-500/10 to-transparent',
  },
  {
    icon: ShoppingBag,
    title: 'Toko & Pembayaran',
    desc: 'Beli kartu NFC, stiker, standee, dan keychain langsung dari dashboard. Bayar via QRIS, GoPay, VA.',
    color: 'from-amber-500/10 to-transparent',
  },
  {
    icon: Shield,
    title: 'Aman & Terlindungi',
    desc: 'Login Google OAuth, enkripsi data, mode hilang untuk blokir kartu yang tidak sengaja terlepas.',
    color: 'from-rose-500/10 to-transparent',
  },
]

// ─── Products Data (Using Lucide Icons) ────────────────
const products = [
  {
    name: 'NFC Card PVC',
    icon: CreditCard,
    desc: 'Kartu bisnis digital. Chip NFC + QR Code tercetak. Bahan premium PVC.',
    price: 'Rp 89.000',
    badge: 'Terlaris',
    features: ['Chip NFC NTAG213', 'QR Code tercetak', 'Custom desain', 'Tahan air'],
  },
  {
    name: 'NFC Sticker',
    icon: Tag,
    desc: 'Tempel di laptop, notebook, atau produk. NFC + QR dalam satu stiker premium.',
    price: 'Rp 39.000',
    badge: null,
    features: ['Chip NFC NTAG213', 'QR Code tercetak', 'Adhesif kuat', 'Waterproof'],
  },
  {
    name: 'QR Standee Akrilik',
    icon: Tv,
    desc: 'Standee akrilik elegan untuk meja kantor, café, atau event. QR + NFC.',
    price: 'Rp 149.000',
    badge: 'Premium',
    features: ['Akrilik 3mm', 'QR + NFC embedded', 'Base besi premium', 'UV print'],
  },
  {
    name: 'NFC Keychain',
    icon: Key,
    desc: 'Gantungan kunci dengan chip NFC. Selalu bawa profil digital di mana saja.',
    price: 'Rp 59.000',
    badge: null,
    features: ['Chip NFC NTAG213', 'QR Code belakang', 'Epoxy finish', 'Ring baja'],
  },
]

// ─── Steps ────────────────────────────────────────────
const steps = [
  {
    step: '01',
    title: 'Tap atau Scan',
    desc: 'Sentuhkan kartu ke HP, atau scan QR Code yang ada di kartu/stiker kamu.',
    icon: Wifi,
  },
  {
    step: '02',
    title: 'Aktivasi & Login',
    desc: 'Login dengan Google dalam 1 klik. Kartu langsung terhubung ke akun kamu.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Kelola & Share',
    desc: 'Edit profil, atur link, pantau analytics. Share ke siapa saja — tinggal tap.',
    icon: Globe,
  },
]

// ─── Main Page ────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Bg gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
              <Wifi size={14} />
              NFC + QR Smart Card Platform
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
              <span className="ony-gradient-text">Tap.</span>{' '}
              <span className="text-slate-900">Connect.</span>{' '}
              <span className="ony-gradient-text">Go.</span>
            </h1>

            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Kartu pintar NFC & QR digital yang menghubungkan identitas fisikmu ke dunia digital.
              Satu tap, profil lengkap, analytics real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" id="hero-cta" className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-6">
                Mulai Gratis
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-ghost flex items-center justify-center gap-2 text-base py-3.5 px-6">
                Lihat Cara Kerja
                <ChevronRight size={18} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-10">
              {[
                { label: '10K+ Pengguna', icon: Star },
                { label: 'NFC + QR 1 Media', icon: Wifi },
                { label: 'Analytics Realtime', icon: BarChart2 },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Icon size={14} className="text-ony-blue" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex justify-center">
            <NFCAnimation />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-ony-blue text-xs font-bold uppercase tracking-widest mb-3">Cara Kerja</div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Semudah 3 Langkah
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              Dari kartu fisik ke profil digital dalam hitungan detik.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent z-10 -translate-y-1/2" style={{ width: 'calc(100% - 3rem)', left: '3rem' }} />
                )}
                <div className="card-surface p-8 hover:border-blue-300 transition-all group bg-white">
                  <div className="text-6xl font-black ony-gradient-text opacity-30 mb-4">{step}</div>
                  <div className="w-12 h-12 rounded-xl bg-ony-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-ony-blue text-xs font-bold uppercase tracking-widest mb-3">Fitur Lengkap</div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Semua yang Kamu Butuhkan
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              Satu platform untuk manajemen NFC, QR, profil digital, dan analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="card-surface p-6 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 group cursor-default bg-white"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-ony-blue" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────── */}
      <section id="products" className="py-20 md:py-28 bg-white border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-ony-blue text-xs font-bold uppercase tracking-widest mb-3">Produk Fisik</div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Pilih Media Smart-mu
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              NFC + QR dalam satu media. Tersedia dalam berbagai format sesuai kebutuhan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(({ name, icon: ProductIcon, desc, price, badge, features: pf }) => (
              <div key={name} className="card-surface p-6 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 relative flex flex-col bg-white">
                {badge && (
                  <div className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full bg-ony-gradient text-white shadow-xs">
                    {badge}
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-ony-blue">
                  <ProductIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">{desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {pf.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Check size={14} className="text-ony-blue shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <div className="text-2xl font-bold ony-gradient-text mb-3">{price}</div>
                  <Link href="/login" className="block text-center btn-primary text-sm py-2.5">
                    Pesan Sekarang
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Profile Preview ────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-ony-blue text-xs font-bold uppercase tracking-widest mb-3">Digital Profile</div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                Profil yang Terkesan Professional
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Saat kartu di-tap atau QR di-scan, pengunjung langsung melihat profil digital kamu yang lengkap.
                Avatar, nama, bio, dan semua link dalam satu halaman mobile-first yang elegan.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Avatar & bio profesional',
                  'Link WhatsApp, Instagram, LinkedIn, Website',
                  'vCard — simpan kontak ke HP pengunjung',
                  'Redirect langsung ke link tertentu',
                  'Analytics tiap klik link',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                    <Check size={16} className="text-ony-blue shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm">
                Buat Profil Digital
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Profile Mock (Using Lucide Icons) */}
            <div className="flex justify-center">
              <div className="w-72 card-surface p-6 text-center bg-white shadow-lg border border-slate-200">
                <div className="w-20 h-20 rounded-full bg-ony-gradient mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                  JD
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-1">John Doe</h3>
                <p className="text-slate-600 text-sm font-medium mb-1">Product Designer</p>
                <p className="text-slate-400 text-xs mb-5">Jakarta, Indonesia</p>

                <div className="space-y-2.5">
                  {[
                    { icon: MessageCircle, label: 'WhatsApp', color: 'from-emerald-500/10' },
                    { icon: Instagram, label: 'Instagram', color: 'from-pink-500/10' },
                    { icon: Linkedin, label: 'LinkedIn', color: 'from-blue-500/10' },
                    { icon: Globe, label: 'Portfolio', color: 'from-purple-500/10' },
                  ].map(({ icon: LinkIcon, label, color }) => (
                    <div key={label}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${color} to-slate-50 border border-slate-200/80 cursor-pointer hover:border-blue-300 transition-colors`}>
                      <LinkIcon size={18} className="text-slate-700 shrink-0" />
                      <span className="text-slate-800 text-sm font-semibold">{label}</span>
                      <ChevronRight size={14} className="text-slate-400 ml-auto" />
                    </div>
                  ))}
                </div>

                <button className="mt-4 w-full flex items-center justify-center gap-2 text-ony-blue text-sm font-semibold py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <Download size={14} />
                  Simpan Kontak
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="card-surface p-12 md:p-16 relative overflow-hidden bg-white border border-slate-200 shadow-xl">
            <div className="absolute inset-0 bg-ony-gradient opacity-5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-ony-gradient flex items-center justify-center mx-auto mb-6 shadow-md">
                <Wifi size={28} className="text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Siap untuk <span className="ony-gradient-text">Connect</span>?
              </h2>
              <p className="text-slate-600 text-lg mb-8 max-w-lg mx-auto">
                Bergabung dengan ribuan pengguna yang sudah beralih ke kartu digital.
                Mulai gratis, upgrade kapan saja.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" id="bottom-cta" className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3.5">
                  Mulai Gratis Sekarang
                  <ArrowRight size={18} />
                </Link>
                <a href="#products" className="btn-ghost flex items-center justify-center gap-2 text-base px-8 py-3.5">
                  Lihat Produk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Image src="/logo.png" alt="Ony" width={140} height={42} className="h-10 w-auto rounded object-contain" />
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                Smart NFC & QR digital identity platform. Tap. Connect. Go.
              </p>
              <div className="text-xs text-slate-400 font-bold tracking-wider mt-4">TAP. CONNECT. GO.</div>
            </div>

            <div>
              <div className="text-slate-900 font-bold text-sm mb-4">Platform</div>
              <ul className="space-y-2.5">
                {['Cara Kerja', 'Fitur', 'Analytics', 'Store'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-slate-900 font-bold text-sm mb-4">Produk</div>
              <ul className="space-y-2.5">
                {['NFC Card PVC', 'NFC Sticker', 'QR Standee', 'NFC Keychain', 'Digital QR'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs font-medium">© 2026 Ony. All rights reserved.</p>
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
