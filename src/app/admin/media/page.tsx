'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Download, RefreshCw, Unlink, QrCode, Copy, Check,
  ExternalLink, Eye, X, Trash2, Search, Filter, Calendar, RotateCcw,
  CreditCard, Tag, ShieldAlert
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Media Generator (NFC + QR)</h1>
          <p className="text-slate-600 text-sm">Kelola seluruh media fisik NFC, cetak QR Code, dan filter status pembayaran.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-all" title="Reload Data">
            <RefreshCw size={16} />
          </button>
          <button onClick={exportCSV} className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-sm font-semibold">
            <Download size={14} />
            Export CSV ({total} Media)
          </button>
        </div>
      </div>

      {/* Top Grid: Batch Generator + Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
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
              return (
                <div key={c.id} className="card-surface p-4 flex flex-col items-center text-center bg-white border-slate-200 shadow-xs rounded-xl">
                  <div className="p-2.5 bg-white rounded-xl mb-2 border border-slate-200 shadow-2xs">
                    <QRCodeSVG value={nfcUrl} size={100} level="M" />
                  </div>
                  <div className="text-ony-blue font-mono font-bold text-sm mb-1">{c.activation_code}</div>
                  <div className="text-slate-500 text-[11px] font-mono truncate w-full mb-2 bg-slate-50 p-1 rounded border border-slate-200">
                    {nfcUrl}
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full mb-3', isUnpaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}>
                    {isUnpaid ? '💳 Blangko (Unpaid)' : '✓ Pre-Paid'}
                  </span>
                  <div className="flex gap-2 w-full mt-auto">
                    <button
                      onClick={() => copyToClipboard(nfcUrl, c.activation_code)}
                      className="flex-1 btn-ghost text-xs py-1.5 flex items-center justify-center gap-1 border border-slate-200"
                    >
                      {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {isCopied ? 'Tersalin' : 'Salin URL'}
                    </button>
                    <a
                      href={nfcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-50 text-ony-blue border border-blue-200"
                      title="Buka Link NFC"
                    >
                      <ExternalLink size={14} />
                    </a>
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
      <div className="card-surface overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">Daftar Seluruh Media NFC & QR</h3>
          <span className="text-slate-500 text-xs font-mono">Menampilkan {cards.length} dari {total} Media</span>
        </div>

        <div className="overflow-x-auto">
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
                        <QRCodeSVG value={nfcUrl} size={34} level="L" />
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
          <DialogContent className="max-w-sm text-center bg-white border-slate-200 shadow-xl rounded-2xl p-6">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-lg font-bold text-slate-900">Preview NFC & QR Code</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Kode Aktivasi: <span className="text-ony-blue font-mono font-bold">{previewCard.activation_code}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-2">
              <div className="p-4 bg-white rounded-2xl mb-4 border border-slate-200 shadow-md">
                <QRCodeSVG value={`${baseUrl}/c/${previewCard.activation_code}`} size={180} level="H" />
              </div>

              <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-left">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Target NFC URL</div>
                <div className="text-ony-blue font-mono text-xs break-all">
                  {`${baseUrl}/c/${previewCard.activation_code}`}
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(`${baseUrl}/c/${previewCard.activation_code}`, previewCard.activation_code)}
                className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2 font-medium"
              >
                {copiedCode === previewCard.activation_code ? <Check size={14} /> : <Copy size={14} />}
                {copiedCode === previewCard.activation_code ? 'Link Tersalin!' : 'Salin NFC Link'}
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
