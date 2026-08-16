'use client'

import { useEffect, useState } from 'react'
import { FileText, User, CreditCard, ShoppingBag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AuditLog {
  id: string; admin_id: string; action: string; target_type: string; target_id: string;
  details: Record<string, unknown>; created_at: string;
  users?: { name: string; email: string }
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

  useEffect(() => {
    fetch('/api/admin/audit').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setLogs(d)
    }).catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Audit Log</h1>
        <p className="text-slate-600">Riwayat aktivitas admin dan sistem.</p>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                {['Waktu', 'Admin', 'Aksi', 'Target', 'Detail'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Belum ada log.</td></tr>
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
                      <div className="text-slate-900 text-xs font-medium">{log.users?.name ?? 'System'}</div>
                      <div className="text-slate-500 text-xs">{log.users?.email}</div>
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
      </div>
    </div>
  )
}
