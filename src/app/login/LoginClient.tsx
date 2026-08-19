'use client'

import { signIn, useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Wifi, Shield, Zap, Loader2, CreditCard } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'
import { loginWithGoogleFirebase } from '@/lib/firebase'

function LoginForm() {
  const { data: session, status } = useSession()
  const params = useSearchParams()
  const router = useRouter()

  const rawCallback = params.get('callbackUrl')
  let claimCode = params.get('claim') || params.get('autoClaim')

  // Safely extract relative path and claim code even if absolute URL (e.g. https://ony-nfc.vercel.app/c/...) is passed
  let sanitizedCallback = '/dashboard'

  if (rawCallback) {
    try {
      if (rawCallback.startsWith('http://') || rawCallback.startsWith('https://')) {
        const u = new URL(rawCallback)
        sanitizedCallback = u.pathname + u.search
        const matchCode = u.pathname.match(/\/c\/([A-Za-z0-9_-]+)/)
        if (matchCode && !claimCode) {
          claimCode = matchCode[1]
        }
        const autoClaimInUrl = u.searchParams.get('autoClaim') || u.searchParams.get('claim')
        if (autoClaimInUrl && !claimCode) {
          claimCode = autoClaimInUrl
        }
      } else {
        sanitizedCallback = rawCallback
        const matchCode = rawCallback.match(/\/c\/([A-Za-z0-9_-]+)/)
        if (matchCode && !claimCode) {
          claimCode = matchCode[1]
        }
      }
    } catch (_) {
      sanitizedCallback = rawCallback
    }
  } else if (claimCode) {
    sanitizedCallback = `/c/${claimCode}?autoClaim=${claimCode}`
  }

  const callbackUrl = sanitizedCallback

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handle already authenticated state
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (claimCode) {
        fetch('/api/cards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: claimCode }),
        }).finally(() => {
          router.replace(callbackUrl)
        })
      } else {
        router.replace(callbackUrl)
      }
    }
  }, [status, session, callbackUrl, claimCode, router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      // 1. Firebase Google Auth Popup
      const fbUser = await loginWithGoogleFirebase()

      // 2. NextAuth Credentials login via Firebase user details
      const res = await signIn('firebase', {
        email: fbUser.email,
        name: fbUser.name,
        image: fbUser.photoURL,
        uid: fbUser.uid,
        redirect: false,
        callbackUrl,
      })

      if (res?.error) {
        setErrorMsg('Gagal masuk ke sistem. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // 3. Handle Claim Card if code is passed
      if (claimCode) {
        try {
          await fetch('/api/cards/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: claimCode }),
          })
        } catch (_) {}
      }

      router.push(callbackUrl)
    } catch (err: unknown) {
      console.error('Firebase Auth error:', err)
      // Fallback: if popup fails or is blocked, try NextAuth Google provider directly
      signIn('google', { callbackUrl })
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-ony-blue" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-ony-blue selection:text-white">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white border-r border-slate-200 flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-block mb-14 group">
            <Image src="/logo.png" alt="Ony" width={160} height={48} className="h-11 w-auto rounded object-contain transition-transform group-hover:scale-105" priority />
          </Link>

          {/* Interactive Ony NFC Card Preview */}
          <div className="mb-12 relative w-72 h-44">
            <div className="nfc-ring w-52 h-52 -top-4 -left-4 absolute border-blue-400/30" />
            <div className="nfc-ring w-52 h-52 -top-4 -left-4 absolute border-cyan-400/30" />

            <div className="relative z-10 w-72 h-44 rounded-2xl p-5 shadow-2xl overflow-hidden animate-float"
              style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid #334155' }}>
              <div className="absolute inset-0 bg-ony-gradient opacity-20 pointer-events-none" />
              <div className="flex flex-col justify-between h-full relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-5 rounded bg-amber-400/90 border border-amber-300/40" />
                    <CreditCard className="text-slate-400 ml-1" size={16} />
                  </div>
                  <Wifi className="text-ony-cyan animate-pulse" size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">ONY SMART MEDIA</div>
                  <div className="text-sm text-slate-100 font-extrabold tracking-wider mt-0.5 font-display">CONNECTED IDENTITY</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">**** **** **** ONY</div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold text-slate-900 mb-3 leading-tight tracking-tight font-display">
            Connected Identity.<br />
            <span className="ony-gradient-text">Simplified.</span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed max-w-sm">
            Satu akun Google untuk mengelola seluruh media NFC dan QR Code kamu secara aman.
          </p>
        </div>

        <div className="relative z-10 space-y-3.5 pt-6 border-t border-slate-100">
          {[
            { icon: Wifi, text: 'NFC + QR Dual Access 1 Media' },
            { icon: Zap,  text: 'Aktifkan media mandiri dalam 30 detik' },
            { icon: Shield, text: 'Data aman terproteksi Google OAuth' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-ony-blue" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Login Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="mb-10 lg:hidden flex justify-center">
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="Ony" width={150} height={44} className="h-10 w-auto rounded object-contain" priority />
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight font-display">Selamat Datang</h1>
            <p className="text-slate-600 text-sm">Login untuk mengelola kartu NFC & QR Code kamu.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold shadow-xs">
              {errorMsg}
            </div>
          )}

          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
              bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90
              transition-all duration-200 active:scale-[0.98] shadow-xs disabled:opacity-60 hover:border-blue-300 font-display"
          >
            {loading ? (
              <Loader2 className="animate-spin text-slate-900" size={20} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Memproses Sign In...' : 'Lanjutkan dengan Google'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs leading-relaxed">
              Dengan login, kamu menyetujui{' '}
              <a href="#" className="text-ony-blue font-semibold hover:underline">Syarat & Ketentuan</a>
              {' '}dan{' '}
              <a href="#" className="text-ony-blue font-semibold hover:underline">Kebijakan Privasi</a> Ony.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <Link href="/" className="text-slate-600 hover:text-ony-blue text-sm font-semibold transition-colors inline-flex items-center gap-1.5 font-display">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
