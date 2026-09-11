import { createRoot } from 'react-dom/client'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import jsPDF from 'jspdf'

export interface MockupConfig {
  qrX: number // default dependent on preset
  qrY: number
  qrSize: number
}

export interface MockupSide {
  id: 'front' | 'back' | 'main'
  label: string
  bgImage: string
  drawWhiteBase?: boolean
}

export interface MockupPreset {
  id: string
  name: string
  description: string
  type: 'duplex' | 'single'
  sides: MockupSide[]
  defaultQrX: number
  defaultQrY: number
  defaultQrSize: number
  minQrX: number
  maxQrX: number
  minQrY: number
  maxQrY: number
  minQrSize: number
  maxQrSize: number
  pdfWidthInches: number
  pdfHeightInches: number
}

export const MOCKUP_PRESETS: MockupPreset[] = [
  {
    id: 'ktp-2side',
    name: 'KTP 2 Sisi (Depan & Belakang)',
    description: 'Format kartu CR80 3,4" x 2,1" (Depan Putih & Belakang Hitam)',
    type: 'duplex',
    sides: [
      { id: 'front', label: 'Depan (Putih)', bgImage: '/mockup-kartu.png', drawWhiteBase: false },
      { id: 'back', label: 'Belakang (Hitam)', bgImage: '/desain-belakang.png', drawWhiteBase: true },
    ],
    defaultQrX: 174,
    defaultQrY: 444,
    defaultQrSize: 280,
    minQrX: 50,
    maxQrX: 400,
    minQrY: 100,
    maxQrY: 800,
    minQrSize: 100,
    maxQrSize: 500,
    pdfWidthInches: 2.1,
    pdfHeightInches: 3.4,
  },
  {
    id: 'ktp-1side',
    name: 'KTP 1 Sisi (Belakang Hitam)',
    description: 'Format kartu CR80 3,4" x 2,1" (Satu sisi - Hitam)',
    type: 'single',
    sides: [
      { id: 'main', label: 'Utama (Hitam)', bgImage: '/desain-belakang.png', drawWhiteBase: true },
    ],
    defaultQrX: 174,
    defaultQrY: 444,
    defaultQrSize: 280,
    minQrX: 50,
    maxQrX: 400,
    minQrY: 100,
    maxQrY: 800,
    minQrSize: 100,
    maxQrSize: 500,
    pdfWidthInches: 2.1,
    pdfHeightInches: 3.4,
  },
  {
    id: 'square-10x10',
    name: 'Square 10x10 cm',
    description: 'Format stiker/standee persegi 10 cm x 10 cm (3,937" x 3,937")',
    type: 'single',
    sides: [
      { id: 'main', label: 'Utama (10x10 cm)', bgImage: '/mockup 10x10.png', drawWhiteBase: false },
    ],
    defaultQrX: 268,
    defaultQrY: 711,
    defaultQrSize: 272,
    minQrX: 50,
    maxQrX: 800,
    minQrY: 50,
    maxQrY: 800,
    minQrSize: 100,
    maxQrSize: 800,
    pdfWidthInches: 3.937,
    pdfHeightInches: 3.937,
  },
]

export const DEFAULT_CONFIG: MockupConfig = {
  qrX: 174,
  qrY: 444,
  qrSize: 280,
}

const LOCAL_STORAGE_KEY_PREFIX = 'ony_mockup_layout_'

export function getSavedPresetLayout(presetId: string): Partial<MockupConfig> | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${presetId}`)
    if (saved) return JSON.parse(saved)
  } catch (_) {}
  return null
}

export function saveSavedPresetLayout(presetId: string, config: MockupConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${presetId}`, JSON.stringify(config))
  } catch (_) {}
}

