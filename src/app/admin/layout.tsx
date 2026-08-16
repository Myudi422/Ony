'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { Users, CreditCard, ShoppingBag, BarChart2, FileText, Home, ChevronRight, Loader2, DollarSign } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 shadow-xs">
        <div className="p-5 border-b border-slate-200">
          <Link href="/admin" className="flex items-center justify-between gap-2 mb-1">
            <Image src="/logo.png" alt="Ony Admin" width={130} height={40} className="h-9 w-auto rounded object-contain" priority />
            <span className="text-amber-700 text-[10px] font-bold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
              ADMIN
            </span>
          </Link>
          <div className="text-slate-500 text-xs truncate mt-2">{user?.name} · <span className="capitalize">{user?.role}</span></div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={active ? 'sidebar-link-active' : 'sidebar-link'}>
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <Link href="/dashboard" className="sidebar-link text-slate-700 hover:text-slate-900">
            <Home size={16} />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <div className="flex-1 lg:ml-60 min-h-screen bg-slate-50">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
