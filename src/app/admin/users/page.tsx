'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Search, Shield, Ban, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; avatar_url: string; role: string; status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

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
  }
  const ROLE_COLORS: Record<string, string> = {
    user:       'text-slate-600 bg-slate-100 border-slate-200',
    admin:      'text-amber-700 bg-amber-50 border-amber-200',
    superadmin: 'text-ony-blue bg-blue-50 border-blue-200',
  }

  return (
    <div className="max-w-6xl w-full mx-auto min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">User Management</h1>
        <p className="text-slate-600 text-xs sm:text-sm">{total} user terdaftar</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9 w-full text-xs sm:text-sm"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto min-w-0 w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                {['User', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">Memuat...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">Tidak ada user ditemukan.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-slate-200/60 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-ony-gradient flex items-center justify-center text-white text-xs font-bold">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user.role] ?? ''}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[user.status] ?? ''}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
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
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-sm">
              ← Prev
            </button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white disabled:opacity-40 transition-all shadow-sm">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
