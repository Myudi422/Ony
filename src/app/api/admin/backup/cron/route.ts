import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runSheetsBackup } from '@/lib/sheets-backup'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Auth: validate cron secret (no session — called by cronjob.com)
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret) return NextResponse.json({ error: 'Missing secret' }, { status: 401 })

  const { data: secretRow } = await supabaseAdmin
    .from('admin_settings')
    .select('value')
    .eq('key', 'backup_cron_secret')
    .single()

  if (!secretRow?.value || secretRow.value !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load Sheets config
  const { data: settingsRows } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
    .in('key', ['sheets_enabled', 'sheets_spreadsheet_id', 'sheets_service_account'])

  const cfg = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value]))
  const ts = new Date().toISOString()
  let results: Record<string, string> = {}

  if (cfg.sheets_enabled === 'true' && cfg.sheets_spreadsheet_id && cfg.sheets_service_account) {
    try {
      const { google } = await import('googleapis')
      const credentials = JSON.parse(cfg.sheets_service_account)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      const sheets = google.sheets({ version: 'v4', auth })
      results = await runSheetsBackup(sheets, cfg.sheets_spreadsheet_id)
      results._status = 'sheets_ok'
    } catch (err) {
      results._status = `sheets_error: ${err instanceof Error ? err.message : String(err)}`
    }
  } else {
    results._status = 'sheets_not_configured'
  }

  // Audit log
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: 'CRON',
      action: 'SCHEDULED_BACKUP',
      target_type: 'SYSTEM',
      target_id: 'cron',
      details: { results, triggered_at: ts },
    })
  } catch (_) {}

  return NextResponse.json({ ok: true, triggered_at: ts, results })
}
