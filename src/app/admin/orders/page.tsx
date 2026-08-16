'use client'

import { useEffect, useState } from 'react'
import { Package, Truck, Check, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Order {
  id: string; order_number: string; total_amount: number; status: string;
  shipping_address: string; tracking_number: string | null; shipping_courier: string | null;
  created_at: string; users?: { name: string; email: string }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [resi, setResi] = useState('')
  const [courier, setCourier] = useState('')

  useEffect(() => {
    fetch('/api/admin/orders').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setOrders(d)
    }).catch(() => {})
  }, [])

  const updateOrder = async (orderId: string, update: Record<string, unknown>) => {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...update }),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...update } : o))
    setSelected(null)
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:    { label: 'Pending',   color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: Package },
    paid:       { label: 'Dibayar',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Check },
    processing: { label: 'Diproses',  color: 'text-blue-700 bg-blue-50 border-blue-200',    icon: Package },
    shipped:    { label: 'Dikirim',   color: 'text-purple-700 bg-purple-50 border-purple-200', icon: Truck },
    completed:  { label: 'Selesai',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Check },
    cancelled:  { label: 'Batal',     color: 'text-rose-700 bg-rose-50 border-rose-200',     icon: X },
  }

  return (
    <div className="max-w-5xl w-full mx-auto min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 font-display">Order Management</h1>
        <p className="text-slate-600 text-xs sm:text-sm">{orders.length} total pesanan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-3 min-w-0">
          {orders.length === 0 ? (
            <div className="card-surface p-12 text-center">
              <Package size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Belum ada pesanan.</p>
            </div>
          ) : orders.map(order => {
            const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            const Icon = st.icon
            return (
              <button key={order.id} onClick={() => { setSelected(order); setResi(order.tracking_number ?? ''); setCourier(order.shipping_courier ?? '') }}
                className={`w-full text-left card-surface p-5 hover:border-blue-300 transition-all ${selected?.id === order.id ? 'border-blue-400 bg-blue-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${st.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-slate-900 font-mono font-bold text-sm">{order.order_number}</div>
                      <div className="text-slate-500 text-xs">{order.users?.name ?? 'Unknown'} · {order.users?.email}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-slate-900 font-bold text-sm">{formatCurrency(order.total_amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                  </div>
                </div>
                <div className="mt-2 text-slate-500 text-xs">{formatDate(order.created_at)}</div>
              </button>
            )
          })}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="card-surface p-5 h-fit sticky top-6 space-y-4">
            <h3 className="font-bold text-slate-900">{selected.order_number}</h3>

            <div>
              <div className="text-slate-500 text-xs mb-1 font-medium">Alamat Pengiriman</div>
              <div className="text-slate-700 text-xs leading-relaxed">{selected.shipping_address}</div>
            </div>

            <div>
              <label className="text-slate-600 text-xs mb-1.5 block font-medium">Kurir</label>
              <input className="input-field text-sm" placeholder="JNE, SiCepat, J&T..." value={courier} onChange={e => setCourier(e.target.value)} />
            </div>

            <div>
              <label className="text-slate-600 text-xs mb-1.5 block font-medium">Nomor Resi</label>
              <input className="input-field text-sm font-mono" placeholder="Nomor resi pengiriman" value={resi} onChange={e => setResi(e.target.value)} />
            </div>

            <div>
              <label className="text-slate-600 text-xs mb-2 block font-medium">Update Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['processing', 'shipped', 'completed', 'cancelled'] as const).map(status => (
                  <button key={status} onClick={() => updateOrder(selected.id, { status, tracking_number: resi, shipping_courier: courier })}
                    className="text-xs py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50 transition-all capitalize font-medium">
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => updateOrder(selected.id, { tracking_number: resi, shipping_courier: courier })}
              className="btn-primary w-full text-sm py-2.5">
              Simpan Resi
            </button>
          </div>
        ) : (
          <div className="card-surface p-8 text-center h-fit">
            <Package size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Pilih pesanan untuk update resi</p>
          </div>
        )}
      </div>
    </div>
  )
}
