import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

const isAdminEmail = (email?: string | null) => {
  if (!email) return false
  const adminEmail = process.env.ADMIN_EMAIL ?? 'myudi422@gmail.com'
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim()
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'firebase',
      name: 'Firebase Auth',
      credentials: {
        email: { label: 'Email', type: 'text' },
        name: { label: 'Name', type: 'text' },
        image: { label: 'Image', type: 'text' },
        uid: { label: 'UID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const isAdmin = isAdminEmail(credentials.email)
        const role = isAdmin ? 'superadmin' : 'user'

        try {
          // Sync / upsert to Supabase users table
          const { data, error } = await supabaseAdmin.from('users').upsert({
            email: credentials.email,
            name: credentials.name || credentials.email.split('@')[0],
            avatar_url: credentials.image || '',
            role,
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' }).select().single()

          if (error) {
            console.error('Supabase user upsert error:', error)
          }

          return {
            id: data?.id || credentials.uid || credentials.email,
            email: credentials.email,
            name: credentials.name || credentials.email.split('@')[0],
            image: credentials.image || '',
          }
        } catch (e) {
          console.error('Authorize error:', e)
          return {
            id: credentials.uid || credentials.email,
            email: credentials.email,
            name: credentials.name || credentials.email.split('@')[0],
            image: credentials.image || '',
          }
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      })
    ] : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        const u = new URL(url)
        if (u.origin === baseUrl) return url
        // Normalize cross-domain URLs to current host baseUrl (e.g. ony-nfc.vercel.app -> ony.my.id)
        if (u.pathname) return `${baseUrl}${u.pathname}${u.search}`
      } catch (_) {}
      return baseUrl
    },
    async signIn({ user }) {
      if (!user.email) return false
      const isAdmin = isAdminEmail(user.email)
      try {
        await supabaseAdmin.from('users').upsert({
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          avatar_url: user.image ?? '',
          role: isAdmin ? 'superadmin' : undefined,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' })
      } catch (_) {}
      return true
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email
      if (email) {
        const isAdmin = isAdminEmail(email)
        try {
          let { data } = await supabaseAdmin
            .from('users')
            .select('id, role, status')
            .eq('email', email)
            .single()

          if (data) {
            if (isAdmin && data.role !== 'superadmin' && data.role !== 'admin') {
              await supabaseAdmin.from('users').update({ role: 'superadmin' }).eq('id', data.id)
              data.role = 'superadmin'
            }
            token.userId = data.id
            token.role   = data.role ?? (isAdmin ? 'superadmin' : 'user')
            token.status = data.status
          } else if (isAdmin) {
            token.role = 'superadmin'
          }
        } catch (_) {
          if (isAdmin) token.role = 'superadmin'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id     = token.userId
        ;(session.user as Record<string, unknown>).role   = token.role
        ;(session.user as Record<string, unknown>).status = token.status
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
}

export default authOptions
