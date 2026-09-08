'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, User, CreditCard, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AuditLog {
  id: string; admin_id: string; action: string; target_type: string; target_id: string;
  details: Record<string, unknown>; created_at: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  USER: User, CARD: CreditCard, ORDER: ShoppingBag,
}

const ACTION_COLORS: Record<string, string> = {
  SUSPEND: 'text-rose-700 bg-rose-50 border-rose-200',
  ACTIVATE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CHANGE_ROLE: 'text-amber-700 bg-amber-50 border-amber-200',
  BATCH_GENERATE: 'text-blue-700 bg-blue-50 border-blue-200',
  UNBIND: 'text-amber-700 bg-amber-50 border-amber-200',
  UPDATE_ORDER: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  CLAIM_CARD: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback((p: number) => {
    setLoading(true)
    fetch(`/api/admin/audit?page=${p}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) {
          setLogs(d.data)
          setTotalPages(d.totalPages ?? 1)
          setTotal(d.total ?? 0)
          setPage(d.page ?? p)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Audit Log</h1>
          <p className="text-slate-600">Riwayat aktivitas admin — 7 hari terakhir. {total > 0 && <span className="font-semibold text-slate-700">{total} entri</span>}</p>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                {['Waktu', 'Admin ID', 'Aksi', 'Target', 'Detail'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Memuat...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Belum ada log dalam 7 hari terakhir.</td></tr>
              ) : logs.map(log => {
                const actionKey = Object.keys(ACTION_COLORS).find(k => log.action.includes(k)) ?? ''
                const color = ACTION_COLORS[actionKey] ?? 'text-slate-600 bg-slate-100 border-slate-200'
                const Icon = ACTION_ICONS[log.target_type] ?? FileText
                return (
                  <tr key={log.id} className="border-b border-slate-200/60 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-slate-500 text-xs">{log.admin_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${color}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-slate-400" />
                        <span className="text-slate-600 text-xs font-medium">{log.target_type}</span>
                        <span className="font-mono text-slate-400 text-xs">{log.target_id.slice(0, 8)}…</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500">Halaman {page} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchLogs(p) }}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => { setPage(p); fetchLogs(p) }}
                  className={`min-w-[28px] h-7 text-xs rounded-lg font-medium transition-colors ${
                    p === page
                      ? 'bg-ony-blue text-white'
                      : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchLogs(p) }}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
