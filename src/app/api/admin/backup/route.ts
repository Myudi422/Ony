import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (adminEmail && typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

// Escape a single value for SQL INSERT
function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') {
    // JSON/arrays
    const str = JSON.stringify(val).replace(/'/g, "''")
    return `'${str}'`
  }
  // String — escape single quotes
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

function tableToSQL(tableName: string, rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) {
    return `-- Table: ${tableName} (no rows)\n`
  }

  const cols = Object.keys(rows[0])
  const colList = cols.map((c) => `"${c}"`).join(', ')

  const lines: string[] = [
    `-- =============================================`,
    `-- Table: ${tableName}  (${rows.length} rows)`,
    `-- =============================================`,
    ``,
  ]

  for (const row of rows) {
    const vals = cols.map((c) => escapeSqlValue(row[c])).join(', ')
    lines.push(`INSERT INTO "${tableName}" (${colList}) VALUES (${vals});`)
  }

  lines.push('')
  return lines.join('\n')
}

// Tables to export — ordered by FK dependency (parents first)
const TABLES = [
  'users',
  'cards',
  'links',
  'tap_logs',
  'orders',
  'admin_audit_logs',
]

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ts = new Date().toISOString()

  const sections: string[] = [
    `-- ============================================================`,
    `-- Ony Platform — PostgreSQL Data Backup`,
    `-- Generated: ${ts}`,
    `-- Admin: ${token?.email ?? 'unknown'}`,
    `-- ============================================================`,
    ``,
    `BEGIN;`,
    ``,
  ]

  for (const table of TABLES) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .order('created_at' as string, { ascending: true })
        .limit(50000) // safety cap

      if (error) {
        sections.push(`-- [SKIP] ${table}: ${error.message}\n`)
        continue
      }

      sections.push(tableToSQL(table, (data ?? []) as Record<string, unknown>[]))
    } catch (err) {
      sections.push(`-- [ERROR] ${table}: ${String(err)}\n`)
    }
  }

  sections.push(`COMMIT;`)
  sections.push(``)
  sections.push(`-- End of backup`)

  const sql = sections.join('\n')
  const filename = `ony_backup_${ts.replace(/[:.]/g, '-').slice(0, 19)}.sql`

  // Log audit
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: (token?.userId as string) ?? 'ADMIN',
      action: 'DATABASE_BACKUP',
      target_type: 'SYSTEM',
      target_id: 'backup',
      details: { tables: TABLES, generated_at: ts },
    })
  } catch (_) {}

  return new NextResponse(sql, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
