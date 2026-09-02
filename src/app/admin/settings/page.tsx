'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Database, Download, Loader2, ShieldCheck, Clock, AlertTriangle, CheckCircle2,
  CalendarClock, Copy, RefreshCw, TableProperties, PlugZap, Info, ExternalLink,
  Server, FileCode2, CheckCircle,
} from 'lucide-react'

type BackupStatus  = 'idle' | 'loading' | 'success' | 'error'
type SheetsStatus  = 'idle' | 'testing' | 'ok' | 'error'
type ManualSheets  = 'idle' | 'loading' | 'success' | 'error'

interface Settings {
  cron_url: string | null
  has_cron_secret: boolean
  sheets_enabled: boolean
  sheets_spreadsheet_id: string
  has_service_account: boolean
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  // ── Manual backup ──────────────────────────────────────────────────────────
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle')
  const [backupError,  setBackupError]  = useState<string | null>(null)
  const [lastBackup,   setLastBackup]   = useState<string | null>(null)

  // ── Remote settings ────────────────────────────────────────────────────────
  const [settings,        setSettings]        = useState<Settings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // ── Cron ───────────────────────────────────────────────────────────────────
  const [cronUrl,      setCronUrl]      = useState<string | null>(null)
  const [copiedCron,   setCopiedCron]   = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // ── Sheets ─────────────────────────────────────────────────────────────────
  const [spreadsheetId,      setSpreadsheetId]      = useState('')
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [sheetsEnabled,      setSheetsEnabled]      = useState(false)
  const [savingSheets,       setSavingSheets]       = useState(false)
  const [sheetsStatus,       setSheetsStatus]       = useState<SheetsStatus>('idle')
  const [sheetsError,        setSheetsError]        = useState<string | null>(null)
  const [sheetsTitle,        setSheetsTitle]        = useState<string | null>(null)
  const [manualSheetsStatus, setManualSheetsStatus] = useState<ManualSheets>('idle')
  const [manualSheetsError,  setManualSheetsError]  = useState<string | null>(null)
  const [manualSheetsResult, setManualSheetsResult] = useState<Record<string, string> | null>(null)

