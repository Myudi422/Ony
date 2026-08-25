import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    const email = searchParams.get('email')
    const name = searchParams.get('name')
    const purpose = searchParams.get('purpose') || 'business_card'
    const googleMapsUrl = searchParams.get('googleMapsUrl')
    const customRedirectUrl = searchParams.get('customRedirectUrl')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib disertakan.' }, { status: 400 })
    }

    // 1. Query Cash.id status API
    const cashiRes = await fetch(`https://cashi.id/api/check-status/${orderId}`, {
      headers: { 'Cache-Control': 'no-cache' },
    })

    const statusData = await cashiRes.json().catch(() => null)

    const isSettled = statusData?.status === 'SETTLED' || statusData?.status === 'SUCCESS' || statusData?.status === 'PAID'

    if (!isSettled) {
      return NextResponse.json({
        success: true,
        paid: false,
        status: statusData?.status || 'PENDING',
      })
    }

    // 2. Settlement confirmed! Process card claim & activation
    // Parse activation code from orderId: CARD-CLAIM-[CODE]-[TIMESTAMP]
    const parts = orderId.split('-')
    const code = parts[2] || id

    // Find Card
    let { data: card } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!card && code) {
      const { data: byCode } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('activation_code', code.toUpperCase())
        .maybeSingle()
      card = byCode
    }

    if (!card) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 })
    }

    // Find or Create User for target email (if email supplied)
    let targetUserId = card.user_id

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase()
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (existingUser) {
        targetUserId = existingUser.id
      } else {
        const userName = name ? String(name).trim() : cleanEmail.split('@')[0]
        const { data: newUser } = await supabaseAdmin
          .from('users')
          .insert({
            email: cleanEmail,
            name: userName,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (newUser) {
          targetUserId = newUser.id
        }
      }
    }

    // Determine card mode and redirect URL
    let cardMode = 'profile'
    let redirectUrl: string | null = null

    if (purpose === 'google_review') {
      cardMode = 'direct'
      redirectUrl = googleMapsUrl?.trim() || 'https://maps.google.com'
    } else if (purpose === 'custom_redirect') {
      cardMode = 'direct'
      redirectUrl = customRedirectUrl?.trim() || null
    }

    // 3. Update Card Status to Active & Paid
    const updatePayload: Record<string, unknown> = {
      payment_status: 'paid',
      status: 'active',
      mode: cardMode,
      redirect_url: redirectUrl,
      updated_at: new Date().toISOString(),
    }
    if (targetUserId) {
      updatePayload.user_id = targetUserId
    }

    const { data: updatedCard, error: updateErr } = await supabaseAdmin
      .from('cards')
      .update(updatePayload)
      .eq('id', card.id)
      .select()
      .single()

    if (updateErr) {
      console.error('Failed to update card after Cash.id payment settlement:', updateErr)
    }

    // 4. Update Transaction Record to settled
    try {
      await supabaseAdmin
        .from('transactions')
        .update({
          transaction_status: 'settled',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
    } catch (_) {}

    return NextResponse.json({
      success: true,
      paid: true,
      card: updatedCard || card,
    })
  } catch (err: any) {
    console.error('Check Cash.id payment error:', err)
    return NextResponse.json({ error: err?.message || 'Error memeriksa status pembayaran' }, { status: 500 })
  }
}
