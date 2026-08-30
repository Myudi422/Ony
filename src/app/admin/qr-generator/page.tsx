'use client'

import { useEffect, useRef, useState } from 'react'
import {
  QrCode,
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Upload,
  CheckCircle2,
  ExternalLink,
  Eye,
  Sliders,
  Trash2,
  CopyCheck,
  Layers,
  Smartphone,
  Settings,
} from 'lucide-react'
import {
  CustomCardConfig,
  DEFAULT_CUSTOM_CONFIG,
  generateCustomFrontCanvas,
  generateCustomBackCanvas,
  downloadCustomFrontPNG,
  downloadCustomBackPNG,
  downloadCustomDuplexPDF,
  downloadCustomZIP,
} from '@/lib/custom-card-generator'

export default function AdminQrGeneratorPage() {
  const [config, setConfig] = useState<CustomCardConfig>(DEFAULT_CUSTOM_CONFIG)
  const [exportQty, setExportQty] = useState<number>(1)
  const [isExporting, setIsExporting] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<'form' | 'preview'>('form')
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Canvas Refs for Live Preview
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ message, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const toast = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
  }

  // Re-render Live Canvases when config changes
  useEffect(() => {
    let isMounted = true

    async function renderPreviews() {
      try {
        const frontCanvas = await generateCustomFrontCanvas(config)
        if (frontCanvasRef.current && isMounted) {
          const ctx = frontCanvasRef.current.getContext('2d')
          if (ctx) {
            frontCanvasRef.current.width = frontCanvas.width
            frontCanvasRef.current.height = frontCanvas.height
            ctx.drawImage(frontCanvas, 0, 0)
          }
        }

        const backCanvas = await generateCustomBackCanvas(config)
        if (backCanvasRef.current && isMounted) {
          const ctx = backCanvasRef.current.getContext('2d')
          if (ctx) {
            backCanvasRef.current.width = backCanvas.width
            backCanvasRef.current.height = backCanvas.height
            ctx.drawImage(backCanvas, 0, 0)
          }
        }
      } catch (err) {
        console.error('Error rendering live preview canvas:', err)
      }
    }

    renderPreviews()
    return () => {
      isMounted = false
    }
  }, [config])

  // Handle Front Card Image Upload
  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, frontBgImage: reader.result as string }))
      toast.success('Desain Tampak Depan berhasil dimuat!')
    }
    reader.readAsDataURL(file)
  }

  // Handle Back Card Image Upload
  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, backBgImage: reader.result as string }))
      toast.success('Desain Tampak Belakang berhasil dimuat!')
    }
    reader.readAsDataURL(file)
  }

  // Handle QR Center Logo Upload
  const handleCenterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        centerLogoUrl: reader.result as string,
        qrCenterLogo: true,
        centerLogoSize: 28,
      }))
      toast.success('Logo Tengah QR Code berhasil dimuat!')
    }
    reader.readAsDataURL(file)
  }

  // Download Actions
  const handleDownloadFront = async () => {
    try {
      setIsExporting(true)
      await downloadCustomFrontPNG(config)
      toast.success('PNG Depan berhasil di-download')
    } catch {
      toast.error('Gagal download PNG Depan')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadBack = async () => {
    try {
      setIsExporting(true)
      await downloadCustomBackPNG(config)
      toast.success('PNG Belakang berhasil di-download')
    } catch {
      toast.error('Gagal download PNG Belakang')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true)
      await downloadCustomDuplexPDF(config, exportQty)
      toast.success(`PDF Duplex (${exportQty} Set = ${exportQty * 2} Halaman) berhasil di-download!`)
    } catch {
      toast.error('Gagal download PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadZIP = async () => {
    try {
      setIsExporting(true)
      await downloadCustomZIP(config, exportQty)
      toast.success(`Paket ZIP (${exportQty} Set) berhasil di-download!`)
    } catch {
      toast.error('Gagal download ZIP')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <QrCode size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 font-display">
                Generator QR & Card Studio
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                Custom mockup kartu fisik (Depan & Belakang), QR overlay, logo tengah & cetak massal.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Export Suite - Responsive Grid on Mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadFront}
            disabled={isExporting}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> PNG Depan
          </button>
          <button
            onClick={handleDownloadBack}
            disabled={isExporting}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> PNG Belakang
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 active:bg-amber-200 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <FileText size={14} /> PDF ({exportQty * 2} Hal)
          </button>
          <button
            onClick={handleDownloadZIP}
            disabled={isExporting}
            className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} /> Download ZIP
          </button>
        </div>
      </div>

      {/* MOBILE TAB NAVIGATOR (Visible on screens < lg) */}
      <div className="flex lg:hidden bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveMobileTab('form')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeMobileTab === 'form'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings size={15} /> 1. Pengaturan Desain
        </button>
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeMobileTab === 'preview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye size={15} /> 2. Live Preview & Cetak
        </button>
      </div>

      {/* Main Grid Layout: Controls vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Controls (7 cols) - Visible if Desktop OR activeMobileTab === 'form' */}
        <div className={`lg:col-span-7 space-y-5 sm:space-y-6 ${activeMobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          {/* STEP 1: UPLOAD FILE DESAIN KLIEN */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ImageIcon size={16} /> 1. Upload File Desain (Depan & Belakang)
              </span>
              {(config.frontBgImage || config.backBgImage) && (
                <button
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, frontBgImage: null, backBgImage: null }))
                  }
                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Reset Template
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Upload Tampak Depan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Desain Tampak Depan (Front Card Image)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 ${
                    config.frontBgImage
                      ? 'border-indigo-400 bg-indigo-50/20'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {config.frontBgImage ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <img
                        src={config.frontBgImage}
                        alt="Front template"
                        className="h-24 sm:h-28 w-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                      />
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Custom Front Active
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Upload className="mx-auto text-slate-400" size={22} />
                      <p className="text-xs font-bold text-slate-700">Pilih Desain Depan</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, WebP (Maks 10MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Upload Tampak Belakang */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Desain Tampak Belakang (Back Card Image)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 ${
                    config.backBgImage
                      ? 'border-indigo-400 bg-indigo-50/20'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {config.backBgImage ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <img
                        src={config.backBgImage}
                        alt="Back template"
                        className="h-24 sm:h-28 w-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                      />
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Custom Back Active
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Upload className="mx-auto text-slate-400" size={22} />
                      <p className="text-xs font-bold text-slate-700">Pilih Desain Belakang</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, WebP (Maks 10MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: LINK TARGET & LOGO TENGAH QR */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block font-mono border-b border-slate-100 pb-3">
              <LinkIcon size={16} className="inline mr-1.5" /> 2. Target Link & Logo Tengah QR
            </span>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setConfig((prev) => ({ ...prev, urlMode: 'custom' }))}
                className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  config.urlMode === 'custom'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ExternalLink size={14} className="shrink-0" /> URL Custom Client
              </button>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, urlMode: 'ony' }))}
                className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  config.urlMode === 'ony'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode size={14} className="shrink-0" /> Kode Ony (Batch)
              </button>
            </div>

            {config.urlMode === 'custom' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Target QR Code Klien
                </label>
                <input
                  type="url"
                  value={config.targetUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="https://instagram.com/nama_klien"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prefix Kode Ony (Opsional)
                  </label>
                  <input
                    type="text"
                    value={config.onyPrefix}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, onyPrefix: e.target.value.toUpperCase() }))
                    }
                    placeholder="ONY-"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600 shrink-0" /> Auto Generate Kode Ony Unik:
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Sistem otomatis membuat Kode Aktivasi unik (<span className="font-mono font-bold">{config.onyPrefix || 'ONY-'}001</span>, <span className="font-mono font-bold">{config.onyPrefix || 'ONY-'}002</span>, ...) untuk setiap set kartu sesuai <span className="font-bold">Quantity ({exportQty} set)</span> saat di-export ke PDF / ZIP.
                  </p>
                </div>
              </div>
            )}

            {/* Upload & Slider Logo Tengah QR Code */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Logo Tengah QR Code (Opsional PNG/SVG/JPG)
              </label>

              <div className="flex items-center gap-3">
                {config.centerLogoUrl ? (
                  <div className="flex items-center gap-3 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200 w-full justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={config.centerLogoUrl}
                        alt="Center Logo"
                        className="w-9 h-9 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0"
                      />
                      <span className="text-xs font-bold text-indigo-700 truncate">Logo Tengah Aktif</span>
                    </div>
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, centerLogoUrl: null }))}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                      title="Hapus Logo Tengah"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition"
                    >
                      <Upload size={14} className="text-slate-400 shrink-0" />
                      <span>Upload Logo Klien / Icon di Tengah QR</span>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCenterLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Slider Ukuran Logo Tengah */}
              {config.centerLogoUrl && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Skala Ukuran Logo Tengah:</span>
                    <span className="font-mono text-indigo-600">{config.centerLogoSize || 28}%</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="34"
                    value={config.centerLogoSize || 28}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, centerLogoSize: Number(e.target.value) }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-6"
                  />
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: QR OVERLAY POSITION & SIZE CONTROLS */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block font-mono border-b border-slate-100 pb-3">
              <Sliders size={16} className="inline mr-1.5" /> 3. Overlay Posisi & Ukuran QR Code
            </span>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Ukuran QR Code:</span>
                  <span className="font-mono text-indigo-600">{config.qrSize}px</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="380"
                  value={config.qrSize}
                  onChange={(e) => setConfig((prev) => ({ ...prev, qrSize: Number(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer h-6"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Posisi Horizontal QR (X):</span>
                    <span className="font-mono text-indigo-600">{config.qrX}px</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="350"
                    value={config.qrX}
                    onChange={(e) => setConfig((prev) => ({ ...prev, qrX: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer h-6"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Posisi Vertikal QR (Y):</span>
                    <span className="font-mono text-indigo-600">{config.qrY}px</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="650"
                    value={config.qrY}
                    onChange={(e) => setConfig((prev) => ({ ...prev, qrY: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer h-6"
                  />
                </div>
              </div>

              {/* Color Controls */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Warna QR Pixel
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.qrFgColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, qrFgColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    />
                    <span className="text-xs font-mono font-semibold truncate">{config.qrFgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Warna Background QR
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.qrBgColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, qrBgColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    />
                    <span className="text-xs font-mono font-semibold truncate">{config.qrBgColor}</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="showFrontQr"
                    checked={config.showFrontQr}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showFrontQr: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 shrink-0"
                  />
                  <label htmlFor="showFrontQr" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Pasang QR Code di Tampak Depan
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="showBackQr"
                    checked={config.showBackQr}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showBackQr: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 shrink-0"
                  />
                  <label htmlFor="showBackQr" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Pasang QR Code di Tampak Belakang
                  </label>
                </div>

                {config.showBackQr && (
                  <div className="flex items-center gap-2.5 pl-6">
                    <input
                      type="checkbox"
                      id="showBackQrBox"
                      checked={config.showBackQrBox}
                      onChange={(e) => setConfig((prev) => ({ ...prev, showBackQrBox: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 shrink-0"
                    />
                    <label htmlFor="showBackQrBox" className="text-xs font-medium text-slate-600 cursor-pointer">
                      Gunakan Box Alas Putih di Belakang QR Belakang
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="qrCenterLogo"
                    checked={config.qrCenterLogo}
                    onChange={(e) => setConfig((prev) => ({ ...prev, qrCenterLogo: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 shrink-0"
                  />
                  <label htmlFor="qrCenterLogo" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Tampilkan Logo / Badge Text di Tengah QR Code
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mockup Preview & Quantity Export (5 cols) - Visible if Desktop OR activeMobileTab === 'preview' */}
        <div className={`lg:col-span-5 space-y-4 sticky top-6 ${activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                <Eye size={14} /> Live Canvas Preview (300 DPI)
              </span>
            </div>

            {/* Display Canvas Previews - Responsive wrapping */}
            <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 py-2 overflow-x-auto">
              {/* FRONT CANVAS PREVIEW */}
              <div className="flex flex-col items-center space-y-2 group shrink-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Depan (Front)
                </span>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 transition transform group-hover:scale-[1.02] bg-slate-950">
                  <canvas
                    ref={frontCanvasRef}
                    className="w-[145px] xs:w-[165px] sm:w-[190px] h-auto block rounded-2xl"
                  />
                </div>
                <button
                  onClick={handleDownloadFront}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                >
                  <Download size={12} /> Save PNG Depan
                </button>
              </div>

              {/* BACK CANVAS PREVIEW */}
              <div className="flex flex-col items-center space-y-2 group shrink-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Belakang (Back)
                </span>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 transition transform group-hover:scale-[1.02] bg-slate-950">
                  <canvas
                    ref={backCanvasRef}
                    className="w-[145px] xs:w-[165px] sm:w-[190px] h-auto block rounded-2xl"
                  />
                </div>
                <button
                  onClick={handleDownloadBack}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                >
                  <Download size={12} /> Save PNG Belakang
                </button>
              </div>
            </div>

            {/* Active Mode Info Box */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="text-slate-400 font-semibold text-[11px]">Target Generation:</div>
              <div className="font-mono text-amber-300 truncate font-bold">
                {config.urlMode === 'ony'
                  ? `Batch Auto-Code: ${config.onyPrefix || 'ONY-'}001 s/d ${config.onyPrefix || 'ONY-'}${String(exportQty).padStart(3, '0')}`
                  : config.targetUrl}
              </div>
            </div>

            {/* QUANTITY EXPORT CONTROL BOX */}
            <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700/90 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CopyCheck size={14} className="text-indigo-400 shrink-0" /> Jumlah Cetak Kartu:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {exportQty} Set ({exportQty * 2} Hal)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="grid grid-cols-5 gap-1 flex-1">
                  {[1, 5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setExportQty(num)}
                      className={`py-2 sm:py-1.5 rounded-lg text-xs font-bold transition border ${
                        exportQty === num
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={exportQty}
                  onChange={(e) => setExportQty(Math.max(1, Number(e.target.value)))}
                  className="w-14 sm:w-16 px-1.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm sm:text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-indigo-500 shrink-0"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                *1 Set = 1 Pasang Depan & Belakang. Jika diisi {exportQty}, PDF cetak berisi {exportQty * 2} halaman (selang-seling).
              </p>
            </div>

            {/* Download Buttons Suite */}
            <div className="pt-1 grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="py-3 sm:py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText size={14} /> PDF ({exportQty * 2} Hal)
              </button>
              <button
                onClick={handleDownloadZIP}
                disabled={isExporting}
                className="py-3 sm:py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} /> ZIP ({exportQty} Set)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner - Responsive positioning */}
      {toastMsg && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-fade-up">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold ${
              toastMsg.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : 'bg-rose-900 text-white border-rose-500/50'
            }`}
          >
            <CheckCircle2 size={16} className={toastMsg.type === 'success' ? 'text-emerald-400 shrink-0' : 'text-rose-400 shrink-0'} />
            <span>{toastMsg.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
