import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Activation code required' }, { status: 400 })

  const cleanCode = code.trim().toUpperCase()

  // Verify card exists and is unclaimed
  const { data: card, error: fetchErr } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('activation_code', cleanCode)
    .single()

  if (fetchErr || !card) {
    return NextResponse.json({ error: 'Kode aktivasi tidak valid.' }, { status: 404 })
  }

  if (card.status !== 'unclaimed') {
    return NextResponse.json({ error: 'Kartu ini sudah diaktifkan oleh pengguna lain.' }, { status: 400 })
  }

  if (card.payment_status === 'unpaid' || card.redirect_url === 'UNPAID') {
    return NextResponse.json({ error: 'Kartu blangko kosongan ini wajib dibayar via Midtrans sebelum diklaim.' }, { status: 400 })
  }

  // Bind card to user
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('cards')
    .update({
      user_id: token.userId as string,
      status: 'active',
      card_name: `${token.name ?? 'Saya'}'s Card`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', card.id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Log audit
  await supabaseAdmin.from('admin_audit_logs').insert({
    admin_id: token.userId as string,
    action: 'CLAIM_CARD',
    target_type: 'CARD',
    target_id: card.id,
    details: { code: cleanCode },
  })

  return NextResponse.json({ success: true, card: updated })
}
