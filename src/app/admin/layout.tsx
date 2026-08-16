'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Users, CreditCard, ShoppingBag, BarChart2, FileText, Home, ChevronRight, Loader2, DollarSign, Menu } from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin',           label: 'Overview',      icon: BarChart2 },
  { href: '/admin/users',     label: 'Users',         icon: Users },
  { href: '/admin/media',     label: 'Media',         icon: CreditCard },
  { href: '/admin/pricing',   label: 'Harga Dinamis', icon: DollarSign },
  { href: '/admin/orders',    label: 'Orders',        icon: ShoppingBag },
  { href: '/admin/audit',     label: 'Audit Log',     icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  const isAdmin = user?.email?.toLowerCase().trim() === 'myudi422@gmail.com'
    || user?.role === 'admin'
    || user?.role === 'superadmin'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [status, isAdmin, router])

  if (status === 'loading' || (status === 'authenticated' && !isAdmin)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-ony-blue" size={32} />
      </div>
    )
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-slate-200/80">
        <Link href="/admin" className="flex items-center justify-between gap-2 mb-1">
          <Image src="/logo.png" alt="Ony Admin" width={130} height={40} className="h-9 w-auto rounded object-contain" priority />
          <span className="text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-50 rounded-full border border-amber-200 tracking-wider uppercase font-display">
            ADMIN
          </span>
        </Link>
        <div className="text-slate-500 text-xs truncate mt-2 font-medium">
          {user?.name} · <span className="capitalize font-bold text-slate-700">{user?.role}</span>
        </div>
      </div>

      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon size={18} />
              <span className="font-bold text-xs sm:text-sm">{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="sidebar-link text-slate-700 hover:text-slate-900 font-bold text-xs"
        >
          <Home size={16} />
          Kembali ke User Dashboard
        </Link>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-ony-blue selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 shadow-xs">
        <SidebarContent />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-up">
          <div className="flex flex-col w-64 bg-white border-r border-slate-200 shadow-2xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-slate-950/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 lg:ml-60 min-h-screen flex flex-col bg-slate-50 min-w-0 overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-700 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Ony Admin" width={110} height={34} className="h-8 w-auto rounded object-contain" priority />
            <span className="text-amber-700 text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200 font-display">
              ADMIN
            </span>
          </div>

          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <Home size={20} />
          </Link>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
