import { supabaseAdmin } from './supabase'
import type { sheets_v4 } from 'googleapis'

export const BACKUP_TABLES = ['users', 'cards', 'links', 'tap_logs', 'orders', 'admin_audit_logs']

const HEADER_BG  = { red: 0.032, green: 0.486, blue: 1 }
const HEADER_FG  = { red: 1, green: 1, blue: 1 }
const BORDER_CLR = { red: 0.878, green: 0.906, blue: 0.941 }
const ALT_ROW_BG = { red: 0.973, green: 0.980, blue: 0.992 }
const SECTION_BG = { red: 0.235, green: 0.522, blue: 0.957 } // section header #3C85F4
const TODAY_BG   = { red: 0.925, green: 0.961, blue: 1 }     // light blue row #EBF5FF

type Row = Record<string, unknown>

export async function runSheetsBackup(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  // ── 1. Existing tabs ────────────────────────────────────────────────────
  const { data: spreadsheet } = await sheets.spreadsheets.get({ spreadsheetId })
  const sheetMap = new Map<string, number>(
    spreadsheet.sheets?.map((s) => [s.properties?.title ?? '', s.properties?.sheetId ?? 0]) ?? []
  )

  // ── 2. Fetch all data first (needed for Overview) ────────────────────────
  const allData: Record<string, Row[]> = {}
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabaseAdmin
      .from(table).select('*')
      .order('created_at' as string, { ascending: true })
      .limit(10000)
    if (error) { results[table] = `skip: ${error.message}`; continue }
    allData[table] = (data ?? []) as Row[]
  }

  // ── 3. Write 📊 Overview tab ─────────────────────────────────────────────
  await writeOverviewSheet(sheets, spreadsheetId, sheetMap, allData)

  // ── 4. Write each data table ─────────────────────────────────────────────
  for (const table of BACKUP_TABLES) {
    const rows = allData[table]
    if (!rows) continue
    if (rows.length === 0) { results[table] = 'empty'; continue }
    try {
      await writeDataSheet(sheets, spreadsheetId, sheetMap, table, rows)
      results[table] = `${rows.length} rows`
    } catch (err) {
      results[table] = `error: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return results
}

// ─── Overview sheet ──────────────────────────────────────────────────────────
async function writeOverviewSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetMap: Map<string, number>,
  allData: Record<string, Row[]>
) {
  const OVERVIEW = '📊 Overview'
  const todayStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const cards  = allData['cards']  ?? []
  const users  = allData['users']  ?? []
  const orders = allData['orders'] ?? []
  const taps   = allData['tap_logs'] ?? []

  const cardsByStatus = cards.reduce<Record<string, number>>((acc, c) => {
    const s = String(c.status ?? 'unknown')
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  const todayCards  = cards.filter(c  => String(c.created_at ?? '').startsWith(todayStr)).length
  const todayUsers  = users.filter(u  => String(u.created_at ?? '').startsWith(todayStr)).length
  const todayOrders = orders.filter(o => String(o.created_at ?? '').startsWith(todayStr)).length
  const todayTaps   = taps.filter(t  => String(t.created_at ?? '').startsWith(todayStr)).length

  const ts = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

  // Build rows: [label, value]
  const values: string[][] = [
    ['📊 Ony Platform — Backup Overview', ''],
    ['Last Updated', ts],
    ['', ''],
    ['── KARTU (Cards) ──', ''],
    ['Total Kartu', String(cards.length)],
    ['🟢 Active',    String(cardsByStatus['active']    ?? 0)],
    ['⚪ Unclaimed', String(cardsByStatus['unclaimed']  ?? 0)],
    ['🔴 Suspended', String(cardsByStatus['suspended']  ?? 0)],
    ['', ''],
    ['── PENGGUNA (Users) ──', ''],
    ['Total Users', String(users.length)],
    ['', ''],
    ['── ORDERS ──', ''],
    ['Total Orders', String(orders.length)],
    ['', ''],
    ['── AKTIVITAS HARI INI ──', ts.slice(0, 10)],
    ['Kartu Baru Hari Ini',   String(todayCards)],
    ['User Baru Hari Ini',    String(todayUsers)],
    ['Order Baru Hari Ini',   String(todayOrders)],
    ['Tap / Klik Hari Ini',   String(todayTaps)],
    ['', ''],
    ['── TABEL TERSEDIA ──', ''],
    ...BACKUP_TABLES.map(t => [t, `${(allData[t] ?? []).length} rows`]),
  ]

  // Create tab if missing — ensure it's the FIRST sheet
  if (!sheetMap.has(OVERVIEW)) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: OVERVIEW, index: 0 } } }],
      },
    })
    sheetMap.set(OVERVIEW, addRes.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0)
  }

  const sheetId = sheetMap.get(OVERVIEW) ?? 0

  // Clear & write
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${OVERVIEW}!A:B` })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${OVERVIEW}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  })

  // Collect row indexes for special formatting
  const titleRowIdx     = 0
  const sectionRowIdxs  = values.reduce<number[]>((acc, r, i) => r[0].startsWith('──') ? [...acc, i] : acc, [])
  const todayStartIdx   = values.findIndex(r => r[0] === '── AKTIVITAS HARI INI ──')
  const todayEndIdx     = todayStartIdx + 5

  const requests: object[] = [
    // Freeze row 1 (title)
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },

    // Title row: big bold blue
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
        cell: { userEnteredFormat: { backgroundColor: HEADER_BG, textFormat: { bold: true, foregroundColor: HEADER_FG, fontSize: 13 }, padding: { top: 10, bottom: 10, left: 12, right: 12 } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat,padding)',
      },
    },

    // Section headers
    ...sectionRowIdxs.map(i => ({
      repeatCell: {
        range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: 2 },
        cell: { userEnteredFormat: { backgroundColor: SECTION_BG, textFormat: { bold: true, foregroundColor: HEADER_FG, fontSize: 10 }, padding: { top: 6, bottom: 6, left: 10, right: 10 } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat,padding)',
      },
    })),

    // Today rows: light blue highlight
    ...(todayStartIdx > 0 ? [{
      repeatCell: {
        range: { sheetId, startRowIndex: todayStartIdx + 1, endRowIndex: todayEndIdx, startColumnIndex: 0, endColumnIndex: 2 },
        cell: { userEnteredFormat: { backgroundColor: TODAY_BG } },
        fields: 'userEnteredFormat.backgroundColor',
      },
    }] : []),

    // Value column: bold
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: values.length, startColumnIndex: 1, endColumnIndex: 2 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 }, horizontalAlignment: 'RIGHT' } },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },

    // Col A width 250, Col B width 120
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
  ]

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } })
}

