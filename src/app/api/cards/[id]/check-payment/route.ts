import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLivePricing } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch Card
    let { data: card } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!card) {
      const { data: byCode } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('activation_code', id.toUpperCase())
        .maybeSingle()
      card = byCode
    }

    if (!card) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 })
    }

    // If card is already paid
    if (card.payment_status === 'paid' && card.redirect_url !== 'UNPAID') {
      return NextResponse.json({
        success: true,
        settled: true,
        alreadyActive: true,
        message: 'Kartu sudah aktif & terbayar.',
      })
    }

    const livePricing = await getLivePricing()
    const cashiApiKey = livePricing.cashi_api_key || process.env.CASHI_API_KEY || '7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa'

    // Find latest transaction for this card
    const { data: txList } = await supabaseAdmin
      .from('transactions')
      .select('order_id, customer_details, created_at')
      .ilike('order_id', `%${card.activation_code}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!txList || txList.length === 0) {
      return NextResponse.json({
        success: false,
        settled: false,
        message: 'Belum ada data transaksi pembayaran yang tercatat untuk kartu ini.',
      })
    }

    // Check each order_id against Cashi.id API
    for (const tx of txList) {
      if (!tx.order_id) continue

      try {
        const checkRes = await fetch(`https://cashi.id/api/check-status/${tx.order_id}`, {
          headers: { 'x-api-key': cashiApiKey },
          cache: 'no-store',
        })

        const checkData = await checkRes.json().catch(() => ({}))
        const statusStr = String(
          checkData?.status ||
          checkData?.data?.status ||
          checkData?.transaction_status ||
          checkData?.data?.transaction_status ||
          checkData?.payment_status ||
          checkData?.data?.payment_status ||
          ''
        ).toUpperCase()

        const isSettled = ['SETTLED', 'PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'SETTLE'].includes(statusStr)

        if (isSettled) {
          const metadata = tx.customer_details || {}
          const email = metadata?.email
          const purpose = metadata?.purpose || 'google_review'
          const targetUrl = metadata?.targetUrl || null

          let targetUserId = metadata?.userId || null
          if (!targetUserId && email) {
            const cleanEmail = String(email).trim().toLowerCase()
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', cleanEmail)
              .maybeSingle()

            if (existingUser) {
              targetUserId = existingUser.id
            } else {
              const defaultName = cleanEmail.split('@')[0]
              const { data: newUser } = await supabaseAdmin
                .from('users')
                .insert({
                  email: cleanEmail,
                  name: defaultName,
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single()
              if (newUser) targetUserId = newUser.id
            }
          }

          const isDirectMode = purpose === 'google_review' || purpose === 'custom_redirect'
          const cardMode = isDirectMode ? 'direct' : 'profile'
          const redirectUrl = isDirectMode ? (targetUrl || 'https://maps.google.com') : null
          const cardName = purpose === 'google_review' ? 'Google Review' : purpose === 'custom_redirect' ? 'Custom Redirect' : 'Business Card'

          const updateObj: Record<string, unknown> = {
            payment_status: 'paid',
            status: 'active',
            mode: cardMode,
            redirect_url: redirectUrl,
            card_name: cardName,
            updated_at: new Date().toISOString(),
          }
          if (targetUserId) updateObj.user_id = targetUserId

          await supabaseAdmin.from('cards').update(updateObj).eq('id', card.id)
          await supabaseAdmin.from('transactions').update({ transaction_status: 'paid', updated_at: new Date().toISOString() }).eq('order_id', tx.order_id)

          return NextResponse.json({
            success: true,
            settled: true,
            redirectUrl,
            message: 'Pembayaran terverifikasi! Kartu berhasil diaktifkan.',
          })
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      settled: false,
      message: 'Status pembayaran di Cashi.id belum Settled. Silakan selesaikan pembayaran terlebih dahulu.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Gagal mengecek status pembayaran' }, { status: 500 })
  }
}
