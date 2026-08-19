import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, email, purpose, googleMapsUrl } = await req.json()

    if (!code || !email) {
      return NextResponse.json({ error: 'Kode aktivasi dan email wajib diisi.' }, { status: 400 })
    }

    const cleanCode = String(code).trim().toUpperCase()
    const cleanEmail = String(email).trim().toLowerCase()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 })
    }

    // 1. Verify card exists and is unclaimed
    const { data: card, error: fetchErr } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('activation_code', cleanCode)
      .single()

    if (fetchErr || !card) {
      return NextResponse.json({ error: 'Kode aktivasi tidak ditemukan.' }, { status: 404 })
    }

    if (card.status !== 'unclaimed') {
      return NextResponse.json({ error: 'Kartu ini sudah diaktifkan sebelumnya.' }, { status: 400 })
    }

    if (card.payment_status === 'unpaid' || card.redirect_url === 'UNPAID') {
      return NextResponse.json({ error: 'Kartu blangko kosongan ini wajib dibayar via Midtrans sebelum diklaim.' }, { status: 400 })
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
      const defaultName = cleanEmail.split('@')[0]
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
        return NextResponse.json({ error: 'Gagal membuat profil user untuk email tersebut.' }, { status: 500 })
      }
      targetUser = newUser
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Gagal memproses data user target.' }, { status: 500 })
    }

    // 3. Determine card configuration based on purpose
    const isGoogleReview = purpose === 'google_review'
    const cardMode = isGoogleReview ? 'direct' : 'profile'
    const redirectUrl = isGoogleReview ? (googleMapsUrl?.trim() || 'https://maps.google.com') : null
    const cardName = isGoogleReview ? `Google Review — ${targetUser.name}` : `Kartu Nama — ${targetUser.name}`

    // 4. Update card record to active and assigned to target user
    const { data: updatedCard, error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({
        user_id: targetUser.id,
        status: 'active',
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

    // 5. Log audit (fail-safe)
    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        action: 'SELLER_CLAIM_CARD',
        target_type: 'CARD',
        target_id: card.id,
        details: {
          code: cleanCode,
          claimed_email: cleanEmail,
          purpose,
          googleMapsUrl,
        },
      })
    } catch (_) {}

    return NextResponse.json({
      success: true,
      card: updatedCard,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