// ─── Data table sheet ────────────────────────────────────────────────────────
async function writeDataSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetMap: Map<string, number>,
  table: string,
  data: Row[]
) {
  const headers = Object.keys(data[0])
  const rows    = data.map(row => headers.map(h => {
    const v = row[h]
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }))

  if (!sheetMap.has(table)) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: table } } }] },
    })
    sheetMap.set(table, addRes.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0)
  }

  const sheetId = sheetMap.get(table) ?? 0
  const numCols = headers.length
  const numRows = data.length

  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${table}!A:ZZZ` })
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `${table}!A1`, valueInputOption: 'RAW',
    requestBody: { values: [headers, ...rows] },
  })

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Freeze header
        { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
        // Header style
        { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: numCols }, cell: { userEnteredFormat: { backgroundColor: HEADER_BG, textFormat: { bold: true, foregroundColor: HEADER_FG, fontSize: 10, fontFamily: 'Google Sans' }, horizontalAlignment: 'LEFT', verticalAlignment: 'MIDDLE', padding: { top: 8, bottom: 8, left: 10, right: 10 } } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)' } },
        // Data rows base style
        { repeatCell: { range: { sheetId, startRowIndex: 1, endRowIndex: numRows + 1, startColumnIndex: 0, endColumnIndex: numCols }, cell: { userEnteredFormat: { textFormat: { fontSize: 10, fontFamily: 'Google Sans' }, verticalAlignment: 'MIDDLE', padding: { top: 6, bottom: 6, left: 10, right: 10 } } }, fields: 'userEnteredFormat(textFormat,verticalAlignment,padding)' } },
        // Alternating rows
        ...Array.from({ length: Math.ceil(numRows / 2) }, (_, i) => ({
          repeatCell: { range: { sheetId, startRowIndex: 2 + i * 2, endRowIndex: Math.min(3 + i * 2, numRows + 1), startColumnIndex: 0, endColumnIndex: numCols }, cell: { userEnteredFormat: { backgroundColor: ALT_ROW_BG } }, fields: 'userEnteredFormat.backgroundColor' },
        })),
        // Borders
        { updateBorders: { range: { sheetId, startRowIndex: 0, endRowIndex: numRows + 1, startColumnIndex: 0, endColumnIndex: numCols }, top: { style: 'SOLID', width: 1, color: BORDER_CLR }, bottom: { style: 'SOLID', width: 1, color: BORDER_CLR }, left: { style: 'SOLID', width: 1, color: BORDER_CLR }, right: { style: 'SOLID', width: 1, color: BORDER_CLR }, innerHorizontal: { style: 'SOLID', width: 1, color: BORDER_CLR }, innerVertical: { style: 'SOLID', width: 1, color: BORDER_CLR } } },
        // Auto-resize columns
        { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: numCols } } },
        // Auto-filter dropdowns on header
        { setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, endRowIndex: numRows + 1, startColumnIndex: 0, endColumnIndex: numCols } } } },
      ],
    },
  })
}
