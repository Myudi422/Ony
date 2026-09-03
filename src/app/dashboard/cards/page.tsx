'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  Plus, Save, ExternalLink, Wifi, Trash2, GripVertical,
  CreditCard, Tag, Tv, Key, QrCode, Globe, MessageCircle,
  Instagram, Linkedin, Youtube, Twitter, Mail, Phone, FileText,
  ShoppingBag, Check, Activity, Eye, RefreshCw, Power, Edit3,
  AlertCircle, CheckCircle2, X, MapPin, Star, Sparkles, User2, Link2,
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, Zap, BarChart3,
  Layers, ArrowUpDown, Send
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
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/628123456789', defaultTitle: 'WhatsApp Saya' },
  instagram: { label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username', defaultTitle: 'Instagram Profile' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username', defaultTitle: 'LinkedIn Profile' },
  youtube: { label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel', defaultTitle: 'Channel YouTube' },
  twitter: { label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/username', defaultTitle: 'X / Twitter' },
  maps: { label: 'Google Maps / Lokasi', icon: MapPin, placeholder: 'https://maps.google.com/?q=-6.200000,106.816666 atau https://goo.gl/maps/...', defaultTitle: 'Lokasi Google Maps' },
  email: { label: 'Email', icon: Mail, placeholder: 'mailto:email@domain.com', defaultTitle: 'Kirim Email' },
  phone: { label: 'Telepon', icon: Phone, placeholder: 'tel:+628123456789', defaultTitle: 'Telepon' },
  website: { label: 'Website', icon: Globe, placeholder: 'https://website.com', defaultTitle: 'Website Utama' },
  store: { label: 'Toko Online', icon: ShoppingBag, placeholder: 'https://shopee.co.id/toko', defaultTitle: 'Toko Online' },
  vcard: { label: 'vCard', icon: FileText, placeholder: 'Simpan Kontak', defaultTitle: 'Simpan Kontak (vCard)' },
  other: { label: 'Lainnya', icon: Globe, placeholder: 'https://...', defaultTitle: 'Tautan Kustom' },
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

const CARDS_PER_PAGE = 6

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [logs, setLogs] = useState<TapLog[]>([])
  const [savingCard, setSavingCard] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'logs'>('editor')

  // Search & Filter State for Cards List
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMediaType, setFilterMediaType] = useState<string>('all')
  const [filterMode, setFilterMode] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'most_taps' | 'name'>('newest')
  const [cardsPage, setCardsPage] = useState(1)

  // User profile editing
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({ name: '', avatar_url: '' })
  const [savingProfile, setSavingProfile] = useState(false)

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

  // Delete / Unlink Card Modal States
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [isDeletingCard, setIsDeletingCard] = useState(false)

  // Transfer Card Modal States
  const [transferringCard, setTransferringCard] = useState<Card | null>(null)
  const [transferEmail, setTransferEmail] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Handle Transfer Card Confirmation
  const handleTransferCardConfirmed = async () => {
    if (!transferringCard) return
    if (!transferEmail.trim()) {
      setTransferError('Email penerima wajib diisi.')
      return
    }

    setIsTransferring(true)
    setTransferError(null)

    try {
      const res = await fetch('/api/cards/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: transferringCard.id,
          target_email: transferEmail.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setTransferError(data.error || 'Gagal mentransfer kartu.')
        setIsTransferring(false)
        return
      }

      showToast(data.message || 'Kartu berhasil ditransfer!')
      const cardName = transferringCard.card_name
      setTransferringCard(null)
      setTransferEmail('')

      // Update local card list
      setCards(prev => {
        const next = prev.filter(c => c.id !== transferringCard.id)
        if (selected?.id === transferringCard.id) {
          setSelected(next.length > 0 ? next[0] : null)
        }
        return next
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke server.'
      setTransferError(msg)
    }
    setIsTransferring(false)
  }

  // Fetch user profile
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data: UserProfile = await res.json()
        setUserProfile(data)
        setProfileForm({ name: data.name ?? '', avatar_url: data.avatar_url ?? '' })
      }
    } catch (_) { }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  // Save user profile (name + avatar_url)
  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          avatar_url: profileForm.avatar_url,
        }),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        setUserProfile(data)
        showToast('Profil berhasil diperbarui! Akan tampil di halaman publik.')
      } else {
        showToast(data.error || 'Gagal menyimpan profil.', 'error')
      }
    } catch (_) {
      showToast('Terjadi kesalahan koneksi.', 'error')
    }
    setSavingProfile(false)
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
    } catch (_) { }
  }, [selected])

  useEffect(() => { loadCards() }, [loadCards])

  // Filter & Search Logic for Card Selector
  const filteredCards = useMemo(() => {
    let result = [...cards]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(c =>
        c.card_name.toLowerCase().includes(q) ||
        c.activation_code.toLowerCase().includes(q) ||
        (c.redirect_url && c.redirect_url.toLowerCase().includes(q))
      )
    }

    if (filterMediaType !== 'all') {
      result = result.filter(c => c.media_type === filterMediaType)
    }

    if (filterMode !== 'all') {
      if (filterMode === 'google_review') {
        result = result.filter(c => c.mode === 'google_review' || c.mode === 'review')
      } else {
        result = result.filter(c => c.mode === filterMode)
      }
    }

    if (sortBy === 'most_taps') {
      result.sort((a, b) => (b.total_taps || 0) - (a.total_taps || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.card_name.localeCompare(b.card_name))
    }

    return result
  }, [cards, searchQuery, filterMediaType, filterMode, sortBy])

  // Reset page when search or filter changes
  useEffect(() => {
    setCardsPage(1)
  }, [searchQuery, filterMediaType, filterMode, sortBy])

  const totalCardsPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE) || 1
  const paginatedCards = useMemo(() => {
    const start = (cardsPage - 1) * CARDS_PER_PAGE
    return filteredCards.slice(start, start + CARDS_PER_PAGE)
  }, [filteredCards, cardsPage])

  // Overall Statistics Summary
  const totalTaps = useMemo(() => cards.reduce((sum, c) => sum + (c.total_taps || 0), 0), [cards])
  const activeCardsCount = useMemo(() => cards.filter(c => c.status === 'active' || c.status === 'claimed').length, [cards])

  // Unsaved card setting changes detection
  const originalCard = useMemo(() => cards.find(c => c.id === selected?.id), [cards, selected?.id])

  const hasUnsavedCardChanges = useMemo(() => {
    if (!selected || !originalCard) return false

    const normSelMode = (selected.mode === 'review' || selected.mode === 'google_review') ? 'google_review' : (selected.mode || 'profile')
    const normOrigMode = (originalCard.mode === 'review' || originalCard.mode === 'google_review') ? 'google_review' : (originalCard.mode || 'profile')

    return (
      selected.card_name !== originalCard.card_name ||
      normSelMode !== normOrigMode ||
      (selected.redirect_url ?? '') !== (originalCard.redirect_url ?? '')
    )
  }, [selected, originalCard])

  // Fetch card details (links & logs) when selected card changes
  const loadCardDetails = useCallback(async () => {
    if (!selected) return

    // 1. Fetch links for this card
    try {
      const linkRes = await fetch(`/api/links?card_id=${selected.id}`)
      const linkData = await linkRes.json()
      if (Array.isArray(linkData)) setLinks(linkData)
    } catch (_) { }

    // 2. Fetch today's tap logs for this card
    setLoadingLogs(true)
    setLogsPage(1)
    try {
      const logRes = await fetch(`/api/cards/${selected.id}`)
      const cardDetail = await logRes.json()
      if (cardDetail.logs && Array.isArray(cardDetail.logs)) {
        setLogs(cardDetail.logs)
      }
    } catch (_) { }
    setLoadingLogs(false)
  }, [selected])

  useEffect(() => { loadCardDetails() }, [loadCardDetails])

  const handleDeleteCardConfirmed = async () => {
    if (!deletingCard) return
    setIsDeletingCard(true)

    try {
      const res = await fetch(`/api/cards/${deletingCard.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        showToast(data.error || 'Gagal menghapus kartu.', 'error')
        setIsDeletingCard(false)
        return
      }

      const remainingCards = cards.filter(c => c.id !== deletingCard.id)
      setCards(remainingCards)
      setSelected(remainingCards.length > 0 ? remainingCards[0] : null)
      setDeletingCard(null)
      showToast('Kartu berhasil dihapus & di-reset ke status unclaimed!')
    } catch (_) {
      showToast('Terjadi kesalahan saat menghapus kartu.', 'error')
    }
    setIsDeletingCard(false)
  }

  // Google Review generator state
  const [generatingReview, setGeneratingReview] = useState(false)
  const [reviewNote, setReviewNote] = useState<string | null>(null)

  const isValidGoogleMapsUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false
    const clean = url.trim().toLowerCase()
    return (
      clean.includes('maps.app.goo.gl') ||
      clean.includes('goo.gl/maps') ||
      clean.includes('writereview?placeid=')
    )
  }

  const handleGenerateReviewLink = async () => {
    if (!selected?.redirect_url) return
    if (!isValidGoogleMapsUrl(selected.redirect_url)) {
      showToast('Link Google Maps tidak valid! Wajib link bagikan (contoh: https://maps.app.goo.gl/...)', 'error')
      return
    }
    setGeneratingReview(true)
    setReviewNote(null)

    try {
      const res = await fetch('/api/tools/google-review-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: selected.redirect_url }),
      })
      const data = await res.json()
      if (data.reviewUrl) {
        setSelected({ ...selected, redirect_url: data.reviewUrl })
        showToast('Link ulasan bintang 5 Google berhasil diproses!')
        if (data.note) setReviewNote(data.note)
      } else if (data.error) {
        showToast(data.error, 'error')
      }
    } catch (_) {
      showToast('Gagal memproses link Google Maps.', 'error')
    }
    setGeneratingReview(false)
  }

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon_type: 'whatsapp'
  })

  // Save Card Settings Manually via Button Click
  const saveCardSettings = async () => {
    if (!selected) return
    setSavingCard(true)

    try {
      let finalRedirectUrl = selected.redirect_url

      // Auto convert raw Google Maps URL to direct review link if mode is google_review
      if (selected.mode === 'google_review' || selected.mode === 'review') {
        if (selected.redirect_url && !isValidGoogleMapsUrl(selected.redirect_url)) {
          showToast('Link Google Maps tidak valid! Wajib link bagikan (contoh: https://maps.app.goo.gl/...)', 'error')
          setSavingCard(false)
          return
        }
        if (selected.redirect_url && !selected.redirect_url.includes('writereview?placeid=')) {
          try {
            const genRes = await fetch('/api/tools/google-review-generator', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ input: selected.redirect_url }),
            })
            const genData = await genRes.json()
            if (genData.success && genData.reviewUrl) {
              finalRedirectUrl = genData.reviewUrl
            }
          } catch (_) { }
        }
      }

      const res = await fetch(`/api/cards/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_name: selected.card_name,
          mode: selected.mode,
          redirect_url: finalRedirectUrl,
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
    } catch (_) { }
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
    } catch (_) { }
  }

  const safeCards = Array.isArray(cards) ? cards : []
  const safeLinks = Array.isArray(links) ? links : []
  const currentPlatform = PLATFORM_OPTIONS[linkForm.icon_type] ?? PLATFORM_OPTIONS.other

  return (
    <div className="max-w-6xl w-full mx-auto text-slate-900 relative min-w-0 space-y-6 pb-12">

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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 tracking-tight font-display flex items-center gap-2.5">
            <CreditCard className="text-ony-blue shrink-0" size={28} />
            Media & Kartu Saya
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Kelola kartu, link profil, dan analitik interaksi.
          </p>
        </div>

        {selected && (
          <button
            onClick={() => {
              setTransferringCard(selected)
              setTransferEmail('')
              setTransferError(null)
            }}
            className="px-4 py-2.5 rounded-xl bg-ony-gradient text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all self-start md:self-auto shrink-0 cursor-pointer"
          >
            <Send size={15} />
            Transfer Kartu
          </button>
        )}
      </div>

      {/* Executive Quick Stats Bar */}
      {safeCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-ony-blue flex items-center justify-center shrink-0 border border-blue-100">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Media</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-display truncate">
                {safeCards.length.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Zap size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Interaksi</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-display truncate">
                {totalTaps.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">taps</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Aktif</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-display truncate">
                {activeCardsCount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Star size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kartu Dipilih</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate font-display">
                {selected?.card_name || 'Belum dipilih'}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0 items-start">

          {/* Left Sidebar: Scalable Card Search & Paginated Selector List (4 Columns) */}
          <div className="lg:col-span-4 space-y-3.5 min-w-0">
            <div className="card-surface p-3.5 sm:p-4 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-3">

              <div className="flex items-center justify-between">
                <div className="text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <SlidersHorizontal size={14} className="text-ony-blue" />
                  Daftar Media ({filteredCards.length})
                </div>
                {cards.length > filteredCards.length && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterMediaType('all')
                      setFilterMode('all')
                    }}
                    className="text-[11px] text-ony-blue font-bold hover:underline"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, kode ONY, atau URL..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-ony-blue/20 focus:border-ony-blue transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Controls Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Media Type Filter */}
                <select
                  value={filterMediaType}
                  onChange={e => setFilterMediaType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-ony-blue"
                >
                  <option value="all">Semua Tipe Media</option>
                  <option value="nfc_card">NFC Card</option>
                  <option value="nfc_sticker">NFC Sticker</option>
                  <option value="qr_standee">QR Standee</option>
                  <option value="qr_keychain">QR Keychain</option>
                  <option value="digital_qr">Digital QR</option>
                </select>

                {/* Sort By Filter */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'newest' | 'most_taps' | 'name')}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-ony-blue"
                >
                  <option value="newest">Terbaru</option>
                  <option value="most_taps">Tap Terbanyak</option>
                  <option value="name">Nama (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Scalable Paginated Cards List */}
            <div className="space-y-2.5 min-w-0">
              {paginatedCards.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-400 text-xs">
                  Tidak ada kartu yang cocok dengan pencarian kamu.
                </div>
              ) : (
                paginatedCards.map(card => {
                  const CardIcon = MEDIA_ICONS[card.media_type] ?? CreditCard
                  const isSelected = selected?.id === card.id
                  return (
                    <button
                      key={card.id}
                      onClick={() => { setSelected(card); setActiveTab('editor'); }}
                      className={cn(
                        'w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 min-w-0 cursor-pointer relative group',
                        isSelected
                          ? 'bg-blue-50/90 border-blue-400/80 text-slate-900 font-semibold ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:border-blue-300 text-slate-700 border-slate-200/90 hover:shadow-xs'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                        isSelected ? 'bg-ony-blue text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 group-hover:border-blue-200'
                      )}>
                        <CardIcon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm truncate text-slate-900 font-display">
                          {card.card_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5 font-medium">
                          <span>{MEDIA_TYPE_LABELS[card.media_type] || 'NFC Card'}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-slate-600 font-semibold">{card.activation_code}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-bold uppercase', STATUS_COLORS[card.status])}>
                          {card.status}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Zap size={10} className="text-amber-500" />
                          {card.total_taps ?? 0} taps
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Pagination Controls for Selector */}
            {totalCardsPages > 1 && (
              <div className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs">
                <button
                  onClick={() => setCardsPage(p => Math.max(1, p - 1))}
                  disabled={cardsPage === 1}
                  className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-[11px] font-bold text-slate-600">
                  Halaman {cardsPage} / {totalCardsPages}
                </span>

                <button
                  onClick={() => setCardsPage(p => Math.min(totalCardsPages, p + 1))}
                  disabled={cardsPage >= totalCardsPages}
                  className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Right Main Panel: Card Configuration & Management (8 Columns) */}
          {selected && (
            <div className="lg:col-span-8 space-y-6 min-w-0">

              {/* Card Editor Header Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
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
                      'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                      activeTab === 'logs'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Activity size={14} /> Statistik Tap ({selected.total_taps ?? 0})
                  </button>
                </div>

                <a
                  href={`/c/${selected.activation_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-ony-blue text-xs font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shrink-0"
                >
                  <Eye size={14} /> Lihat Profil
                </a>
              </div>

              {activeTab === 'editor' ? (
                <>
                  {/* Profile Section: Name & Avatar (Only in Profile Mode) */}
                  {(!selected.mode || selected.mode === 'profile') && (
                    <div className="card-surface p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 font-display flex items-center gap-2">
                        <User2 size={16} className="text-ony-blue" />
                        Identitas Profil Publik
                      </h2>

                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar Preview */}
                        <div className="relative shrink-0">
                          {profileForm.avatar_url ? (
                            <Image
                              src={profileForm.avatar_url}
                              alt={profileForm.name || 'Avatar'}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-100 shadow-md"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-ony-gradient flex items-center justify-center text-2xl font-bold text-white shadow-md">
                              {profileForm.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                          )}
                        </div>

                        {/* Form Fields */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <label className="text-slate-700 text-xs mb-1.5 block font-semibold">Nama Tampilan</label>
                            <input
                              className="input-field text-xs sm:text-sm"
                              value={profileForm.name}
                              onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Nama kamu"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 text-xs mb-1.5 block font-semibold flex items-center gap-1">
                              <Link2 size={11} /> URL Foto Profil
                            </label>
                            <input
                              className="input-field text-xs sm:text-sm font-mono"
                              value={profileForm.avatar_url}
                              onChange={e => setProfileForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                              placeholder="https://example.com/photo.jpg"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Kosongkan untuk menggunakan inisial nama</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Save size={14} />
                        {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                      </button>
                    </div>
                  )}

                  {/* Card Settings */}
                  <div className="card-surface p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl min-w-0">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200 min-w-0">
                          {/* 1. Profile Mode */}
                          <button
                            type="button"
                            onClick={() => setSelected({ ...selected, mode: 'profile' })}
                            className={cn(
                              'py-2.5 sm:py-3 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 text-center cursor-pointer',
                              (!selected.mode || selected.mode === 'profile')
                                ? 'bg-white text-ony-blue shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-1.5 font-display">
                              <Globe size={14} /> Profile Mode
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">Halaman profil & link</span>
                          </button>

                          {/* 2. Direct Redirect Mode */}
                          <button
                            type="button"
                            onClick={() => setSelected({ ...selected, mode: 'direct' })}
                            className={cn(
                              'py-2.5 sm:py-3 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 text-center cursor-pointer',
                              selected.mode === 'direct'
                                ? 'bg-white text-ony-blue shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-1.5 font-display">
                              <ExternalLink size={14} /> Direct Redirect
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">URL / WhatsApp Kustom</span>
                          </button>

                          {/* 3. Google Review Maps Mode */}
                          <button
                            type="button"
                            onClick={() => setSelected({ ...selected, mode: 'google_review' })}
                            className={cn(
                              'py-2.5 sm:py-3 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 text-center cursor-pointer',
                              (selected.mode === 'google_review' || selected.mode === 'review')
                                ? 'bg-white text-amber-600 shadow-xs border border-amber-200'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-1.5 font-display">
                              <Star size={14} className="fill-amber-400 text-amber-500" /> Review Maps
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">Ulasan Google Maps</span>
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

                        {/* Google Review Maps Target URL & Converter */}
                        {(selected.mode === 'google_review' || selected.mode === 'review') && (
                          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                            <div>
                              <label className="text-amber-900 text-xs font-bold mb-1 flex items-center justify-between">
                                <span>Target URL Google Maps / Review</span>
                              </label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  className="input-field text-sm bg-white flex-1 font-mono"
                                  value={selected.redirect_url ?? ''}
                                  onChange={e => setSelected({ ...selected, redirect_url: e.target.value })}
                                  onBlur={() => {
                                    if (selected.redirect_url && !selected.redirect_url.includes('writereview?placeid=')) {
                                      handleGenerateReviewLink()
                                    }
                                  }}
                                  placeholder="https://maps.app.goo.gl/... atau URL ulasan Google Maps"
                                />
                                <button
                                  type="button"
                                  onClick={handleGenerateReviewLink}
                                  disabled={generatingReview || !selected.redirect_url}
                                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                                >
                                  {generatingReview ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                  {generatingReview ? 'Memproses...' : 'Generate'}
                                </button>
                              </div>
                            </div>
                            {reviewNote && (
                              <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg border border-amber-200">
                                ℹ️ {reviewNote}
                              </p>
                            )}
                            <p className="text-[11px] text-amber-800/90 leading-relaxed">
                              ✨ <strong>Otomatis Convert:</strong> Cukup paste link Google Maps bisnis kamu (seperti <span className="font-mono text-amber-900">https://maps.app.goo.gl/...</span>). Sistem otomatis mengonversinya jadi link ulasan langsung saat disimpan!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Explicit Manual Save Button: Disabled when unchanged */}
                      <button
                        onClick={saveCardSettings}
                        disabled={savingCard || !hasUnsavedCardChanges}
                        className={cn(
                          "flex items-center justify-center gap-2 w-full py-3 text-sm font-bold transition-all rounded-xl",
                          hasUnsavedCardChanges
                            ? "btn-primary cursor-pointer shadow-sm"
                            : "bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed opacity-80"
                        )}
                      >
                        <Save size={16} />
                        {savingCard
                          ? 'Menyimpan Perubahan...'
                          : hasUnsavedCardChanges
                          ? 'Simpan Perubahan Kartu'
                          : 'Perubahan Kartu Tersimpan'}
                      </button>

                      {/* Danger Zone: Unlink / Delete Card */}
                      <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <div>
                          <h3 className="text-xs font-bold text-rose-900 font-display">Putuskan & Reset Kartu</h3>
                          <p className="text-[11px] text-rose-700/80">
                            Hapus kartu ini dari akun kamu, hapus seluruh data tautan & statistik agar kartu menjadi fresh (unclaimed) kembali.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeletingCard(selected)}
                          className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                        >
                          <Trash2 size={14} /> Hapus Kartu
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Links List (Only in Profile Mode) */}
                  {(!selected.mode || selected.mode === 'profile') ? (
                    <div className="card-surface p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="text-base font-bold text-slate-900 font-display">Kelola Link Tautan ({safeLinks.length})</h2>
                          <p className="text-slate-500 text-xs">Link ini akan muncul pada halaman profil publik kartu ini.</p>
                        </div>

                        <button
                          onClick={() => {
                            setLinkForm({ title: 'WhatsApp Saya', url: '', icon_type: 'whatsapp' })
                            setModalError(null)
                            setAddingLink(true)
                          }}
                          className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 font-bold cursor-pointer"
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
                                    'p-1.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer',
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
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                                  title="Edit Link"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  onClick={() => deleteLink(link.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
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
                              className="btn-ghost text-xs py-1.5 px-3 border-blue-200 text-ony-blue hover:bg-blue-50 cursor-pointer"
                            >
                              + Tambah Link Pertama
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card-surface p-6 bg-slate-50/80 border border-slate-200/90 shadow-xs rounded-2xl text-center">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-ony-blue flex items-center justify-center mx-auto mb-2.5">
                        <ExternalLink size={18} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 font-display mb-1">
                        Mode Kartu: {selected.mode === 'direct' ? 'Direct Redirect' : 'Google Review Maps'}
                      </h3>
                      <p className="text-[11px] text-slate-600 max-w-md mx-auto leading-relaxed">
                        Saat kartu di-tap atau di-scan, browser akan <strong>langsung mengalihkan pelanggan</strong> ke target URL di atas tanpa menampilkan halaman profil link.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Pilih <strong>Profile Mode</strong> di atas jika ingin menampilkan halaman profil berisi daftar link & kontak.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Tap Activity & Storage Efficiency Statistics */
                <div className="card-surface p-6 sm:p-8 bg-white border border-slate-200/90 shadow-xs rounded-2xl min-w-0 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                        <Zap size={20} className="text-amber-500 fill-amber-400" />
                        Statistik Interaksi Media
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Ringkasan total akumulasi tap NFC & scan QR pada kartu ini.
                      </p>
                    </div>

                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 size={15} /> Terhitung Real-time
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tap & QR Scan</div>
                      <div className="text-3xl font-extrabold text-slate-900 font-display">
                        {(selected.total_taps ?? 0).toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">kali</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">Dihitung secara otomatis setiap kali kartu di-tap atau QR di-scan.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informasi Kartu</div>
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Kode Aktivasi:</span>
                        <span className="font-mono bg-white px-2 py-0.5 border rounded text-slate-700">{selected.activation_code}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Status Kartu:</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded border uppercase', STATUS_COLORS[selected.status])}>{selected.status}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Jumlah Link Aktif:</span>
                        <span className="text-ony-blue font-extrabold">{safeLinks.length} link</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
                    <Sparkles size={18} className="text-ony-blue shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Performa & Kecepatan Pengalihan:</strong>
                      <p className="mt-0.5 text-slate-500">
                        Sistem Ony menghitung interaksi secara langsung dan aman untuk memastikan kecepatan pengalihan kartu NFC & QR milikmu tetap instan dan lancar kapan saja.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ✨ CLEAN SHADCN DIALOG: TAMBAH LINK BARU                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={addingLink} onOpenChange={setAddingLink}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 font-display">Tambah Link Tautan Baru</DialogTitle>
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
              className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleAddLink}
              disabled={submittingLink}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {submittingLink ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Simpan Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ✨ CLEAN SHADCN DIALOG: EDIT LINK                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingLink} onOpenChange={open => !open && setEditingLink(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 font-display">Edit Link Tautan</DialogTitle>
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
            <button onClick={() => setEditingLink(null)} className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600 cursor-pointer">Batal</button>
            <button
              onClick={handleUpdateLink}
              disabled={submittingLink}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {submittingLink ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Update Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ⚠️ DIALOG KONFIRMASI HAPUS & RESET KARTU                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={!!deletingCard} onOpenChange={open => !open && setDeletingCard(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2 font-display">
              <Trash2 size={20} /> Hapus & Reset Kartu
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Apakah kamu yakin ingin menghapus kartu <strong className="text-slate-900">{deletingCard?.card_name}</strong> ({deletingCard?.activation_code}) dari akun kamu?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1.5 mb-4">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertCircle size={15} className="text-amber-600 shrink-0" /> Efek Penghapusan Kartu:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/80">
              <li>Seluruh link tautan pada kartu ini akan dihapus permanen.</li>
              <li>Riwayat & statistik tap/scan akan dibersihkan hingga 0.</li>
              <li>Status kartu kembali menjadi <strong>unclaimed</strong> dan siap diklaim ulang oleh siapa saja.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setDeletingCard(null)}
              className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteCardConfirmed}
              disabled={isDeletingCard}
              className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-5 text-xs font-bold flex items-center gap-1.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isDeletingCard ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Hapus & Reset Sekarang
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 🔄 DIALOG TRANSFER KARTU                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={!!transferringCard} onOpenChange={open => !open && setTransferringCard(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
              <Send size={20} className="text-ony-blue" /> Transfer Kepemilikan Kartu
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Pindahkan kepemilikan kartu <strong className="text-slate-900">{transferringCard?.card_name}</strong> ({transferringCard?.activation_code}) ke akun pengguna Ony lainnya.
            </DialogDescription>
          </DialogHeader>

          {transferError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle size={15} className="shrink-0" />
              {transferError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1.5 block">Email Pengguna Penerima</label>
              <input
                type="email"
                className="input-field text-xs font-medium"
                placeholder="nama@domain.com"
                value={transferEmail}
                onChange={e => setTransferEmail(e.target.value)}
              />
              <p className="text-slate-400 text-[11px] mt-1">
                Penerima harus sudah terdaftar di platform Ony dengan email ini.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <AlertCircle size={15} className="text-ony-blue shrink-0" /> Ketentuan Transfer:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-900/80">
                <li>Kartu ini akan berpindah penuh dari dasbor kamu ke dasbor penerima.</li>
                <li>Seluruh daftar tautan & konfigurasi mode kartu tetap dipertahankan.</li>
                <li>Proses transfer instan dan tidak dapat dibatalkan otomatis.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2.5 mt-6 pt-2 border-t border-slate-100">
            <button
              onClick={() => setTransferringCard(null)}
              className="btn-ghost py-2 px-4 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleTransferCardConfirmed}
              disabled={isTransferring || !transferEmail.trim()}
              className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isTransferring ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {isTransferring ? 'Memproses Transfer...' : 'Transfer'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
