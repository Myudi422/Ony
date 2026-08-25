import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, email, name, cardPurpose, googleMapsUrl, customRedirectUrl } = await req.json()

    if (!code || !email) {
      return NextResponse.json({ error: 'Kode aktivasi dan email pembuat/pemilik wajib diisi.' }, { status: 400 })
    }

    const cleanCode = String(code).trim().toUpperCase()
    const cleanEmail = String(email).trim().toLowerCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 })
    }

    // 1. Verify card exists
    const { data: card, error: fetchErr } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('activation_code', cleanCode)
      .single()

    if (fetchErr || !card) {
      return NextResponse.json({ error: 'Kode aktivasi tidak ditemukan.' }, { status: 404 })
    }

    if (card.status !== 'unclaimed' && card.status !== 'active') {
      return NextResponse.json({ error: `Kartu ini berstatus "${card.status}". Tidak dapat diklaim.` }, { status: 400 })
    }

    // Check payment requirement
    const isUnpaid = card.redirect_url === 'UNPAID' || card.payment_status === 'unpaid'
    if (isUnpaid) {
      return NextResponse.json({
        success: false,
        requires_payment: true,
        message: 'Kartu blangko ini belum dibayar. Wajib melakukan pembayaran via Cash.id terlebih dahulu.',
        cardId: card.id,
      }, { status: 402 })
    }

    // 2. Find or create target user by email
    let targetUser: { id: string; name: string; email: string } | null = null

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingUser) {
      targetUser = existingUser
    } else {
      const defaultName = name ? String(name).trim() : cleanEmail.split('@')[0]
      const { data: newUser, error: createErr } = await supabaseAdmin
        .from('users')
        .insert({
          email: cleanEmail,
          name: defaultName,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, name, email')
        .single()

      if (createErr || !newUser) {
        return NextResponse.json({ error: 'Gagal membuat profil pengguna baru.' }, { status: 500 })
      }
      targetUser = newUser
    }

    // 3. Determine card mode and redirect URL
    let cardMode = 'profile'
    let redirectUrl: string | null = null

    if (cardPurpose === 'google_review') {
      cardMode = 'direct'
      redirectUrl = googleMapsUrl?.trim() || 'https://maps.google.com'
    } else if (cardPurpose === 'custom_redirect') {
      cardMode = 'direct'
      redirectUrl = customRedirectUrl?.trim() || null
    }

    const cardName = cardPurpose === 'google_review'
      ? `Google Review — ${targetUser.name}`
      : `Kartu Nama — ${targetUser.name}`

    // 4. Update card to active
    const { data: updatedCard, error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({
        user_id: targetUser.id,
        status: 'active',
        payment_status: 'paid',
        mode: cardMode,
        redirect_url: redirectUrl,
        card_name: cardName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      card: updatedCard,
      user: targetUser,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
