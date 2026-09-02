import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import { randomUUID } from 'crypto'
import { runSheetsBackup } from '@/lib/sheets-backup'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (adminEmail && typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

async function setSetting(key: string, value: string) {
  await supabaseAdmin
    .from('admin_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

// ─── GET — load current settings ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [cronSecret, sheetsEnabled, sheetsSpreadsheetId, sheetsServiceAccount] = await Promise.all([
    getSetting('backup_cron_secret'),
    getSetting('sheets_enabled'),
    getSetting('sheets_spreadsheet_id'),
    getSetting('sheets_service_account'),
  ])

  const baseUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
  const cronUrl = cronSecret ? `${baseUrl}/api/admin/backup/cron?secret=${cronSecret}` : null

  return NextResponse.json({
    cron_url: cronUrl,
    has_cron_secret: !!cronSecret,
    sheets_enabled: sheetsEnabled === 'true',
    sheets_spreadsheet_id: sheetsSpreadsheetId ?? '',
    has_service_account: !!sheetsServiceAccount,
  })
}

// ─── POST — actions ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  // ── Generate / regenerate cron token ────────────────────────────────────
  if (action === 'regenerate_token') {
    const newSecret = randomUUID()
    await setSetting('backup_cron_secret', newSecret)
    const baseUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
    return NextResponse.json({
      cron_url: `${baseUrl}/api/admin/backup/cron?secret=${newSecret}`,
    })
  }

  // ── Save Google Sheets config ────────────────────────────────────────────
  if (action === 'save_sheets') {
    const { spreadsheet_id, service_account_json, enabled } = body

    // Extract spreadsheet ID from full URL if needed
    let sheetId = (spreadsheet_id ?? '').trim()
    const urlMatch = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) sheetId = urlMatch[1]

    if (sheetId) await setSetting('sheets_spreadsheet_id', sheetId)

    if (service_account_json && service_account_json.trim() !== '') {
      try {
        JSON.parse(service_account_json)
      } catch {
        return NextResponse.json({ error: 'Service Account JSON tidak valid — pastikan format benar.' }, { status: 400 })
      }
      await setSetting('sheets_service_account', service_account_json.trim())
    }

    if (enabled !== undefined) await setSetting('sheets_enabled', enabled ? 'true' : 'false')

    return NextResponse.json({ ok: true })
  }

  // ── Test Google Sheets connection ────────────────────────────────────────
  if (action === 'test_sheets') {
    const [sheetsSpreadsheetId, sheetsServiceAccount] = await Promise.all([
      getSetting('sheets_spreadsheet_id'),
      getSetting('sheets_service_account'),
    ])

    if (!sheetsSpreadsheetId || !sheetsServiceAccount) {
      return NextResponse.json({ error: 'Spreadsheet ID dan Service Account belum dikonfigurasi.' }, { status: 400 })
    }

    try {
      const { google } = await import('googleapis')
      const credentials = JSON.parse(sheetsServiceAccount)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      const sheets = google.sheets({ version: 'v4', auth })
      const { data } = await sheets.spreadsheets.get({
        spreadsheetId: sheetsSpreadsheetId,
        fields: 'spreadsheetId,properties/title',
      })
      return NextResponse.json({ ok: true, title: data.properties?.title ?? 'Spreadsheet' })
    } catch (err) {
      return NextResponse.json(
        { error: `Koneksi gagal: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      )
    }
  }

  // ── Manual backup to Google Sheets ─────────────────────────────────────
  if (action === 'backup_to_sheets') {
    const [sheetsSpreadsheetId, sheetsServiceAccount] = await Promise.all([
      getSetting('sheets_spreadsheet_id'),
      getSetting('sheets_service_account'),
    ])

    if (!sheetsSpreadsheetId || !sheetsServiceAccount) {
      return NextResponse.json({ error: 'Sheets belum dikonfigurasi.' }, { status: 400 })
    }

    try {
      const { google } = await import('googleapis')
      const credentials = JSON.parse(sheetsServiceAccount)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      const sheets = google.sheets({ version: 'v4', auth })
      const results = await runSheetsBackup(sheets, sheetsSpreadsheetId)

      // Audit log
      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_id: (token?.userId as string) ?? 'ADMIN',
          action: 'MANUAL_BACKUP_SHEETS',
          target_type: 'SYSTEM',
          target_id: sheetsSpreadsheetId,
          details: { results, triggered_at: new Date().toISOString() },
        })
      } catch (_) {}

      return NextResponse.json({ ok: true, results })
    } catch (err) {
      return NextResponse.json(
        { error: `Backup gagal: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
