import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatNumber(num: number) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(amount)
}

export function generateActivationCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  nfc_qr:      'NFC + QR Smart Media',
  nfc_card:    'NFC + QR Smart Media',
  nfc_sticker: 'NFC + QR Smart Media',
  qr_standee:  'NFC + QR Smart Media',
  qr_keychain: 'NFC + QR Smart Media',
  digital_qr:  'NFC + QR Smart Media',
}

export const STATUS_COLORS: Record<string, string> = {
  active:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  unclaimed: 'text-amber-700 bg-amber-50 border-amber-200',
  suspended: 'text-rose-700 bg-rose-50 border-rose-200',
  lost:      'text-slate-600 bg-slate-100 border-slate-200',
}

export const LINK_ICONS: Record<string, string> = {
  whatsapp:  '💬',
  instagram: '📸',
  linkedin:  '💼',
  twitter:   '🐦',
  tiktok:    '🎵',
  youtube:   '▶️',
  website:   '🌐',
  email:     '📧',
  phone:     '📞',
  maps:      '📍',
  other:     '🔗',
}
