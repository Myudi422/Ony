'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, CreditCard, Tag, Tv, Key, ExternalLink, CheckCircle2, MessageCircle, ShieldCheck, Truck, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const SHOPEE_STORE_URL = 'https://shopee.co.id/ony.official'
const TIKTOK_STORE_URL = 'https://www.tiktok.com/@ony.official'
const WHATSAPP_ORDER_URL = `https://wa.me/6289654728249?text=${encodeURIComponent('Halo Admin Ony, saya ingin konsultasi order custom / pesan jumlah banyak media NFC Ony.')}`

const PRODUCTS = [
  {
    id: 'nfc-card-pvc',
    icon: CreditCard,
    name: 'Ony NFC Card PVC',
    desc: 'Kartu bisnis NFC + QR digital tahan air dengan chip NTAG213 premium.',
    price: 39000,
    features: ['Chip NTAG213 Ultra', 'Custom Cetak Logo/Desain', 'Garansi Garansi Kunci 1 Tahun', 'Bisa Re-Program URL Kapan Saja'],
    shopeeUrl: SHOPEE_STORE_URL,
    tiktokUrl: TIKTOK_STORE_URL,
  },
  {
    id: 'nfc-sticker',
    icon: Tag,
    name: 'Ony NFC Sticker Waterproof',
    desc: 'Stiker NFC multifungsi tahan air untuk ditempel di casing HP, meja, atau helm.',
    price: 29000,
    features: ['Perekat Strong 3M', 'Anti-Metal Shielding Layer', 'Cetak High-Res Waterproof', 'Universal untuk Semua HP'],
    shopeeUrl: SHOPEE_STORE_URL,
    tiktokUrl: TIKTOK_STORE_URL,
  },
  {
    id: 'qr-standee',
    icon: Tv,
    name: 'Ony QR Standee Akrilik Meja',
    desc: 'Display akrilik 3mm meja untuk kasir, resto, kafe, atau meja kantor bisnis.',
    price: 99000,
    features: ['Akrilik 3mm UV Print', 'Dual Tap NFC + QR Code', 'Dudukan Kokoh Premium', 'Cocok untuk Menu & Kontak'],
    shopeeUrl: SHOPEE_STORE_URL,
    tiktokUrl: TIKTOK_STORE_URL,
  },
  {
    id: 'nfc-keychain',
    icon: Key,
    name: 'Ony NFC Keychain Epoxy',
    desc: 'Gantungan kunci elegan berdaya tahan tinggi dengan chip NFC terintegrasi.',
    price: 45000,
    features: ['Lapisan Epoxy Anti Gores', 'Ring Baja Anti Karat', 'Chip NTAG213 High Sensitivity', 'Praktis Dibawa Kemanapun'],
    shopeeUrl: SHOPEE_STORE_URL,
    tiktokUrl: TIKTOK_STORE_URL,
  },
]

export default function StorePage() {
  const [productsList, setProductsList] = useState(PRODUCTS)

  useEffect(() => {
    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(d => {
        if (d) {
          const effPrice = d.is_promo_active ? (Number(d.card_promo_price) || 39000) : (Number(d.card_base_price) || 49000)
          setProductsList(prev => prev.map(p => p.id === 'nfc-card-pvc' ? { ...p, price: effPrice } : p))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl w-full mx-auto min-w-0 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ony-blue text-xs font-bold mb-2">
          <ShoppingBag size={14} /> Official E-Commerce Store
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 font-display tracking-tight">Ony Store</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Beli media NFC & QR resmi Ony melalui Marketplace resmi pilihan kamu dengan Bebas Ongkir & Garansi Resmi.</p>
      </div>

      {/* Official Channel Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        {/* Shopee Card */}
        <div className="card-surface p-5 sm:p-6 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/50 border-orange-200/90 shadow-sm rounded-2xl flex flex-col justify-between group hover:border-orange-300 transition-all min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-md font-display">
                S
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold uppercase tracking-wider border border-orange-200">
                Shopee Mall / Official
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 font-display">Shopee Official Store</h2>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              Nikmati Promo Gratis Ongkir XTRA, Cashback Vocher, dan pembayaran COD / ShopeePayLater.
            </p>
          </div>

          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#EE4D2D] hover:bg-[#d63f21] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          >
            <ShoppingBag size={16} /> Beli di Shopee <ExternalLink size={14} />
          </a>
        </div>

        {/* TikTok Shop Card */}
        <div className="card-surface p-5 sm:p-6 bg-gradient-to-br from-slate-100/90 via-white to-slate-50 border-slate-300/90 shadow-sm rounded-2xl flex flex-col justify-between group hover:border-slate-400 transition-all min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-md font-display">
                TT
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold uppercase tracking-wider border border-slate-300">
                TikTok Shop
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 font-display">TikTok Shop Official</h2>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              Tonton demo penggunaan produk secara langsung di LIVE TikTok kami & klaim kupon diskon live.
            </p>
          </div>

          <a
            href={TIKTOK_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          >
            <Sparkles size={16} className="text-amber-400" /> Beli di TikTok Shop <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0 py-2">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <Truck size={20} className="text-ony-blue shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-900 font-bold text-xs">Bebas Ongkir</div>
            <div className="text-slate-500 text-[11px] truncate">Ke seluruh Indonesia</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-900 font-bold text-xs">Garansi Chip 1 Thn</div>
            <div className="text-slate-500 text-[11px] truncate">Jaminan fungsi 100%</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <Sparkles size={20} className="text-purple-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-900 font-bold text-xs">Siap Pakai</div>
            <div className="text-slate-500 text-[11px] truncate">Langsung sync di app</div>
          </div>
        </div>
      </div>

      {/* Products Showcase */}
      <div className="min-w-0 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">Katalog Produk Media NFC & QR</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          {productsList.map(p => {
            const Icon = p.icon
            return (
              <div key={p.id} className="card-surface p-5 flex flex-col justify-between hover:border-blue-300 transition-all min-w-0 bg-white">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-ony-blue" />
                    </div>
                    <span className="text-ony-blue font-extrabold text-sm sm:text-base font-display">
                      {formatCurrency(p.price)}
                    </span>
                  </div>

                  <h3 className="text-slate-900 font-bold text-sm sm:text-base mb-1 font-display">{p.name}</h3>
                  <p className="text-slate-600 text-xs mb-3 leading-relaxed">{p.desc}</p>

                  <ul className="space-y-1.5 mb-5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={p.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-[#EE4D2D]/10 hover:bg-[#EE4D2D]/20 text-[#EE4D2D] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    Shopee
                  </a>
                  <a
                    href={p.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    TikTok Shop
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom & Bulk Order Section */}
      <div className="card-surface p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 min-w-0 shadow-lg">
        <div>
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MessageCircle size={14} /> Corporate & Bulk Order
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">Pesan Custom Desain / Sovenir Perusahaan?</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Tim Ony melayani cetak custom nama & logo perusahaan untuk kartu karyawan, seminar, event, atau cinderamata eksklusif.
          </p>
        </div>

        <a
          href={WHATSAPP_ORDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
        >
          Hubungi Admin WhatsApp <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}
