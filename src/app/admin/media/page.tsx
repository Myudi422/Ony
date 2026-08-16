'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Download, RefreshCw, Unlink, QrCode, Copy, Check,
  ExternalLink, Eye, X, Trash2, Search, Filter, Calendar, RotateCcw,
  CreditCard, Tag, ShieldAlert, Palette
} from 'lucide-react'
import { formatDate, MEDIA_TYPE_LABELS, STATUS_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Card {
  id: string
  activation_code: string
  media_type: string
  status: string
  payment_status?: string
  redirect_url?: string | null
  total_taps: number
  created_at: string
  users?: { name: string; email: string } | null
}

export default function AdminMediaPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Filters State
  const [search, setSearch] = useState('')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Batch Generator State
  const [genCount, setGenCount] = useState(2)
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid')
  const [generating, setGenerating] = useState(false)
  const [newCards, setNewCards] = useState<Card[]>([])

  // Action & Modal State
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [previewCard, setPreviewCard] = useState<Card | null>(null)
  const [qrFgColor, setQrFgColor] = useState('#0F172A')
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF')
  const [qrFrameStyle, setQrFrameStyle] = useState<'dark' | 'light' | 'minimal'>('dark')
  const [showLogo, setShowLogo] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const load = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        payment_status: filterPayment,
        status: filterStatus,
        start_date: startDate,
        end_date: endDate,
      })
      const res = await fetch(`/api/admin/media?${queryParams.toString()}`)
      const d = await res.json()
      setCards(d.cards ?? [])
      setTotal(d.total ?? 0)
    } catch (_) {}
  }, [page, limit, search, filterPayment, filterStatus, startDate, endDate])

  useEffect(() => { load() }, [load])

  const resetFilters = () => {
    setSearch('')
    setFilterPayment('all')
    setFilterStatus('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: genCount, media_type: 'nfc_qr', payment_status: paymentStatus }),
      })
      const data = await res.json()
      if (res.ok && data.cards) {
        setNewCards(data.cards)
        load()
      } else {
        alert(`Gagal generate media: ${data.error || 'Terjadi kesalahan'}`)
      }
    } catch (err: any) {
      alert(`Gagal generate media: ${err?.message || 'Error koneksi'}`)
    }
    setGenerating(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === cards.length && cards.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(cards.map(c => c.id))
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Hapus ${selectedIds.length} media yang dipilih?`)) return
    setDeleting(true)
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: selectedIds }),
      })
      setSelectedIds([])
      load()
    } catch (_) {}
    setDeleting(false)
  }

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getLogoBase64 = async (): Promise<string> => {
    try {
      const res = await fetch('/logo.png')
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.readAsDataURL(blob)
      })
    } catch (_) {
      return ''
    }
  }

  const injectCircularBadge = (svgStr: string, bgColor = '#FFFFFF') => {
    if (!svgStr.includes('<image')) return svgStr
    const xMatch = svgStr.match(/<image[^>]*\bx="([^"]+)"/)
    const yMatch = svgStr.match(/<image[^>]*\by="([^"]+)"/)
    const wMatch = svgStr.match(/<image[^>]*\bwidth="([^"]+)"/)

    if (!xMatch || !yMatch || !wMatch) return svgStr

    const x = parseFloat(xMatch[1])
    const y = parseFloat(yMatch[1])
    const w = parseFloat(wMatch[1])

    const cx = (x + w / 2).toFixed(2)
    const cy = (y + w / 2).toFixed(2)
    const r = (w * 0.65).toFixed(2)

    const circleElement = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bgColor}" stroke="#E2E8F0" stroke-width="1.5" />`
    return svgStr.replace(/<image /g, `${circleElement}<image `)
  }

  const downloadQRSVG = async (code: string, elementId: string) => {
    const container = document.getElementById(elementId)
    if (!container) return
    const svg = (container.querySelector('svg.ony-qr-code-svg') || container.querySelector('svg:not([class*="lucide"])') || container.querySelector('svg')) as SVGElement | null
    if (!svg) return

    let svgData = new XMLSerializer().serializeToString(svg)
    const logoBase64 = await getLogoBase64()

    if (logoBase64) {
      svgData = svgData.replace(/href="\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = svgData.replace(/href="http[^"]*\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = injectCircularBadge(svgData, qrBgColor)
    }

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ony-qr-${code}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadQRPNG = async (code: string, elementId: string, size = 600) => {
    const container = document.getElementById(elementId)
    if (!container) return
    const svg = (container.querySelector('svg.ony-qr-code-svg') || container.querySelector('svg:not([class*="lucide"])') || container.querySelector('svg')) as SVGElement | null
    if (!svg) return

    let svgData = new XMLSerializer().serializeToString(svg)
    const logoBase64 = await getLogoBase64()

    if (logoBase64) {
      svgData = svgData.replace(/href="\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = svgData.replace(/href="http[^"]*\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = injectCircularBadge(svgData, qrBgColor)
    }

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `ony-qr-${code}.png`
      a.click()
    }

    img.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const unbind = async (cardId: string) => {
    if (!confirm('Unbind kartu ini dari pengguna? Seluruh daftar link dan riwayat tap kartu ini akan dihapus bersih.')) return
    try {
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, action: 'unbind' }),
      })
      const data = await res.json()
      if (data.error) {
        alert(`Gagal unbind: ${data.error}`)
      } else {
        load()
      }
    } catch (err: any) {
      alert(`Gagal unbind: ${err?.message || 'Terjadi kesalahan'}`)
    }
  }

  const updateStatus = async (cardId: string, status: string) => {
    await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, action: 'status', value: status }),
    })
    load()
  }

  const exportCSV = () => {
    const rows = ['Code,NFC_Link,Type,Payment_Option,Status,Owner,Taps,Created']
    cards.forEach(c => {
      const link = `${baseUrl}/c/${c.activation_code}`
      const isUnpaid = c.payment_status === 'unpaid' || c.redirect_url === 'UNPAID'
      const payOption = isUnpaid ? 'Blangko (Unpaid)' : 'Pre-Paid'
      rows.push(`${c.activation_code},${link},NFC + QR Media,${payOption},${c.status},${c.users?.email ?? 'unclaimed'},${c.total_taps},${c.created_at}`)
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ony-nfc-qr-export-${Date.now()}.csv`
    a.click()
  }

  const hasActiveFilters = search || filterPayment !== 'all' || filterStatus !== 'all' || startDate || endDate

  return (
    <div className="max-w-7xl w-full mx-auto space-y-5 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">Media Generator (NFC + QR)</h1>
          <p className="text-slate-600 text-xs sm:text-sm">Kelola seluruh media fisik NFC, cetak QR Code, dan filter status pembayaran.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-all" title="Reload Data">
            <RefreshCw size={16} />
          </button>
          <button onClick={exportCSV} className="btn-primary text-xs py-2.5 px-3.5 sm:px-4 flex items-center gap-2 shadow-sm font-semibold">
            <Download size={14} />
            Export CSV ({total})
          </button>
        </div>
      </div>

      {/* Top Grid: Batch Generator + Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Batch Generator */}
        <div className="card-surface p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-ony-blue" />
            Generate Batch NFC + QR
          </h2>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-3">
              <QrCode size={22} className="text-ony-blue shrink-0" />
              <div>
                <div className="text-slate-900 text-xs font-semibold">Format Media</div>
                <div className="text-ony-blue text-xs font-mono font-bold">NFC + QR Smart Media</div>
              </div>
            </div>
            <div>
              <label className="text-slate-700 text-xs mb-1.5 block font-semibold">Jumlah Kartu Ditargetkan</label>
              <input
                type="number"
                min={1}
                max={100}
                className="input-field font-semibold"
                value={genCount}
                onChange={e => setGenCount(Math.max(1, +e.target.value))}
              />
            </div>
            <div>
              <label className="text-slate-700 text-xs mb-1.5 block font-semibold">Opsi Pembayaran Media</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                className="input-field cursor-pointer font-medium text-xs text-slate-800"
              >
                <option value="paid">✓ Pre-Paid (Sudah Beli di Shopee/Tokopedia)</option>
                <option value="unpaid">💳 Blangko Kosongan (Wajib Bayar saat Klaim)</option>
              </select>
            </div>
            <button
              id="generate-batch-btn"
              onClick={generate}
              disabled={generating}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3 font-semibold disabled:opacity-50 shadow-md shadow-blue-500/10"
            >
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}
              {generating ? 'Generating...' : `Generate ${genCount} Media Barcode`}
            </button>
          </div>
        </div>

        {/* Status Breakdown & Quick Stats */}
        <div className="card-surface p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Ringkasan Ekosistem Media</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">Total: {total}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Unclaimed', color: 'text-amber-700 bg-amber-50 border-amber-200', count: cards.filter(c => c.status === 'unclaimed').length },
                { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', count: cards.filter(c => c.status === 'active').length },
                { label: 'Suspended', color: 'text-rose-700 bg-rose-50 border-rose-200', count: cards.filter(c => c.status === 'suspended').length },
                { label: 'Blangko (Unpaid)', color: 'text-purple-700 bg-purple-50 border-purple-200', count: cards.filter(c => c.payment_status === 'unpaid' || c.redirect_url === 'UNPAID').length },
              ].map(st => (
                <div key={st.label} className={cn('p-3 rounded-xl border flex flex-col justify-between', st.color)}>
                  <div className="text-[11px] font-semibold tracking-tight">{st.label}</div>
                  <div className="text-2xl font-bold font-mono mt-1">{st.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span>Daftar media memuat {cards.length} dari {total} total item di database.</span>
            <span className="font-semibold text-slate-900">Page {page}</span>
          </div>
        </div>
      </div>

      {/* Generated Cards Gallery (If newly generated) */}
      {newCards.length > 0 && (
        <div className="p-6 rounded-2xl bg-blue-50/90 border border-blue-200/90 shadow-sm animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>✨</span> Hasil Generate ({newCards.length} Media NFC + QR Baru)
              </h2>
              <p className="text-slate-600 text-xs">Siap di-encode ke Chip NFC dan dicetak QR Code-nya</p>
            </div>
            <button onClick={() => setNewCards([])} className="text-slate-400 hover:text-slate-700 p-1">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newCards.map(c => {
              const nfcUrl = `${baseUrl}/c/${c.activation_code}`
              const isCopied = copiedCode === c.activation_code
              const isUnpaid = c.payment_status === 'unpaid' || c.redirect_url === 'UNPAID'
              const containerId = `qr-gen-${c.activation_code}`
              return (
                <div key={c.id} className="card-surface p-4 flex flex-col items-center text-center bg-white border-slate-200/90 shadow-sm rounded-2xl relative overflow-hidden group hover:border-blue-300 transition-all">
                  {/* Styled QR Badge Container */}
                  <div className="p-3 bg-slate-900 text-white rounded-2xl mb-3 border border-slate-800 shadow-md flex flex-col items-center w-full relative">
                    <div className="text-[9px] font-extrabold text-blue-300 uppercase tracking-widest mb-2 font-display">
                      TAP OR SCAN ME
                    </div>
                    <div id={containerId} className="p-2 bg-white rounded-xl shadow-inner">
                      <QRCodeSVG
                        className="ony-qr-code-svg"
                        value={nfcUrl}
                        size={110}
                        fgColor="#0F172A"
                        bgColor="#FFFFFF"
                        level="H"
                        marginSize={1}
                        imageSettings={{
                          src: '/logo.png',
                          height: 24,
                          width: 24,
                          excavate: true,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-ony-blue font-mono font-extrabold text-sm mb-1">{c.activation_code}</div>
                  <div className="text-slate-500 text-[11px] font-mono truncate w-full mb-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    {nfcUrl}
                  </div>
                  <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-3 uppercase tracking-wider', isUnpaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}>
                    {isUnpaid ? '💳 Blangko (Unpaid)' : '✓ Pre-Paid'}
                  </span>
                  
                  <div className="flex flex-col gap-1.5 w-full mt-auto">
                    <div className="flex gap-1.5 w-full">
                      <button
                        onClick={() => copyToClipboard(nfcUrl, c.activation_code)}
                        className="flex-1 btn-ghost text-xs py-1.5 flex items-center justify-center gap-1 border border-slate-200 font-semibold"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {isCopied ? 'Tersalin' : 'Salin URL'}
                      </button>
                      <a
                        href={nfcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-blue-50 text-ony-blue border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="Buka Link NFC"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <div className="flex gap-1.5 w-full">
                      <button
                        onClick={() => downloadQRPNG(c.activation_code, containerId)}
                        className="flex-1 btn-ghost text-[11px] py-1.5 flex items-center justify-center gap-1 border border-slate-200 font-semibold"
                      >
                        <Download size={11} /> PNG
                      </button>
                      <button
                        onClick={() => downloadQRSVG(c.activation_code, containerId)}
                        className="flex-1 btn-ghost text-[11px] py-1.5 flex items-center justify-center gap-1 border border-slate-200 font-semibold"
                      >
                        <Download size={11} /> SVG
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FILTER CONTROL BAR */}
      <div className="card-surface p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Filter size={16} className="text-ony-blue" />
            Filter & Pencarian Media
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9 w-full text-xs font-medium"
              placeholder="Cari kode aktivasi..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Payment Option Filter */}
          <div>
            <select
              value={filterPayment}
              onChange={e => { setFilterPayment(e.target.value); setPage(1) }}
              className="input-field cursor-pointer text-xs font-semibold text-slate-800"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="paid">✓ Pre-Paid</option>
              <option value="unpaid">💳 Blangko (Unpaid)</option>
            </select>
          </div>

          {/* Status Aktivasi Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="input-field cursor-pointer text-xs font-semibold text-slate-800 capitalize"
            >
              <option value="all">Semua Status</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Date Filter Start */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1) }}
              className="input-field text-xs font-medium text-slate-800"
              title="Tanggal pembuatan dari"
            />
          </div>
        </div>

        {/* Filter Badges Active Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">Filter Aktif:</span>
            {search && <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-ony-blue border border-blue-200 font-medium">Search: &quot;{search}&quot;</span>}
            {filterPayment !== 'all' && <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">Payment: {filterPayment}</span>}
            {filterStatus !== 'all' && <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Status: {filterStatus}</span>}
            {startDate && <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">Dari: {startDate}</span>}
            {endDate && <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">Sampai: {endDate}</span>}
          </div>
        )}
      </div>

      {/* Selected Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-4 rounded-2xl animate-fade-in shadow-xs">
          <div className="text-rose-800 text-xs font-bold flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{selectedIds.length} media dipilih</span>
          </div>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl transition-all shadow-sm font-semibold disabled:opacity-50"
          >
            <Trash2 size={14} /> Hapus {selectedIds.length} Media Terpilih
          </button>
        </div>
      )}

      {/* CARDS LIST TABLE */}
      <div className="card-surface overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-sm min-w-0 w-full">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm font-display">Daftar Seluruh Media NFC & QR</h3>
          <span className="text-slate-500 text-xs font-mono">Menampilkan {cards.length} dari {total} Media</span>
        </div>

        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={cards.length > 0 && selectedIds.length === cards.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-ony-blue focus:ring-ony-blue cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">QR Code</th>
                <th className="text-left px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Kode Aktivasi</th>
                <th className="text-left px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Opsi Payment</th>
                <th className="text-left px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Status Kartu</th>
                <th className="text-left px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Pemilik</th>
                <th className="text-left px-3 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Taps</th>
                <th className="text-left px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Tgl Dibuat</th>
                <th className="text-right px-4 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <QrCode size={36} className="mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">Tidak ada media ditemukan</p>
                      <p className="text-slate-400 text-xs">Coba ubah kata kunci pencarian atau reset filter di atas.</p>
                      {hasActiveFilters && (
                        <button onClick={resetFilters} className="btn-ghost text-xs py-1.5 px-3 border border-slate-200 mt-2">
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : cards.map(card => {
                const nfcUrl = `${baseUrl}/c/${card.activation_code}`
                const isSelected = selectedIds.includes(card.id)
                const isUnpaid = card.payment_status === 'unpaid' || card.redirect_url === 'UNPAID'

                return (
                  <tr key={card.id} className={cn('hover:bg-slate-50/80 transition-colors', isSelected && 'bg-blue-50/40')}>
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(card.id)}
                        className="rounded border-slate-300 text-ony-blue focus:ring-ony-blue cursor-pointer"
                      />
                    </td>

                    {/* QR Code thumbnail */}
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => setPreviewCard(card)}
                        className="p-1 bg-white rounded-lg hover:scale-105 transition-transform border border-slate-200 shadow-2xs"
                        title="Perbesar QR"
                      >
                        <QRCodeSVG
                          value={nfcUrl}
                          size={36}
                          level="H"
                          imageSettings={{
                            src: '/logo.png',
                            height: 8,
                            width: 8,
                            excavate: true,
                          }}
                        />
                      </button>
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3.5 font-mono text-ony-blue text-xs font-bold">
                      {card.activation_code}
                    </td>

                    {/* Opsi Payment */}
                    <td className="px-4 py-3.5">
                      <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1',
                        isUnpaid ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      )}>
                        {isUnpaid ? '💳 Blangko (Unpaid)' : '✓ Pre-Paid'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full border font-semibold capitalize', STATUS_COLORS[card.status])}>
                        {card.status}
                      </span>
                    </td>

                    {/* Pemilik */}
                    <td className="px-4 py-3.5">
                      {card.users ? (
                        <div>
                          <div className="text-slate-900 text-xs font-semibold">{card.users.name}</div>
                          <div className="text-slate-400 text-[11px] truncate max-w-[140px]">{card.users.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unclaimed</span>
                      )}
                    </td>

                    {/* Taps */}
                    <td className="px-3 py-3.5 font-mono text-slate-700 text-xs font-bold">{card.total_taps}</td>

                    {/* Tanggal Dibuat */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(card.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewCard(card)}
                          className="flex items-center gap-1 text-[11px] text-ony-blue border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all font-medium"
                          title="Preview QR & Link"
                        >
                          <Eye size={12} /> QR
                        </button>
                        {(card.users || card.status !== 'unclaimed') && (
                          <button
                            onClick={() => unbind(card.id)}
                            className="flex items-center gap-1 text-[11px] text-amber-700 border border-amber-300 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-all font-medium"
                            title="Unbind kartu"
                          >
                            <Unlink size={11} /> Unbind
                          </button>
                        )}
                        {card.status === 'active' && (
                          <button
                            onClick={() => updateStatus(card.id, 'suspended')}
                            className="text-[11px] text-rose-600 border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-all font-medium"
                          >
                            Suspend
                          </button>
                        )}
                        {card.status === 'suspended' && (
                          <button
                            onClick={() => updateStatus(card.id, 'active')}
                            className="text-[11px] text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all font-medium"
                          >
                            Aktifkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
          <span className="text-slate-500 text-xs">
            Halaman {page} · {total} total media
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-xs"
            >
              ← Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-xs"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview QR & NFC Link */}
      <Dialog open={!!previewCard} onOpenChange={open => !open && setPreviewCard(null)}>
        {previewCard && (
          <DialogContent className="max-w-md bg-white border-slate-200 shadow-2xl rounded-3xl p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-lg font-bold text-slate-900 font-display flex items-center justify-center gap-2">
                <Palette size={18} className="text-ony-blue" />
                Desain & Kustomisasi QR
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Kode Aktivasi: <span className="text-ony-blue font-mono font-bold">{previewCard.activation_code}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-2 space-y-4">
              {/* Mockup Frame Preview (Dark / Light / Minimal) */}
              {qrFrameStyle === 'dark' && (
                <div className="w-full p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase tracking-widest mb-4 font-display">
                    <CreditCard size={12} className="text-cyan-400" /> ONY SMART MEDIA
                  </div>
                  <div id={`qr-preview-${previewCard.activation_code}`} className="relative p-3.5 rounded-2xl shadow-2xl border border-slate-200/20 mb-3 flex items-center justify-center" style={{ background: qrBgColor }}>
                    <QRCodeSVG
                      className="ony-qr-code-svg"
                      value={`${baseUrl}/c/${previewCard.activation_code}`}
                      size={180}
                      fgColor={qrFgColor}
                      bgColor={qrBgColor}
                      level="H"
                      marginSize={1}
                      imageSettings={showLogo ? {
                        src: '/logo.png',
                        height: 38,
                        width: 38,
                        excavate: true,
                      } : undefined}
                    />
                    {showLogo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full p-1 shadow-md border border-slate-200/80 flex items-center justify-center" style={{ background: qrBgColor }}>
                          <img src="/logo.png" alt="Ony Logo" className="w-full h-full object-contain rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-300 font-mono tracking-wider">
                    TAP NFC OR SCAN QR
                  </div>
                </div>
              )}

              {qrFrameStyle === 'light' && (
                <div className="w-full p-5 bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden flex flex-col items-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ony-blue text-[10px] font-extrabold uppercase tracking-widest mb-4 font-display">
                    <CreditCard size={12} className="text-ony-blue" /> ONY SMART MEDIA
                  </div>
                  <div id={`qr-preview-${previewCard.activation_code}`} className="relative p-3.5 rounded-2xl shadow-lg border border-slate-200 mb-3 flex items-center justify-center" style={{ background: qrBgColor }}>
                    <QRCodeSVG
                      className="ony-qr-code-svg"
                      value={`${baseUrl}/c/${previewCard.activation_code}`}
                      size={180}
                      fgColor={qrFgColor}
                      bgColor={qrBgColor}
                      level="H"
                      marginSize={1}
                      imageSettings={showLogo ? {
                        src: '/logo.png',
                        height: 38,
                        width: 38,
                        excavate: true,
                      } : undefined}
                    />
                    {showLogo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full p-1 shadow-md border border-slate-200/80 flex items-center justify-center" style={{ background: qrBgColor }}>
                          <img src="/logo.png" alt="Ony Logo" className="w-full h-full object-contain rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 font-mono tracking-wider">
                    TAP NFC OR SCAN QR
                  </div>
                </div>
              )}

              {qrFrameStyle === 'minimal' && (
                <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
                  <div id={`qr-preview-${previewCard.activation_code}`} className="relative p-4 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center" style={{ background: qrBgColor }}>
                    <QRCodeSVG
                      className="ony-qr-code-svg"
                      value={`${baseUrl}/c/${previewCard.activation_code}`}
                      size={190}
                      fgColor={qrFgColor}
                      bgColor={qrBgColor}
                      level="H"
                      marginSize={1}
                      imageSettings={showLogo ? {
                        src: '/logo.png',
                        height: 40,
                        width: 40,
                        excavate: true,
                      } : undefined}
                    />
                    {showLogo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full p-1 shadow-md border border-slate-200/80 flex items-center justify-center" style={{ background: qrBgColor }}>
                          <img src="/logo.png" alt="Ony Logo" className="w-full h-full object-contain rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customization Controls Accordion / Panel */}
              <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                {/* Frame Style Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 font-display">Style Frame Mockup</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'dark', name: 'Ony Dark' },
                      { id: 'light', name: 'Ony Light' },
                      { id: 'minimal', name: 'Minimal' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setQrFrameStyle(f.id as any)}
                        className={cn('py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center',
                          qrFrameStyle === f.id ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Presets */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 font-display">Preset Warna QR</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { name: 'Slate', fg: '#0F172A', bg: '#FFFFFF' },
                      { name: 'Blue', fg: '#087CFF', bg: '#FFFFFF' },
                      { name: 'Indigo', fg: '#4F46E5', bg: '#FFFFFF' },
                      { name: 'Emerald', fg: '#059669', bg: '#FFFFFF' },
                      { name: 'Invert', fg: '#FFFFFF', bg: '#0F172A' },
                    ].map(p => (
                      <button
                        key={p.name}
                        onClick={() => { setQrFgColor(p.fg); setQrBgColor(p.bg) }}
                        className="flex flex-col items-center p-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all"
                        title={p.name}
                      >
                        <div className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center" style={{ background: p.bg }}>
                          <div className="w-3 h-3 rounded-xs" style={{ background: p.fg }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 mt-1">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Warna QR</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={qrFgColor} onChange={e => setQrFgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white" />
                      <span className="font-mono text-xs font-bold text-slate-700">{qrFgColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Background</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={qrBgColor} onChange={e => setQrBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white" />
                      <span className="font-mono text-xs font-bold text-slate-700">{qrBgColor}</span>
                    </div>
                  </div>
                </div>

                {/* Toggle Logo */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-700">Tampilkan Logo Ony</span>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={e => setShowLogo(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-ony-blue focus:ring-ony-blue cursor-pointer"
                  />
                </div>
              </div>

              {/* Target URL */}
              <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 font-display">Target NFC URL</div>
                <div className="text-ony-blue font-mono text-xs break-all">
                  {`${baseUrl}/c/${previewCard.activation_code}`}
                </div>
              </div>

              {/* Action Buttons: Copy Link & Downloads */}
              <div className="space-y-2 w-full">
                <button
                  onClick={() => copyToClipboard(`${baseUrl}/c/${previewCard.activation_code}`, previewCard.activation_code)}
                  className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2 font-semibold shadow-xs"
                >
                  {copiedCode === previewCard.activation_code ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCode === previewCard.activation_code ? 'Link Tersalin!' : 'Salin NFC Link'}
                </button>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => downloadQRPNG(previewCard.activation_code, `qr-preview-${previewCard.activation_code}`, 1200)}
                    className="btn-ghost text-xs py-2.5 flex items-center justify-center gap-1.5 border border-slate-200 font-semibold text-slate-800"
                  >
                    <Download size={13} /> Unduh PNG HD
                  </button>
                  <button
                    onClick={() => downloadQRSVG(previewCard.activation_code, `qr-preview-${previewCard.activation_code}`)}
                    className="btn-ghost text-xs py-2.5 flex items-center justify-center gap-1.5 border border-slate-200 font-semibold text-slate-800"
                  >
                    <Download size={13} /> Unduh SVG Vector
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