  // ── Load settings on mount ─────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const res  = await fetch('/api/admin/settings')
      const data = await res.json() as Settings
      setSettings(data)
      setCronUrl(data.cron_url)
      setSpreadsheetId(data.sheets_spreadsheet_id ?? '')
      setSheetsEnabled(data.sheets_enabled ?? false)
    } catch (_) {}
    setLoadingSettings(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleManualBackup() {
    setBackupStatus('loading')
    setBackupError(null)
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
      const blob        = await res.blob()
      const url         = URL.createObjectURL(blob)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filename    = disposition.match(/filename="(.+?)"/)?.[1] ?? `ony_backup_${Date.now()}.sql`
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      setLastBackup(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))
      setBackupStatus('success')
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Backup gagal')
      setBackupStatus('error')
    }
  }

  async function handleRegenerateToken() {
    if (!confirm('Regenerate token? URL lama akan tidak aktif.')) return
    setRegenerating(true)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_token' }),
      })
      const data = await res.json()
      if (data.cron_url) setCronUrl(data.cron_url)
    } catch (_) {}
    setRegenerating(false)
  }

  async function handleCopyUrl() {
    if (!cronUrl) return
    await navigator.clipboard.writeText(cronUrl)
    setCopiedCron(true)
    setTimeout(() => setCopiedCron(false), 2000)
  }

  async function handleManualSheetsBackup() {
    setManualSheetsStatus('loading')
    setManualSheetsError(null)
    setManualSheetsResult(null)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_to_sheets' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setManualSheetsResult(data.results ?? {})
      setManualSheetsStatus('success')
    } catch (err) {
      setManualSheetsError(err instanceof Error ? err.message : 'Backup gagal')
      setManualSheetsStatus('error')
    }
  }

  async function handleSaveSheets() {
    setSavingSheets(true)
    setSheetsError(null)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_sheets',
          spreadsheet_id:      spreadsheetId,
          service_account_json: serviceAccountJson,
          enabled: sheetsEnabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await loadSettings()
    } catch (err) {
      setSheetsError(err instanceof Error ? err.message : 'Gagal menyimpan')
    }
    setSavingSheets(false)
  }

  async function handleTestSheets() {
    setSheetsStatus('testing')
    setSheetsError(null)
    setSheetsTitle(null)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_sheets' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSheetsTitle(data.title)
      setSheetsStatus('ok')
    } catch (err) {
      setSheetsError(err instanceof Error ? err.message : 'Koneksi gagal')
      setSheetsStatus('error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Konfigurasi sistem dan utilitas admin platform Ony.</p>
      </div>

      {/* ── 1. Manual Backup ──────────────────────────────────────────────── */}
      <Section
        icon={<Database size={18} />}
        title="Backup Database"
        desc="Export seluruh data platform sebagai file SQL PostgreSQL"
        iconBg="bg-blue-50 text-blue-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoCard icon={<ShieldCheck size={14} className="text-emerald-600" />} label="Tabel" value="users, cards, links, tap_logs, orders, audit_logs" bg="bg-emerald-50" border="border-emerald-100" />
          <InfoCard icon={<Clock size={14} className="text-amber-600" />} label="Backup Terakhir" value={lastBackup ?? '—'} bg="bg-amber-50" border="border-amber-100" />
          <InfoCard icon={<Info size={14} className="text-slate-500" />} label="Catatan" value="Max 50.000 baris / tabel. Simpan file dengan aman." bg="bg-slate-50" border="border-slate-200" />
        </div>

        {backupStatus === 'success' && <Banner type="success">Backup berhasil diunduh! File SQL tersimpan di Downloads.</Banner>}
        {backupStatus === 'error'   && <Banner type="error">{backupError}</Banner>}

        <Banner type="warning">
          <strong>Perhatian:</strong> File backup berisi <em>seluruh data pengguna</em>. Jangan bagikan ke pihak yang tidak berwenang. Setiap unduhan tercatat di Audit Log.
        </Banner>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            id="btn-backup-database"
            onClick={handleManualBackup}
            disabled={backupStatus === 'loading'}
            className="btn-primary w-full sm:w-auto"
          >
            {backupStatus === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {backupStatus === 'loading' ? 'Memproses...' : 'Download SQL Backup'}
          </button>
          <span className="text-slate-400 text-xs text-center sm:text-left">Format: PostgreSQL INSERT statements (.sql)</span>
        </div>
      </Section>

      {/* ── 2. Scheduled Backup (Cron) ─────────────────────────────────────── */}
      <Section
        icon={<CalendarClock size={18} />}
        title="Jadwal Otomatis (cronjob.com)"
        desc="Panggil endpoint ini secara berkala via cronjob.com untuk backup terjadwal"
        iconBg="bg-violet-50 text-violet-600"
      >
        {loadingSettings ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
            <Loader2 size={14} className="animate-spin" /> Memuat konfigurasi...
          </div>
        ) : (
          <>
            {/* Cron URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Cron Endpoint URL</label>
              {cronUrl ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono">
                    {cronUrl}
                  </code>
                  <button
                    id="btn-copy-cron-url"
                    onClick={handleCopyUrl}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {copiedCron ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedCron ? 'Tersalin' : 'Copy'}
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-xs">Belum ada token — klik &quot;Generate Token&quot; di bawah.</p>
              )}
            </div>

            {/* Regenerate */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                id="btn-regenerate-cron-token"
                onClick={handleRegenerateToken}
                disabled={regenerating}
                className="btn-secondary w-full sm:w-auto"
              >
                {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {cronUrl ? 'Regenerate Token' : 'Generate Token'}
              </button>
              {cronUrl && (
                <span className="text-amber-600 text-xs text-center sm:text-left flex items-center gap-1">
                  <AlertTriangle size={12} /> Regenerate akan menonaktifkan URL lama
                </span>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                <Info size={13} /> Cara setup di cronjob.com
              </p>
              <ol className="text-xs text-violet-700 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Buka <a href="https://cronjob.com" target="_blank" rel="noreferrer" className="underline font-semibold">cronjob.com</a> → Buat job baru</li>
                <li>Method: <strong>GET</strong> → URL: paste URL di atas</li>
                <li>Pilih interval: <strong>Daily</strong> (atau sesuai kebutuhan)</li>
                <li>Simpan dan aktifkan job</li>
              </ol>
              <a
                href="https://cronjob.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 underline mt-1"
              >
                Buka cronjob.com <ExternalLink size={11} />
              </a>
            </div>
          </>
        )}
      </Section>

      {/* ── 3. Google Sheets ──────────────────────────────────────────────────── */}
      <Section
        icon={<TableProperties size={18} />}
        title="Google Sheets (opsional)"
        desc="Setiap kali cron berjalan, data akan ditulis ke spreadsheet — tiap tabel = 1 tab"
        iconBg="bg-emerald-50 text-emerald-600"
      >
        {loadingSettings ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
            <Loader2 size={14} className="animate-spin" /> Memuat konfigurasi...
          </div>
        ) : (
          <>
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {settings?.has_service_account && settings?.sheets_spreadsheet_id ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <PlugZap size={12} /> Terkonfigurasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  Belum dikonfigurasi
                </span>
              )}
              {sheetsEnabled && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  Aktif
                </span>
              )}
            </div>

            {/* Enable toggle */}
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative">
                <input
                  id="toggle-sheets-enabled"
                  type="checkbox"
                  className="sr-only"
                  checked={sheetsEnabled}
                  onChange={(e) => setSheetsEnabled(e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${sheetsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sheetsEnabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {sheetsEnabled ? 'Upload ke Sheets diaktifkan' : 'Upload ke Sheets dinonaktifkan'}
              </span>
            </label>

            {/* Spreadsheet ID */}
            <div className="space-y-1.5">
              <label htmlFor="input-spreadsheet-id" className="text-xs font-semibold text-slate-600">
                Spreadsheet ID / URL
              </label>
              <input
                id="input-spreadsheet-id"
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400">Paste URL atau ID spreadsheet. ID akan diekstrak otomatis dari URL.</p>
            </div>

            {/* Service Account JSON */}
            <div className="space-y-1.5">
              <label htmlFor="input-service-account" className="text-xs font-semibold text-slate-600">
                Google Service Account JSON
                {settings?.has_service_account && (
                  <span className="ml-2 text-emerald-600 font-normal">✓ Sudah tersimpan</span>
                )}
              </label>
              <textarea
                id="input-service-account"
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
                rows={6}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-y"
              />
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-y-1">
                <p className="text-[11px] font-bold text-slate-600">Cara mendapatkan Service Account JSON:</p>
                <ol className="text-[11px] text-slate-500 space-y-0.5 list-decimal list-inside leading-relaxed">
                  <li>Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> → IAM &amp; Admin → Service Accounts</li>
                  <li>Buat service account baru → Download JSON key</li>
                  <li>Enable <strong>Google Sheets API</strong> di project</li>
                  <li>Share spreadsheet ke email service account (Editor access)</li>
                </ol>
              </div>
            </div>

            {/* Error/Success banners */}
            {sheetsError && <Banner type="error">{sheetsError}</Banner>}
            {sheetsStatus === 'ok' && (
              <Banner type="success">
                Terhubung ke: <strong>{sheetsTitle}</strong>
              </Banner>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-save-sheets"
                onClick={handleSaveSheets}
                disabled={savingSheets}
                className="btn-primary w-full sm:w-auto"
              >
                {savingSheets ? <Loader2 size={14} className="animate-spin" /> : null}
                {savingSheets ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
              <button
                id="btn-test-sheets"
                onClick={handleTestSheets}
                disabled={sheetsStatus === 'testing' || !settings?.has_service_account}
                className="btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sheetsStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
                {sheetsStatus === 'testing' ? 'Menguji...' : 'Test Koneksi'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Manual backup to sheets */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-700">Backup Manual ke Sheets</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Jalankan backup sekarang tanpa menunggu jadwal cron.</p>
              </div>

              {manualSheetsStatus === 'error' && (
                <Banner type="error">{manualSheetsError}</Banner>
              )}

              {manualSheetsStatus === 'success' && manualSheetsResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Backup selesai — data berhasil ditulis ke Sheets
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.entries(manualSheetsResult)
                      .filter(([k]) => !k.startsWith('_'))
                      .map(([table, stat]) => (
                        <div key={table} className="flex items-center justify-between bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{table}</span>
                          <span className="text-[10px] text-emerald-600 font-bold ml-1 shrink-0">{stat}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                id="btn-manual-backup-sheets"
                onClick={handleManualSheetsBackup}
                disabled={manualSheetsStatus === 'loading' || !settings?.has_service_account || !settings?.sheets_spreadsheet_id}
                className="btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {manualSheetsStatus === 'loading'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <TableProperties size={14} />}
                {manualSheetsStatus === 'loading' ? 'Memproses...' : 'Backup ke Sheets Sekarang'}
              </button>
            </div>
          </>
        )}
      </Section>

      {/* ── 4. Setup Database Baru (Ony v2) ──────────────────────────────── */}
      <Section
        icon={<Server size={18} />}
        title="Setup Database Baru (Ony v2)"
        desc="Panduan membuat database PostgreSQL kosong untuk instance Ony baru"
        iconBg="bg-slate-100 text-slate-600"
      >
        {/* Download button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            id="btn-download-schema"
            href="/api/admin/backup/schema"
            download
            className="btn-secondary w-full sm:w-auto justify-center"
          >
            <FileCode2 size={14} />
            Download Schema SQL (DDL)
          </a>
          <span className="text-slate-400 text-xs text-center sm:text-left">
            CREATE TABLE saja — tanpa data. Aman dibagikan ke developer.
          </span>
        </div>

        <Banner type="warning">
          File ini hanya berisi <strong>struktur tabel</strong> (CREATE TABLE, INDEX, RLS). Tidak ada data pengguna.
        </Banner>

        {/* Steps */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Langkah-langkah Setup Ony v2:</p>
          <div className="space-y-2">
            {([
              { step: 1, title: 'Buat Project Supabase Baru', desc: 'Buka supabase.com → New Project. Pilih region Singapore. Catat URL dan API keys.', href: 'https://supabase.com/dashboard', linkLabel: 'Buka Supabase' },
              { step: 2, title: 'Download Schema SQL', desc: 'Klik tombol "Download Schema SQL" di atas. File .sql berisi CREATE TABLE, index, trigger, dan RLS untuk semua tabel.' },
              { step: 3, title: 'Jalankan di SQL Editor', desc: 'Supabase project baru → SQL Editor → New Query → Paste isi file → Klik Run.', href: 'https://supabase.com/dashboard', linkLabel: 'Buka SQL Editor' },
              { step: 4, title: 'Update Environment Variables', desc: 'Copy .env.local dari project lama. Ganti NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY dengan nilai dari Supabase project baru.' },
              { step: 5, title: 'Update NEXTAUTH_URL & ADMIN_EMAIL', desc: 'NEXTAUTH_URL → domain Ony v2. ADMIN_EMAIL → email admin utama.' },
              { step: 6, title: 'Deploy & Verifikasi', desc: 'Deploy ke Vercel. Buka /admin → pastikan semua menu berjalan. Lakukan Backup Manual untuk verifikasi koneksi database.' },
            ] as { step: number; title: string; desc: string; href?: string; linkLabel?: string }[]).map(({ step, title, desc, href, linkLabel }) => (
              <div key={step} className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-ony-blue text-white text-[11px] font-extrabold flex items-center justify-center mt-0.5">
                  {step}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">{title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-ony-blue font-semibold mt-0.5 hover:underline">
                      {linkLabel} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tables list */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2">
          <p className="text-[11px] font-bold text-slate-600">Tabel yang dibuat oleh schema SQL:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {['users', 'cards', 'links', 'tap_logs', 'orders', 'admin_audit_logs', 'admin_settings'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                <code className="font-mono">{t}</code>
              </div>
            ))}
          </div>
        </div>
      </Section>

    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  icon, title, desc, iconBg, children,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  iconBg: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/60`}>
        <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
          <p className="text-slate-500 text-xs leading-snug">{desc}</p>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">{children}</div>
    </section>
  )
}

// ─── Info card ────────────────────────────────────────────────────────────────
function InfoCard({ icon, label, value, bg, border }: {
  icon: React.ReactNode; label: string; value: string; bg: string; border: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${bg} ${border}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">{icon}{label}</div>
      <p className="text-[11px] text-slate-700 leading-relaxed">{value}</p>
    </div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function Banner({ type, children }: { type: 'success' | 'error' | 'warning'; children: React.ReactNode }) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }
  const icons = {
    success: <CheckCircle2 size={14} className="shrink-0" />,
    error:   <AlertTriangle size={14} className="shrink-0" />,
    warning: <AlertTriangle size={14} className="shrink-0 text-amber-500" />,
  }
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-xs leading-relaxed ${styles[type]}`}>
      {icons[type]}
      <span>{children}</span>
    </div>
  )
}