export function clearSavedPresetLayout(presetId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${presetId}`)
  } catch (_) {}
}

export function getEffectivePresetConfig(presetId: string, customConfig?: Partial<MockupConfig>): MockupConfig {
  const preset = getMockupPreset(presetId)
  const saved = getSavedPresetLayout(presetId)
  return {
    qrX: customConfig?.qrX ?? saved?.qrX ?? preset.defaultQrX,
    qrY: customConfig?.qrY ?? saved?.qrY ?? preset.defaultQrY,
    qrSize: customConfig?.qrSize ?? saved?.qrSize ?? preset.defaultQrSize,
  }
}

export function getMockupPreset(id?: string): MockupPreset {
  return MOCKUP_PRESETS.find((p) => p.id === id) || MOCKUP_PRESETS[0]
}

/**
 * Generates high quality QR SVG and converts it to HTMLImageElement
 */
export async function generateQrImageElement(code: string, size = 600): Promise<HTMLImageElement> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ony.my.id'
  const targetUrl = `${baseUrl}/c/${code}`

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = `${size}px`
  container.style.height = `${size}px`
  document.body.appendChild(container)

  const root = createRoot(container)
  await new Promise<void>((resolve) => {
    root.render(
      <QRCodeSVG
        value={targetUrl}
        size={size}
        level="H"
        includeMargin={false}
        fgColor="#0F172A"
        bgColor="#FFFFFF"
      />
    )
    setTimeout(resolve, 50)
  })

  const svg = container.querySelector('svg')
  if (!svg) {
    root.unmount()
    container.remove()
    throw new Error('Gagal generate QR SVG')
  }

  const svgData = new XMLSerializer().serializeToString(svg)
  root.unmount()
  container.remove()

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })

  return img
}

/**
 * Generates canvas for a single background image + QR + badge overlay
 */
export async function generateSingleMockupCanvas(
  code: string,
  bgImagePath: string,
  config: MockupConfig,
  options?: { drawWhiteBase?: boolean }
): Promise<HTMLCanvasElement> {
  const qrImg = await generateQrImageElement(code, 600)

  const bgImg = new Image()
  bgImg.crossOrigin = 'anonymous'
  await new Promise((resolve, reject) => {
    bgImg.onload = resolve
    bgImg.onerror = reject
    bgImg.src = bgImagePath
  })

  const canvas = document.createElement('canvas')
  canvas.width = bgImg.naturalWidth || 630
  canvas.height = bgImg.naturalHeight || 1020
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context tidak tersedia')

  // Draw background image
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

  // Draw solid white rounded box behind QR if specified (e.g. for dark backgrounds)
  if (options?.drawWhiteBase) {
    const padding = 6
    const bgX = config.qrX - padding
    const bgY = config.qrY - padding
    const bgSize = config.qrSize + padding * 2
    const radius = 12

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(bgX + radius, bgY)
    ctx.arcTo(bgX + bgSize, bgY, bgX + bgSize, bgY + bgSize, radius)
    ctx.arcTo(bgX + bgSize, bgY + bgSize, bgX, bgY + bgSize, radius)
    ctx.arcTo(bgX, bgY + bgSize, bgX, bgY, radius)
    ctx.arcTo(bgX, bgY, bgX + bgSize, bgY, radius)
    ctx.closePath()

    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.restore()
  }

  // Draw QR code
  ctx.drawImage(qrImg, config.qrX, config.qrY, config.qrSize, config.qrSize)

  // Draw activation code pill badge in center of QR
  const centerX = config.qrX + config.qrSize / 2
  const centerY = config.qrY + config.qrSize / 2

  ctx.save()
  const fontSize = Math.max(12, Math.round(config.qrSize / 18))
  ctx.font = `bold ${fontSize}px monospace`
  const textWidth = ctx.measureText(code).width
  const badgeWidth = Math.max(textWidth + 20, 80)
  const badgeHeight = Math.max(24, Math.round(fontSize * 1.6))
  const badgeX = centerX - badgeWidth / 2
  const badgeY = centerY - badgeHeight / 2
  const radius = 6

  ctx.beginPath()
  ctx.moveTo(badgeX + radius, badgeY)
  ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeHeight, radius)
  ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX, badgeY + badgeHeight, radius)
  ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY, radius)
  ctx.arcTo(badgeX, badgeY, badgeX + badgeWidth, badgeY, radius)
  ctx.closePath()

  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#0F172A'
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(code, centerX, centerY + 1)
  ctx.restore()

  return canvas
}

/**
 * Renders mockup canvas based on preset ID and side ID
 */
export async function generateMockupForPreset(
  code: string,
  presetId: string = 'ktp-2side',
  sideId?: string,
  config: Partial<MockupConfig> = {}
): Promise<HTMLCanvasElement> {
  const preset = getMockupPreset(presetId)
  const targetSide = preset.sides.find((s) => s.id === sideId) || preset.sides[0]
  const mergedConfig = getEffectivePresetConfig(presetId, config)
  return generateSingleMockupCanvas(code, targetSide.bgImage, mergedConfig, {
    drawWhiteBase: targetSide.drawWhiteBase,
  })
}

/**
 * Backward-compatible helper for Front Card Canvas (KTP Depan Putih)
 */
export async function generateCardMockupCanvas(
  code: string,
  config: Partial<MockupConfig> = {}
): Promise<HTMLCanvasElement> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  return generateSingleMockupCanvas(code, '/mockup-kartu.png', mergedConfig, { drawWhiteBase: false })
}

/**
 * Backward-compatible helper for Back Card Canvas (KTP Belakang Hitam)
 */
export async function generateCardBackCanvas(
  code?: string,
  config: Partial<MockupConfig> = {}
): Promise<HTMLCanvasElement> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  if (!code) {
    const bgImg = new Image()
    bgImg.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      bgImg.onload = resolve
      bgImg.onerror = reject
      bgImg.src = '/desain-belakang.png'
    })
    const canvas = document.createElement('canvas')
    canvas.width = bgImg.naturalWidth || 630
    canvas.height = bgImg.naturalHeight || 1020
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context tidak tersedia')
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
    return canvas
  }
  return generateSingleMockupCanvas(code, '/desain-belakang.png', mergedConfig, { drawWhiteBase: true })
}

/**
 * Generates single card PNG download for specified preset & side
 */
export async function downloadSingleCardMockup(
  code: string,
  config?: Partial<MockupConfig>,
  presetId: string = 'ktp-2side',
  sideId?: string
): Promise<void> {
  const preset = getMockupPreset(presetId)
  const targetSideId = sideId || preset.sides[0].id
  const canvas = await generateMockupForPreset(code, presetId, targetSideId, config)
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `ony-mockup-${code}-${preset.id}-${targetSideId.toUpperCase()}.png`
  a.click()
}

/**
 * Generates PDF Blob according to selected preset (Duplex or Single)
 */
export async function generateCardMockupPDFBlob(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void,
  presetId: string = 'ktp-2side'
): Promise<Blob> {
  const preset = getMockupPreset(presetId)
  let pdf: jsPDF | null = null

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (onProgress) onProgress(i + 1, cards.length)

    for (let sIndex = 0; sIndex < preset.sides.length; sIndex++) {
      const side = preset.sides[sIndex]
      const canvas = await generateMockupForPreset(card.activation_code, presetId, side.id, config)
      const dataUrl = canvas.toDataURL('image/png')

      // Calculate exact aspect ratio to match the image dimensions without deformation
      const ratio = canvas.height / canvas.width
      const pageWidth = preset.pdfWidthInches
      const pageHeight = Number((preset.pdfWidthInches * ratio).toFixed(4))
      const isPortrait = pageHeight >= pageWidth

      if (!pdf) {
        pdf = new jsPDF({
          orientation: isPortrait ? 'portrait' : 'landscape',
          unit: 'in',
          format: [pageWidth, pageHeight],
        })
      } else {
        pdf.addPage([pageWidth, pageHeight], isPortrait ? 'portrait' : 'landscape')
      }
      pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight)
    }
  }

  if (!pdf) {
    pdf = new jsPDF({
      orientation: preset.pdfHeightInches >= preset.pdfWidthInches ? 'portrait' : 'landscape',
      unit: 'in',
      format: [preset.pdfWidthInches, preset.pdfHeightInches],
    })
  }

  return pdf.output('blob')
}

/**
 * Download PDF Print-Ready according to selected preset
 */
export async function downloadCardMockupPDF(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void,
  presetId: string = 'ktp-2side'
): Promise<void> {
  if (!cards.length) return
  const preset = getMockupPreset(presetId)
  const pdfBlob = await generateCardMockupPDFBlob(cards, config, onProgress, presetId)
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    cards.length === 1
      ? `ony-card-${cards[0].activation_code}-${preset.id}.pdf`
      : `ony-cards-print-${preset.id}-batch-${cards.length}-items.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads ZIP containing PNG images + Combined PDF file for selected preset
 */
export async function downloadCardMockupsZIP(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void,
  presetId: string = 'ktp-2side'
): Promise<void> {
  if (!cards.length) return
  const zip = new JSZip()
  const preset = getMockupPreset(presetId)

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (onProgress) onProgress(i + 1, cards.length)

    const prefixNum = String(i + 1).padStart(2, '0')

    for (const side of preset.sides) {
      try {
        const canvas = await generateMockupForPreset(card.activation_code, presetId, side.id, config)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (blob) {
          const sideSuffix = side.id.toUpperCase()
          zip.file(`${prefixNum}_ony_card_${card.activation_code}_${sideSuffix}.png`, blob)
        }
      } catch (err) {
        console.error(`Gagal render mockup ${side.id} untuk ${card.activation_code}:`, err)
      }
    }
  }

  // Include ready-to-print PDF inside ZIP
  try {
    const pdfBlob = await generateCardMockupPDFBlob(cards, config, undefined, presetId)
    zip.file(`00_PRINT_${preset.id.toUpperCase()}_SEMUA_KARTU_${cards.length}_ITEMS.pdf`, pdfBlob)
  } catch (err) {
    console.error('Gagal menyertakan PDF ke ZIP:', err)
  }

  const zipContent = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipContent)
  const a = document.createElement('a')
  a.href = url
  a.download = `ony-cards-mockup-${preset.id}-batch-${cards.length}-items.zip`
  a.click()
  URL.revokeObjectURL(url)
}
