'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, CreditCard, BarChart2, QrCode,
  ShoppingBag, Settings, LogOut, Menu, ChevronRight, ShieldAlert
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',            label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/cards',      label: 'My Media',   icon: CreditCard },
  { href: '/dashboard/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/dashboard/store',      label: 'Official Store', icon: ShoppingBag },
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
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="text-rose-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Akun Ditangguhkan</h2>
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
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Ony" width={140} height={42} className="h-9 w-auto rounded object-contain" priority />
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
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
              <span className="font-semibold">{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}

        {user?.role === 'admin' || user?.role === 'superadmin' ? (
          <Link href="/admin" className="sidebar-link mt-4 border-t border-slate-200/80 pt-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50/80">
            <LayoutDashboard size={18} className="text-amber-600" />
            <span className="text-amber-700 font-bold">Admin Panel</span>
          </Link>
        ) : null}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          {user?.image ? (
            <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="rounded-full ring-2 ring-blue-100 shadow-xs" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-ony-gradient flex items-center justify-center text-white text-xs font-bold shadow-xs font-display">
              {user?.name?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 text-xs font-bold truncate">{user?.name}</div>
            <div className="text-slate-500 text-[11px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          id="signout-btn"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs transition-all font-semibold border border-slate-200/80 bg-white shadow-xs"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-ony-blue selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 fixed inset-y-0 left-0 z-30 shadow-xs">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-up">
          <div className="flex flex-col w-64 bg-white border-r border-slate-200 shadow-2xl">
            <Sidebar />
          </div>
          <div className="flex-1 bg-slate-950/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-slate-50 min-w-0 overflow-x-hidden">
        {/* Mobile Navbar Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex items-center">
            <Image src="/logo.png" alt="Ony" width={120} height={36} className="h-8 w-auto rounded object-contain" priority />
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Floating WhatsApp Support Widget */}
      <a
        href={`https://wa.me/6289654728249?text=${encodeURIComponent(
          `Halo Admin Ony CS, saya (${user?.email || 'User'}) butuh bantuan mengenai akun/media Ony saya.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bantuan Customer Support WhatsApp"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all duration-300 group font-display border border-emerald-400/40"
      >
        <div className="relative flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-300 opacity-75" />
          <svg className="w-5 h-5 fill-current relative z-10" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </div>
        <span className="font-bold text-xs tracking-wide">Bantuan CS</span>
      </a>
    </div>
  )
}
