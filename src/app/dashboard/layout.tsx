'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, CreditCard, BarChart2, QrCode,
  ShoppingBag, Settings, LogOut, Menu, X, ChevronRight, ShieldAlert
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',            label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/cards',      label: 'My Media',   icon: CreditCard },
  { href: '/dashboard/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/dashboard/store',      label: 'Store',      icon: ShoppingBag },
  { href: '/dashboard/settings',   label: 'Settings',   icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = session?.user as { name?: string; email?: string; image?: string; role?: string; status?: string } | undefined

  if (status === 'authenticated' && (user?.status === 'suspended' || user?.status === 'banned')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="card-surface p-8 max-w-md w-full border-rose-200 shadow-xl relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="text-rose-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Akun Ditangguhkan</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Akun Anda (<span className="text-slate-900 font-medium">{user.email}</span>) telah ditangguhkan oleh Administrator. Seluruh fitur dashboard dan akses kartu dinonaktifkan sementara.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mb-6 space-y-2">
            <div className="text-xs text-slate-600">Status Akun: <span className="text-rose-600 font-bold uppercase">{user.status}</span></div>
            <div className="text-xs text-slate-600">Bantuan Support: <span className="text-slate-900 font-semibold">Admin Ony Official</span></div>
          </div>
          <div className="space-y-3">
            <a
              href={`https://wa.me/6289654728249?text=${encodeURIComponent(`Halo Admin Ony, akun saya (${user.email}) ditangguhkan. Mohon dibantu pengaktifannya.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              Hubungi Admin via WhatsApp
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Keluar / Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="p-5 border-b border-slate-200/80">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Ony" width={150} height={44} className="h-10 w-auto rounded object-contain" priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}

        {user?.role === 'admin' || user?.role === 'superadmin' ? (
          <Link href="/admin" className="sidebar-link mt-4 border-t border-slate-200 pt-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50">
            <LayoutDashboard size={18} className="text-amber-600" />
            <span className="text-amber-700 font-semibold">Admin Panel</span>
          </Link>
        ) : null}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          {user?.image ? (
            <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="rounded-full ring-2 ring-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-ony-gradient flex items-center justify-center text-white text-sm font-bold shadow-xs">
              {user?.name?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-slate-500 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          id="signout-btn"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-sm transition-all font-medium"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 fixed inset-y-0 left-0 z-30 shadow-xs">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col w-64 bg-white border-r border-slate-200">
            <Sidebar />
          </div>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-slate-50">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1">
            <Menu size={22} />
          </button>
          <div className="flex items-center">
            <Image src="/logo.png" alt="Ony" width={130} height={40} className="h-9 w-auto rounded object-contain" priority />
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
