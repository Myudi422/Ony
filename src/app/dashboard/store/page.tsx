'use client'

import { ShoppingBag, ExternalLink, MessageCircle, ShieldCheck, Truck, Star } from 'lucide-react'

const SHOPEE_STORE_URL = 'https://shopee.co.id/onynfc'
const WHATSAPP_ORDER_URL = `https://wa.me/6289654728249?text=${encodeURIComponent('Halo Admin Ony, saya ingin konsultasi order custom / pesan jumlah banyak media NFC Ony.')}`

export default function StorePage() {
  return (
    <div className="max-w-5xl w-full mx-auto min-w-0 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ony-blue text-xs font-bold mb-2">
          <ShoppingBag size={14} /> Official E-Commerce Store
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 font-display tracking-tight">Ony Store</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Beli media NFC &amp; QR resmi Ony langsung di Shopee Official Store — Bebas Ongkir, COD tersedia, Garansi Resmi.</p>
      </div>

      {/* Shopee Hero Card */}
      <div className="card-surface p-8 sm:p-10 bg-gradient-to-br from-orange-50 via-white to-amber-50/60 border-orange-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-6 group hover:border-orange-300 transition-all min-w-0">
        <div className="w-20 h-20 rounded-3xl bg-[#EE4D2D] text-white flex items-center justify-center font-extrabold text-4xl shadow-xl font-display">
          S
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[11px] uppercase tracking-wider border border-orange-200 mb-3">
            Shopee Official Store
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 font-display">shopee.co.id/onynfc</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Semua produk media NFC &amp; QR Ony tersedia di Shopee dengan promo Gratis Ongkir XTRA, Cashback, COD, dan ShopeePayLater.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {['⭐ Gratis Ongkir XTRA', '💳 COD & ShopeePayLater', '✅ Garansi Chip 1 Tahun', '🔒 Shopee Buyer Protection'].map(badge => (
            <span key={badge} className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 font-semibold">{badge}</span>
          ))}
        </div>
        <a
          href={SHOPEE_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-xs py-4 px-6 rounded-2xl bg-[#EE4D2D] hover:bg-[#d63f21] text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <ShoppingBag size={18} /> Buka Shopee Ony <ExternalLink size={15} />
        </a>
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
          <Star size={20} className="text-amber-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-900 font-bold text-xs">Rating ⭐ 4.9/5</div>
            <div className="text-slate-500 text-[11px] truncate">Ribuan ulasan positif</div>
          </div>
        </div>
      </div>

      {/* Custom & Bulk Order Section */}
      <div className="card-surface p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 min-w-0 shadow-lg">
        <div>
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MessageCircle size={14} /> Corporate &amp; Bulk Order
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-display">Pesan Custom Desain / Sovenir Perusahaan?</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Tim Ony melayani cetak custom nama &amp; logo perusahaan untuk kartu karyawan, seminar, event, atau cinderamata eksklusif.
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
