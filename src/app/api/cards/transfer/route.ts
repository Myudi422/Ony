import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const getUserId = (token: Record<string, unknown> | null) => {
  if (!token) return null
  return (token.userId || token.sub || token.id) as string | null
}

const getUserEmail = (token: Record<string, unknown> | null) => {
  if (!token) return null
  return (token.email) as string | null
}

// POST /api/cards/transfer
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = getUserId(token as Record<string, unknown> | null)
    const senderEmail = getUserEmail(token as Record<string, unknown> | null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { card_id, target_email } = body

    if (!card_id || !target_email) {
      return NextResponse.json({ error: 'ID Kartu dan Email Penerima wajib diisi.' }, { status: 400 })
    }

    const cleanEmail = String(target_email).trim().toLowerCase()
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json({ error: 'Format email penerima tidak valid.' }, { status: 400 })
    }

    // 1. Verify card ownership
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, card_name, activation_code, user_id')
      .eq('id', card_id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan.' }, { status: 404 })
    }

    if (card.user_id !== userId) {
      return NextResponse.json({ error: 'Akses ditolak. Kartu ini bukan milik akun kamu.' }, { status: 403 })
    }

    // 2. Prevent self-transfer
    if (senderEmail && cleanEmail === senderEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Tidak dapat mentransfer kartu ke email kamu sendiri.' }, { status: 400 })
    }

    // 3. Find recipient user in DB
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', cleanEmail)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({
        error: `Pengguna dengan email ${cleanEmail} belum terdaftar di Ony. Silakan minta penerima untuk login/daftar terlebih dahulu.`
      }, { status: 404 })
    }

    if (targetUser.id === userId) {
      return NextResponse.json({ error: 'Tidak dapat mentransfer kartu ke akun sendiri.' }, { status: 400 })
    }

    // 4. Update card ownership
    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({
        user_id: targetUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', card_id)

    if (updateError) {
      console.error('Transfer card error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 5. Update user_id on links attached to this card if column exists
    try {
      await supabaseAdmin
        .from('links')
        .update({ user_id: targetUser.id })
        .eq('card_id', card_id)
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Kartu ${card.card_name} (${card.activation_code}) telah berhasil ditransfer ke ${targetUser.name || targetUser.email}!`,
      transferredTo: targetUser.email
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mentransfer kartu.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
