'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Save, ExternalLink, Wifi, Trash2, GripVertical,
  CreditCard, Tag, Tv, Key, QrCode, Globe, MessageCircle,
  Instagram, Linkedin, Youtube, Twitter, Mail, Phone, FileText,
  ShoppingBag, Check, Activity, Eye, RefreshCw, Power, Edit3,
  AlertCircle, CheckCircle2, X
} from 'lucide-react'
import { cn, MEDIA_TYPE_LABELS, STATUS_COLORS, formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface Card {
  id: string
  card_name: string
  media_type: string
  status: string
  mode: string
  redirect_url: string | null
  activation_code: string
  total_taps: number
}

interface LinkItem {
  id: string
  title: string
  url: string
  icon_type: string
  order_index: number
  is_active: boolean
}

interface TapLog {
  id: string
  access_method: string
  ip_address: string | null
  user_agent: string | null
  tapped_at: string
}

const MEDIA_ICONS: Record<string, React.ElementType> = {
  nfc_card: CreditCard,
  nfc_sticker: Tag,
  qr_standee: Tv,
  qr_keychain: Key,
  digital_qr: QrCode,
}

const PLATFORM_OPTIONS: Record<string, { label: string; icon: React.ElementType; placeholder: string; defaultTitle: string }> = {
  whatsapp:  { label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/628123456789', defaultTitle: 'WhatsApp Saya' },
  instagram: { label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username', defaultTitle: 'Instagram Profile' },
  linkedin:  { label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username', defaultTitle: 'LinkedIn Profile' },
  youtube:   { label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel', defaultTitle: 'Channel YouTube' },
  twitter:   { label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/username', defaultTitle: 'X / Twitter' },
  email:     { label: 'Email', icon: Mail, placeholder: 'mailto:email@domain.com', defaultTitle: 'Kirim Email' },
  phone:     { label: 'Telepon', icon: Phone, placeholder: 'tel:+628123456789', defaultTitle: 'Telepon' },
  website:   { label: 'Website', icon: Globe, placeholder: 'https://website.com', defaultTitle: 'Website Utama' },
  store:     { label: 'Toko Online', icon: ShoppingBag, placeholder: 'https://shopee.co.id/toko', defaultTitle: 'Toko Online' },
  vcard:     { label: 'vCard', icon: FileText, placeholder: 'Simpan Kontak', defaultTitle: 'Simpan Kontak (vCard)' },
  other:     { label: 'Lainnya', icon: Globe, placeholder: 'https://...', defaultTitle: 'Tautan Kustom' },
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [logs, setLogs] = useState<TapLog[]>([])
  const [savingCard, setSavingCard] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'logs'>('editor')

  // Pagination for Tap Activity Logs
  const [logsPage, setLogsPage] = useState(1)
  const LOGS_PER_PAGE = 5

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Link Modal States
  const [addingLink, setAddingLink] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [submittingLink, setSubmittingLink] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon_type: 'whatsapp'
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch user cards
  const loadCards = useCallback(async () => {
    try {
      const res = await fetch('/api/cards/mine')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCards(data)
        if (data.length > 0 && !selected) {
          setSelected(data[0])
        }
      }
    } catch (_) {}
  }, [selected])

  useEffect(() => { loadCards() }, [loadCards])

  // Fetch card details (links & logs) when selected card changes
  const loadCardDetails = useCallback(async () => {
    if (!selected) return

    // 1. Fetch links for this card
    try {
      const linkRes = await fetch(`/api/links?card_id=${selected.id}`)
      const linkData = await linkRes.json()
      if (Array.isArray(linkData)) setLinks(linkData)
    } catch (_) {}

    // 2. Fetch today's tap logs for this card
    setLoadingLogs(true)
    setLogsPage(1)
    try {
      const logRes = await fetch(`/api/cards/${selected.id}`)
      const cardDetail = await logRes.json()
      if (cardDetail.logs && Array.isArray(cardDetail.logs)) {
        setLogs(cardDetail.logs)
      }
    } catch (_) {}
    setLoadingLogs(false)
  }, [selected])

  useEffect(() => { loadCardDetails() }, [loadCardDetails])

  // Save Card Settings Manually via Button Click
  const saveCardSettings = async () => {
    if (!selected) return
    setSavingCard(true)

    try {
      const res = await fetch(`/api/cards/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_name: selected.card_name,
          mode: selected.mode,
          redirect_url: selected.redirect_url,
        }),
      })
      const updated = await res.json()
      if (updated && updated.id) {
        setSelected(updated)
        setCards(cards.map(c => c.id === updated.id ? updated : c))
        showToast('Perubahan informasi kartu berhasil disimpan!')
      } else {
        showToast('Gagal menyimpan perubahan kartu.', 'error')
      }
    } catch (_) {
      showToast('Terjadi kesalahan koneksi server.', 'error')
    }
    setSavingCard(false)
  }

  // Handle platform change in link modal
  const handlePlatformChange = (iconType: string) => {
    const defaultTitle = PLATFORM_OPTIONS[iconType]?.defaultTitle ?? 'Tautan'
    setLinkForm(prev => ({
      ...prev,
      icon_type: iconType,
      title: prev.title ? prev.title : defaultTitle,
    }))
  }

  // Add Link Submit
  const handleAddLink = async () => {
    if (!selected) return
    setModalError(null)

    if (!linkForm.title.trim()) {
      setModalError('Judul link wajib diisi.')
      return
    }
    if (!linkForm.url.trim()) {
      setModalError('Target URL wajib diisi.')
      return
    }

    setSubmittingLink(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: selected.id,
          title: linkForm.title,
          url: linkForm.url,
          icon_type: linkForm.icon_type,
          platform: linkForm.icon_type,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setModalError(data.error || 'Gagal menambahkan link.')
        setSubmittingLink(false)
        return
      }

      if (data && data.id) {
        setLinks(prev => [...prev, data])
        setLinkForm({ title: '', url: '', icon_type: 'whatsapp' })
        setAddingLink(false)
        showToast('Link baru berhasil ditambahkan!')
        loadCardDetails()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke server.'
      setModalError(msg)
    }
    setSubmittingLink(false)
  }

  // Update Link Submit
  const handleUpdateLink = async () => {
    if (!editingLink) return
    setModalError(null)

    if (!editingLink.title.trim() || !editingLink.url.trim()) {
      setModalError('Judul dan URL tidak boleh kosong.')
      return
    }

    setSubmittingLink(true)
    try {
      const res = await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLink.id,
          title: editingLink.title,
          url: editingLink.url,
          icon_type: editingLink.icon_type,
          is_active: editingLink.is_active,
        }),
      })

      const updated = await res.json()
      if (!res.ok || updated.error) {
        setModalError(updated.error || 'Gagal mengupdate link.')
        setSubmittingLink(false)
        return
      }

      if (updated && updated.id) {
        setLinks(links.map(l => l.id === updated.id ? updated : l))
        setEditingLink(null)
        showToast('Link berhasil diperbarui!')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke server.'
      setModalError(msg)
    }
    setSubmittingLink(false)
  }

  // Toggle active state inline
  const toggleLinkActive = async (link: LinkItem) => {
    try {
      const nextState = !link.is_active
      setLinks(links.map(l => l.id === link.id ? { ...l, is_active: nextState } : l))
      await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id, is_active: nextState }),
      })
      showToast(nextState ? 'Link diaktifkan' : 'Link dinonaktifkan')
    } catch (_) {}
  }

  // Delete Link
  const deleteLink = async (id: string) => {
    if (!confirm('Hapus link ini dari kartu?')) return
    try {
      await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setLinks(links.filter(l => l.id !== id))
      showToast('Link telah dihapus')
    } catch (_) {}
  }

  const safeCards = Array.isArray(cards) ? cards : []
  const safeLinks = Array.isArray(links) ? links : []
  const currentPlatform = PLATFORM_OPTIONS[linkForm.icon_type] ?? PLATFORM_OPTIONS.other

  return (
    <div className="max-w-5xl w-full mx-auto text-slate-900 relative min-w-0 space-y-6">
      
      {/* Success / Error Floating Toast Notification */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold animate-bounce-in max-w-[90vw]',
          toast.type === 'success'
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-rose-600 text-white border-rose-700'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="truncate">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 tracking-tight font-display">My Media</h1>
          <p className="text-slate-600 text-xs sm:text-sm">Kelola profil, tautan interaktif, dan riwayat akses kartu NFC & QR kamu.</p>
        </div>

        {selected && (
          <button
            onClick={() => {
              setLinkForm({ title: 'WhatsApp Saya', url: '', icon_type: 'whatsapp' })
              setModalError(null)
              setAddingLink(true)
            }}
            className="btn-primary flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            Tambah Link Baru
          </button>
        )}
      </div>

      {safeCards.length === 0 ? (
        <div className="card-surface p-8 sm:p-12 text-center bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Wifi size={32} className="text-ony-blue" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">Belum Ada Media Terhubung</h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6">
            Dekatkan HP kamu ke kartu NFC Ony atau scan QR Code pada media baru untuk mengaktifkannya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          {/* Left: Card Selection List */}
          <div className="space-y-3 min-w-0">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Daftar Media ({safeCards.length})</div>
            {safeCards.map(card => {
              const CardIcon = MEDIA_ICONS[card.media_type] ?? CreditCard
              const isSelected = selected?.id === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => { setSelected(card); setActiveTab('editor'); }}
                  className={cn(
                    'w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all shadow-sm flex items-center gap-3.5 min-w-0',
                    isSelected
                      ? 'bg-blue-50/90 border-blue-300 text-slate-900 font-semibold ring-2 ring-blue-500/20'
                      : 'bg-white hover:border-blue-200 text-slate-700 border-slate-200'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border',
                    isSelected ? 'bg-ony-blue text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  )}>
                    <CardIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate text-slate-900 font-display">{card.card_name}</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 truncate">{MEDIA_TYPE_LABELS[card.media_type]} · {card.activation_code}</div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0', STATUS_COLORS[card.status])}>
                    {card.status}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right: Card Configuration Editor */}
          {selected && (
            <div className="lg:col-span-2 space-y-6 min-w-0">
              
              {/* Header Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                      activeTab === 'editor'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Edit3 size={14} /> Pengaturan & Link
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                      activeTab === 'logs'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Activity size={14} /> Riwayat Tap ({logs.length})
                  </button>
                </div>

                <a
                  href={`/c/${selected.activation_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-ony-blue text-xs font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0"
                >
                  <Eye size={14} /> Lihat Profil
                </a>
              </div>

              {activeTab === 'editor' ? (
                <>
                  {/* Card Settings (Manual Save Only) */}
                  <div className="card-surface p-4 sm:p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 font-display">Informasi & Mode Respons Kartu</h2>

                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="text-slate-700 text-xs mb-1.5 block font-semibold">Nama / Label Kartu</label>
                        <input
                          className="input-field text-xs sm:text-sm"
                          value={selected.card_name}
                          onChange={e => setSelected({ ...selected, card_name: e.target.value })}
                          placeholder="Kartu Bisnis Utama"
                        />
                      </div>

                      {/* Mode Selection */}
                      <div>
                        <label className="text-slate-700 text-xs mb-2 block font-semibold">Modus Respons Tap NFC / Scan QR</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200 min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelected({ ...selected, mode: 'profile' })}
                            className={cn(
                              'py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 text-center',
                              selected.mode === 'profile'
                                ? 'bg-white text-ony-blue shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-1.5 font-display">
                              <Globe size={14} /> Profile Mode
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">Tampilkan halaman profil & daftar link</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelected({ ...selected, mode: 'direct' })}
                            className={cn(
                              'py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 text-center',
                              selected.mode === 'direct'
                                ? 'bg-white text-ony-blue shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-1.5 font-display">
                              <ExternalLink size={14} /> Direct Redirect Mode
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">Langsung alihkan ke URL / WhatsApp</span>
                          </button>
                        </div>

                        {/* Direct Mode Target URL */}
                        {selected.mode === 'direct' && (
                          <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                            <label className="text-blue-900 text-xs font-bold mb-1 block">Target Redirect URL</label>
                            <input
                              className="input-field text-sm bg-white"
                              value={selected.redirect_url ?? ''}
                              onChange={e => setSelected({ ...selected, redirect_url: e.target.value })}
                              placeholder="https://wa.me/628123456789 atau https://instagram.com/username"
                            />
                          </div>
                        )}
                      </div>

                      {/* Explicit Manual Save Button */}
                      <button
                        onClick={saveCardSettings}
                        disabled={savingCard}
                        className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-sm font-bold shadow-md"
                      >
                        <Save size={16} />
                        {savingCard ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Kartu'}
                      </button>
                    </div>
                  </div>

                  {/* Links List */}
                  <div className="card-surface p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Kelola Link Tautan ({safeLinks.length})</h2>
                        <p className="text-slate-500 text-xs">Link ini akan muncul pada halaman profil publik kartu ini.</p>
                      </div>

                      <button
                        onClick={() => {
                          setLinkForm({ title: 'WhatsApp Saya', url: '', icon_type: 'whatsapp' })
                          setModalError(null)
                          setAddingLink(true)
                        }}
                        className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 font-bold"
                      >
                        <Plus size={14} />
                        Tambah Link
                      </button>
                    </div>

                    <div className="space-y-3">
                      {safeLinks.map(link => {
                        const IconConfig = PLATFORM_OPTIONS[link.icon_type] ?? PLATFORM_OPTIONS.other
                        const IconComp = IconConfig.icon

                        return (
                          <div
                            key={link.id}
                            className={cn(
                              'flex items-center gap-3.5 p-3.5 rounded-xl border transition-all',
                              link.is_active ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                            )}
                          >
                            <GripVertical size={16} className="text-slate-400 cursor-grab shrink-0" />
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                              <IconComp size={18} className="text-ony-blue" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-slate-900 text-sm font-semibold truncate flex items-center gap-2">
                                {link.title}
                                {!link.is_active && (
                                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">Nonaktif</span>
                                )}
                              </div>
                              <div className="text-slate-500 text-xs truncate font-mono">{link.url}</div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => toggleLinkActive(link)}
                                className={cn(
                                  'p-1.5 rounded-lg border transition-all text-xs font-semibold',
                                  link.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                                )}
                                title={link.is_active ? 'Nonaktifkan link' : 'Aktifkan link'}
                              >
                                <Power size={14} />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingLink(link)
                                  setModalError(null)
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
                                title="Edit Link"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button
                                onClick={() => deleteLink(link.id)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                                title="Hapus Link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {safeLinks.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                          <p className="text-slate-400 text-sm mb-2 font-medium">Belum ada link yang ditambahkan ke kartu ini.</p>
                          <button
                            onClick={() => {
                              setLinkForm({ title: 'WhatsApp Saya', url: '', icon_type: 'whatsapp' })
                              setModalError(null)
                              setAddingLink(true)
                            }}
                            className="btn-ghost text-xs py-1.5 px-3 border-blue-200 text-ony-blue hover:bg-blue-50"
                          >
                            + Tambah Link Pertama
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Today's Tap Activity Logs */
                <div className="card-surface p-4 sm:p-6 bg-white border border-slate-200/90 shadow-sm rounded-2xl min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">Riwayat Tap NFC & QR Scan Hari Ini</h2>
                      <p className="text-slate-500 text-xs">Catatan interaksi publik khusus hari ini pada kartu ini.</p>
                    </div>

                    <button
                      onClick={loadCardDetails}
                      disabled={loadingLogs}
                      className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg font-semibold self-start sm:self-auto"
                    >
                      <RefreshCw size={12} className={cn(loadingLogs && 'animate-spin')} /> Refresh Log
                    </button>
                  </div>

                  {logs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">
                      Belum ada catatan interaksi tap atau scan khusus hari ini untuk kartu ini.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto min-w-0 w-full rounded-xl border border-slate-200/80">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-left bg-slate-50">
                              <th className="px-4 py-2.5">Metode</th>
                              <th className="px-4 py-2.5">Waktu</th>
                              <th className="px-4 py-2.5">IP Address</th>
                              <th className="px-4 py-2.5">User Agent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {logs.slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold">
                                  <span className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px]',
                                    log.access_method === 'nfc_tap'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  )}>
                                    {log.access_method === 'nfc_tap' ? <Wifi size={10} /> : <QrCode size={10} />}
                                    {log.access_method === 'nfc_tap' ? 'NFC Tap' : 'QR Scan'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{formatDate(log.tapped_at)}</td>
                                <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{log.ip_address ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-500 max-w-[180px] sm:max-w-[240px] truncate">{log.user_agent ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {logs.length > LOGS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
                          <div className="text-slate-500 font-medium text-center sm:text-left">
                            Menampilkan {(logsPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(logsPage * LOGS_PER_PAGE, logs.length)} dari {logs.length} log
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                              disabled={logsPage === 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-semibold transition-all"
                            >
                              Sebelumnya
                            </button>

                            <span className="text-slate-700 font-bold px-2">
                              {logsPage} / {Math.ceil(logs.length / LOGS_PER_PAGE)}
                            </span>

                            <button
                              onClick={() => setLogsPage(p => Math.min(Math.ceil(logs.length / LOGS_PER_PAGE), p + 1))}
                              disabled={logsPage >= Math.ceil(logs.length / LOGS_PER_PAGE)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-semibold transition-all"
                            >
                              Berikutnya
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ✨ CLEAN & MINIMAL SHADCN DIALOG: TAMBAH LINK BARU         */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={addingLink} onOpenChange={setAddingLink}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900">Tambah Link Tautan Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Isi informasi link yang ingin ditampilkan pada halaman profil kamu.
            </DialogDescription>
          </DialogHeader>

          {modalError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle size={15} className="shrink-0" />
              {modalError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Platform / Tipe Ikon</label>
              <select
                className="input-field text-xs font-medium"
                value={linkForm.icon_type}
                onChange={e => handlePlatformChange(e.target.value)}
              >
                {Object.entries(PLATFORM_OPTIONS).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Judul Link</label>
              <input
                className="input-field text-xs font-medium"
                placeholder="Contoh: WhatsApp Saya"
                value={linkForm.title}
                onChange={e => setLinkForm({ ...linkForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Target URL</label>
              <input
                className="input-field text-xs font-mono"
                placeholder={currentPlatform.placeholder}
                value={linkForm.url}
                onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
              />
              <p className="text-slate-400 text-[11px] mt-1">Sistem otomatis menambahkan `https://` jika belum ada.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <button
              onClick={() => setAddingLink(false)}
              className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              onClick={handleAddLink}
              disabled={submittingLink}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              {submittingLink ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Simpan Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ✨ CLEAN & MINIMAL SHADCN DIALOG: EDIT LINK                */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingLink} onOpenChange={open => !open && setEditingLink(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Link Tautan</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui judul, target URL, atau tipe ikon link ini.
            </DialogDescription>
          </DialogHeader>

          {modalError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle size={15} className="shrink-0" />
              {modalError}
            </div>
          )}

          {editingLink && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Platform / Tipe Ikon</label>
                <select
                  className="input-field text-xs font-medium"
                  value={editingLink.icon_type}
                  onChange={e => setEditingLink({ ...editingLink, icon_type: e.target.value })}
                >
                  {Object.entries(PLATFORM_OPTIONS).map(([key, item]) => (
                    <option key={key} value={key}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Judul Link</label>
                <input
                  className="input-field text-xs font-medium"
                  value={editingLink.title}
                  onChange={e => setEditingLink({ ...editingLink, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Target URL</label>
                <input
                  className="input-field text-xs font-mono"
                  value={editingLink.url}
                  onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <button onClick={() => setEditingLink(null)} className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600">Batal</button>
            <button
              onClick={handleUpdateLink}
              disabled={submittingLink}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              {submittingLink ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Update Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
