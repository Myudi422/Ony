'use client'

import React, { useState } from 'react'
import {
  MapPin,
  HelpCircle,
  Search,
  ExternalLink,
  X,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Share2
} from 'lucide-react'

interface GoogleMapsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GoogleMapsHelpModal({ isOpen, onClose }: GoogleMapsHelpModalProps) {
  const [activeTab, setActiveTab] = useState<'maps_app' | 'search'>('maps_app')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const handleOpenMapsSearch = () => {
    if (!searchQuery.trim()) return
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery.trim())}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-display">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h3>Cara Ambil Link Google Review</h3>
                <p className="text-xs text-slate-500 font-normal">
                  Pilih cara termudah sesuai perangkat yang kamu gunakan
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold font-display">
          <button
            type="button"
            onClick={() => setActiveTab('maps_app')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
              activeTab === 'maps_app'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone size={14} className={activeTab === 'maps_app' ? 'text-blue-600' : ''} />
            <span>Maps di HP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
              activeTab === 'search'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search size={14} className={activeTab === 'search' ? 'text-emerald-600' : ''} />
            <span>Cari Toko</span>
          </button>
        </div>

        {/* Tab 1: Aplikasi Google Maps HP */}
        {activeTab === 'maps_app' && (
          <div className="space-y-3.5">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                <strong>Paling Praktis!</strong> Cukup salin tautan bagikan biasa dari Google Maps, sistem Ony akan otomatis mengonversinya menjadi URL ulasan resmi.
              </p>
            </div>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  Buka aplikasi <strong>Google Maps</strong> di HP kamu.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Cari dan ketik nama toko / bisnis kamu di kolom pencarian.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  Tarik panel bawah ke atas atau cari tombol <strong>Bagikan (Share)</strong> <Share2 size={12} className="inline text-slate-500" />.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  Pilih menu <strong>Salin Link</strong> (Copy Link). Format tautan:
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-800 break-all select-all">
                    https://maps.app.goo.gl/xxxxxx
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong>Tempel link</strong> ke kolom input Ony. Selesai!
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 2: Cari Toko Langsung */}
        {activeTab === 'search' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Ketik nama toko atau alamat bisnis kamu untuk langsung membuka pencarian di Google Maps:
            </p>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenMapsSearch()
                }}
                placeholder="Contoh: Kopi Kenangan Dago Bandung"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ony-blue text-xs text-slate-900 outline-none"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={handleOpenMapsSearch}
              disabled={!searchQuery.trim()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display"
            >
              <ExternalLink size={13} />
              <span>Buka di Google Maps</span>
            </button>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Langkah setelah lokasi terbuka:
              </p>
              <p>1. Klik tombol <strong>Bagikan (Share)</strong> pada profil toko.</p>
              <p>2. Pilih <strong>Salin Tautan</strong>.</p>
              <p>3. Tempel di kolom input link Ony.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-display transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
