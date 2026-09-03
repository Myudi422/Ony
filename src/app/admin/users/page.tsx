'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Search, Shield, Ban, CreditCard, Copy, Check, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface User {
  id: string
  name: string
  email: string
  avatar_url: string
  role: string
  status: string
  created_at: string
  card_count?: number
}

interface UserCard {
  id: string
  card_number?: number | null
  activation_code: string
  card_name?: string
  media_type: string
  status: string
  payment_status?: string
  redirect_url?: string | null
  total_taps: number
  mode: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Card Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [cardsTotal, setCardsTotal] = useState(0)
  const [cardsPage, setCardsPage] = useState(1)
  const [cardsSearch, setCardsSearch] = useState('')
  const [cardsLoading, setCardsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } catch (_) {}
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const loadUserCards = useCallback(async () => {
    if (!selectedUser) return
    setCardsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/cards?page=${cardsPage}&limit=5&search=${encodeURIComponent(cardsSearch)}`)
      const data = await res.json()
      setUserCards(data.cards ?? [])
      setCardsTotal(data.total ?? 0)
    } catch (_) {}
    setCardsLoading(false)
  }, [selectedUser, cardsPage, cardsSearch])

  useEffect(() => {
    if (isModalOpen && selectedUser) {
      loadUserCards()
    }
  }, [isModalOpen, selectedUser, loadUserCards])

  const openCardsModal = (user: User) => {
    setSelectedUser(user)
    setCardsPage(1)
    setCardsSearch('')
    setIsModalOpen(true)
  }

  const doAction = async (userId: string, action: string, value: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, value }),
    })
    load()
  }

  const STATUS_COLORS: Record<string, string> = {
    active:    'text-emerald-700 border-emerald-200 bg-emerald-50',
    suspended: 'text-rose-700 border-rose-200 bg-rose-50',
    banned:    'text-rose-800 border-rose-300 bg-rose-100',
    unclaimed: 'text-amber-700 border-amber-200 bg-amber-50',
  }

  const ROLE_COLORS: Record<string, string> = {
    user:       'text-slate-600 bg-slate-100 border-slate-200',
    admin:      'text-amber-700 bg-amber-50 border-amber-200',
    superadmin: 'text-ony-blue bg-blue-50 border-blue-200',
  }

  return (
    <div className="max-w-6xl w-full mx-auto min-w-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">User Management</h1>
          <p className="text-slate-600 text-xs sm:text-sm">{total} user terdaftar di platform</p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-all"
          title="Reload User Data"
        >
          <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9 w-full text-xs sm:text-sm"
            placeholder="Cari nama atau email user..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card-surface overflow-hidden min-w-0 w-full shadow-sm rounded-2xl border border-slate-200/90 bg-white">
        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                {['User', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin text-ony-blue" />
                      <span>Memuat data user...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">Tidak ada user ditemukan.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-slate-200/60 hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.name} width={36} height={36} className="rounded-full ring-1 ring-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-ony-gradient flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                            {user.name?.[0] ?? '?'}
                          </div>
                        )}
                        <div>
                          <div className="text-slate-900 font-medium text-sm">{user.name}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium uppercase tracking-wide text-[10px] ${ROLE_COLORS[user.role] ?? ''}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize text-[10px] ${STATUS_COLORS[user.status] ?? ''}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Tombol Kartu Modal */}
                        <button
                          onClick={() => openCardsModal(user)}
                          className="flex items-center gap-1 text-xs text-ony-blue border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all font-semibold bg-white shadow-2xs"
                          title="Lihat Daftar Kartu User"
                        >
                          <CreditCard size={12} />
                          <span>Kartu</span>
                          <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-blue-100 text-blue-800 rounded-full font-mono font-bold">
                            {user.card_count ?? 0}
                          </span>
                        </button>

                        {user.status === 'active' ? (
                          <button
                            onClick={() => doAction(user.id, 'status', 'suspended')}
                            className="flex items-center gap-1 text-xs text-rose-600 border border-rose-200 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all font-medium"
                          >
                            <Ban size={11} /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => doAction(user.id, 'status', 'active')}
                            className="flex items-center gap-1 text-xs text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all font-medium"
                          >
                            <Shield size={11} /> Aktifkan
                          </button>
                        )}
                        {user.role === 'user' && (
                          <button
                            onClick={() => doAction(user.id, 'role', 'admin')}
                            className="flex items-center gap-1 text-xs text-amber-700 border border-amber-300 hover:bg-amber-50 px-2 py-1 rounded-lg transition-all font-medium"
                          >
                            ↑ Admin
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => doAction(user.id, 'role', 'user')}
                            className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 hover:bg-slate-100 px-2 py-1 rounded-lg transition-all font-medium"
                          >
                            ↓ User
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
          <span className="text-slate-500 text-xs">
            Halaman {page} · {total} total user
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-2xs font-medium">
              ← Prev
            </button>
            <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-2xs font-medium">
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: LIST KARTU USER */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full p-0 sm:max-w-2xl overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              {selectedUser?.avatar_url ? (
                <Image src={selectedUser.avatar_url} alt={selectedUser.name} width={40} height={40} className="rounded-full ring-2 ring-blue-100 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-ony-gradient flex items-center justify-center text-white text-sm font-bold shadow-2xs shrink-0">
                  {selectedUser?.name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <span>Kartu Milik {selectedUser?.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-ony-blue font-mono font-bold">
                    {cardsTotal} Total Kartu
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedUser?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Search filter in modal */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field pl-9 pr-3 w-full text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white"
                placeholder="Cari kode aktivasi kartu..."
                value={cardsSearch}
                onChange={e => { setCardsSearch(e.target.value); setCardsPage(1); }}
              />
            </div>

            {/* Cards Table Container */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[320px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">No / Kode</th>
                      <th className="px-4 py-2.5">Nama Media</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-center">Pembayaran</th>
                      <th className="px-4 py-2.5 text-center">Total Tap</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cardsLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-ony-blue" />
                            <span>Memuat daftar kartu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : userCards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                          {cardsSearch ? 'Tidak ada kartu yang cocok dengan pencarian.' : 'User ini belum memiliki kartu terhubung.'}
                        </td>
                      </tr>
                    ) : (
                      userCards.map(card => {
                        const isUnpaid = card.payment_status === 'unpaid' || card.redirect_url === 'UNPAID'
                        const cardUrl = `${baseUrl}/c/${card.activation_code}`
                        const isCopied = copiedCode === card.activation_code

                        return (
                          <tr key={card.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                              <div>#{card.card_number ?? '-'}</div>
                              <div className="text-[11px] text-ony-blue font-semibold">{card.activation_code}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{card.card_name || 'NFC Smart Media'}</div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-tight">{card.media_type || 'NFC + QR'}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn('px-2 py-0.5 text-[10px] rounded-full font-bold border capitalize', STATUS_COLORS[card.status] || 'bg-slate-100 text-slate-700')}>
                                {card.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn('px-2 py-0.5 text-[10px] rounded-full font-bold border uppercase tracking-wider', isUnpaid ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200')}>
                                {isUnpaid ? 'BLANK' : 'BAYAR'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                              {card.total_taps ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(cardUrl)
                                    setCopiedCode(card.activation_code)
                                    setTimeout(() => setCopiedCode(null), 2000)
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Salin URL Link NFC"
                                >
                                  {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                </button>
                                <a
                                  href={cardUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-ony-blue hover:text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Buka Link NFC"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Pagination Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 text-xs font-medium">
                Halaman {cardsPage} dari {Math.ceil(cardsTotal / 5) || 1} ({cardsTotal} total kartu)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={cardsPage === 1 || cardsLoading}
                  onClick={() => setCardsPage(p => Math.max(1, p - 1))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all font-semibold shadow-2xs"
                >
                  ← Prev
                </button>
                <button
                  disabled={cardsPage * 5 >= cardsTotal || cardsLoading}
                  onClick={() => setCardsPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all font-semibold shadow-2xs"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
