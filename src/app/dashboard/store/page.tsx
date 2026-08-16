'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Package, Check, Truck, CreditCard, Tag, Tv, Key } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PRODUCTS = [
  {
    id: 'nfc-card-pvc',
    icon: CreditCard,
    name: 'NFC Card PVC',
    desc: 'Kartu bisnis NFC + QR premium.',
    price: 89000,
    features: ['Chip NTAG213', 'QR tercetak', 'Custom desain', 'Tahan air'],
  },
  {
    id: 'nfc-sticker',
    icon: Tag,
    name: 'NFC Sticker',
    desc: 'Stiker NFC + QR waterproof.',
    price: 39000,
    features: ['Chip NTAG213', 'QR tercetak', 'Adhesif kuat', 'Waterproof'],
  },
  {
    id: 'qr-standee',
    icon: Tv,
    name: 'QR Standee Akrilik',
    desc: 'Standee akrilik premium untuk meja.',
    price: 149000,
    features: ['Akrilik 3mm', 'QR + NFC', 'Base besi', 'UV print'],
  },
  {
    id: 'nfc-keychain',
    icon: Key,
    name: 'NFC Keychain',
    desc: 'Gantungan kunci dengan chip NFC.',
    price: 59000,
    features: ['Chip NTAG213', 'QR belakang', 'Epoxy finish', 'Ring baja'],
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Menunggu Pembayaran', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Package },
  paid:       { label: 'Dibayar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Check },
  processing: { label: 'Diproses', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Package },
  shipped:    { label: 'Dikirim', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: Truck },
  completed:  { label: 'Selesai', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Check },
  cancelled:  { label: 'Dibatalkan', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Package },
}

interface CartItem { id: string; name: string; price: number; qty: number }
interface Order { id: string; order_number?: string; total_amount?: number; status?: string; created_at?: string }

export default function StorePage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [snapToken, setSnapToken] = useState<string | null>(null)
  const [tab, setTab] = useState<'shop' | 'orders'>('shop')

  const snapJsUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'

  const [productsList, setProductsList] = useState(PRODUCTS)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setOrders(d.filter(Boolean)) })
      .catch(() => {})

    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(d => {
        if (d) {
          const effPrice = d.is_promo_active ? (Number(d.card_promo_price) || 39000) : (Number(d.card_base_price) || 49000)
          setProductsList(prev => prev.map(p => p.id === 'nfc-card-pvc' ? { ...p, price: effPrice } : p))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (snapToken && typeof window !== 'undefined' && (window as unknown as { snap?: { pay: (token: string, opts: object) => void } }).snap) {
      (window as unknown as { snap: { pay: (t: string, opts: object) => void } }).snap.pay(snapToken, {
        onSuccess: () => { location.reload() },
        onPending: () => { setTab('orders') },
        onError: () => { alert('Pembayaran gagal atau dibatalkan.') },
        onClose: () => {},
      })
    }
  }, [snapToken])

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id)
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0)

  const checkout = async () => {
    if (!cart.length || !address.trim()) return
    setOrdering(true)
    try {
      const items = cart.map(c => ({
        id: c.id, name: c.name, price: c.price, quantity: c.qty,
      }))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping_address: address, total_amount: total }),
      })
      const data = await res.json()
      if (data.order) {
        setOrders(prev => [data.order, ...prev])
      }
      if (data.snapToken) {
        setSnapToken(data.snapToken)
      }
      setCart([])
      setTab('orders')
    } catch (_) {}
    setOrdering(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Store</h1>
        <p className="text-slate-600">Beli media NFC & QR tambahan untuk akun kamu.</p>
      </div>

      {/* Midtrans Snap Script */}
      <script
        src={snapJsUrl}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        async
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        {(['shop', 'orders'] as const).map(t => {
          const TabIcon = t === 'shop' ? ShoppingBag : Package
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                tab === t ? 'bg-ony-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <TabIcon size={16} />
              {t === 'shop' ? 'Belanja' : 'Pesanan Saya'}
            </button>
          )
        })}
      </div>

      {tab === 'shop' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {productsList.map(p => {
              const Icon = p.icon
              return (
                <div key={p.id} className="card-surface p-5 flex flex-col hover:border-blue-300 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                    <Icon size={20} className="text-ony-blue" />
                  </div>
                  <div className="text-slate-900 font-bold mb-1">{p.name}</div>
                <p className="text-slate-600 text-xs mb-3 flex-1">{p.desc}</p>
                <ul className="space-y-1 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                      <Check size={10} className="text-ony-blue" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  <div className="text-slate-900 font-bold">{formatCurrency(p.price)}</div>
                  <button
                    onClick={() => addToCart(p)}
                    className="btn-primary text-xs px-4 py-2"
                    id={`add-to-cart-${p.id}`}
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            )
          })}
        </div>

          {/* Cart */}
          <div className="card-surface p-5 h-fit sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-ony-blue" />
              <h3 className="font-bold text-slate-900">Keranjang ({cart.reduce((s, c) => s + c.qty, 0)})</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Keranjang kosong</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map(c => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span className="text-slate-700">{c.name} ×{c.qty}</span>
                      <span className="text-slate-900 font-medium">{formatCurrency(c.price * c.qty)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-ony-blue">{formatCurrency(total)}</span>
                  </div>
                </div>

                <textarea
                  className="input-field text-sm mb-3 resize-none"
                  rows={3}
                  placeholder="Alamat pengiriman lengkap..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
                <button
                  id="checkout-btn"
                  onClick={checkout}
                  disabled={ordering || !address.trim()}
                  className="btn-primary w-full text-sm py-3 font-semibold disabled:opacity-50"
                >
                  {ordering ? 'Memproses...' : 'Checkout via Midtrans'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="card-surface p-12 text-center">
              <Package size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Belum ada pesanan.</p>
            </div>
          ) : (
            orders.filter(Boolean).map(order => {
              const statusKey = order?.status ?? 'pending'
              const st = STATUS_LABELS[statusKey] ?? STATUS_LABELS.pending
              const Icon = st.icon
              return (
                <div key={order.id ?? Math.random()} className="card-surface p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${st.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-900 font-bold text-sm">{order.order_number ?? 'Pesanan'}</div>
                    <div className="text-slate-500 text-xs">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-900 font-bold text-sm">{formatCurrency(order.total_amount ?? 0)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
