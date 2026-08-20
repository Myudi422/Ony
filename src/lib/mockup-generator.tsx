import { createRoot } from 'react-dom/client'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import jsPDF from 'jspdf'

export interface MockupConfig {
  qrX: number // default 174
  qrY: number // default 444
  qrSize: number // default 280
}

export const DEFAULT_CONFIG: MockupConfig = {
  qrX: 174,
  qrY: 444,
  qrSize: 280,
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
 * Generates Front Card Canvas (Depan - Putih + QR + Unique Code ID Badge)
 * 3.4" x 2.1" (630px x 1020px @ 300 DPI vertical)
 */
export async function generateCardMockupCanvas(
  code: string,
  config: Partial<MockupConfig> = {}
): Promise<HTMLCanvasElement> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // 1. Generate QR Code Image
  const qrImg = await generateQrImageElement(code, 600)

  // 2. Load mockup background (Depan Putih)
  const bgImg = new Image()
  bgImg.crossOrigin = 'anonymous'
  await new Promise((resolve, reject) => {
    bgImg.onload = resolve
    bgImg.onerror = reject
    bgImg.src = '/mockup-kartu.png'
  })

  // 3. Create canvas (630x1020 standard card resolution)
  const canvas = document.createElement('canvas')
  canvas.width = bgImg.naturalWidth || 630
  canvas.height = bgImg.naturalHeight || 1020
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context tidak tersedia')

  // 4. Draw Mockup background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

  // 5. Draw QR code inside corner brackets
  ctx.drawImage(qrImg, mergedConfig.qrX, mergedConfig.qrY, mergedConfig.qrSize, mergedConfig.qrSize)

  // 6. Draw central activation code badge inside the QR code
  const centerX = mergedConfig.qrX + mergedConfig.qrSize / 2
  const centerY = mergedConfig.qrY + mergedConfig.qrSize / 2

  ctx.save()
  ctx.font = 'bold 15px monospace'
  const textWidth = ctx.measureText(code).width
  const badgeWidth = Math.max(textWidth + 20, 80)
  const badgeHeight = 26
  const badgeX = centerX - badgeWidth / 2
  const badgeY = centerY - badgeHeight / 2
  const radius = 6

  // Draw rounded white background pill
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

  // Draw code text centered inside badge
  ctx.fillStyle = '#0F172A'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(code, centerX, centerY + 1)
  ctx.restore()

  return canvas
}

/**
 * Generates Back Card Canvas (Belakang - Hitam + Solid White QR Base Box + Unique Code ID)
 * 3.4" x 2.1" (630px x 1020px @ 300 DPI vertical)
 */
export async function generateCardBackCanvas(
  code?: string,
  config: Partial<MockupConfig> = {}
): Promise<HTMLCanvasElement> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // 1. Load mockup background (Belakang Hitam)
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

  // 2. Draw Mockup background (Hitam)
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

  // 3. If code is provided, render white QR box + QR + Center ID
  if (code) {
    const qrImg = await generateQrImageElement(code, 600)

    // Solid white rounded card base inside brackets
    const padding = 6
    const bgX = mergedConfig.qrX - padding
    const bgY = mergedConfig.qrY - padding
    const bgSize = mergedConfig.qrSize + (padding * 2)
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

    // Draw QR code inside corner brackets on top of white base
    ctx.drawImage(qrImg, mergedConfig.qrX, mergedConfig.qrY, mergedConfig.qrSize, mergedConfig.qrSize)

    // Central activation code badge
    const centerX = mergedConfig.qrX + mergedConfig.qrSize / 2
    const centerY = mergedConfig.qrY + mergedConfig.qrSize / 2

    ctx.save()
    ctx.font = 'bold 15px monospace'
    const textWidth = ctx.measureText(code).width
    const badgeWidth = Math.max(textWidth + 20, 80)
    const badgeHeight = 26
    const badgeX = centerX - badgeWidth / 2
    const badgeY = centerY - badgeHeight / 2
    const badgeRadius = 6

    ctx.beginPath()
    ctx.moveTo(badgeX + badgeRadius, badgeY)
    ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeHeight, badgeRadius)
    ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX, badgeY + badgeHeight, badgeRadius)
    ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY, badgeRadius)
    ctx.arcTo(badgeX, badgeY, badgeX + badgeWidth, badgeY, badgeRadius)
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
  }

  return canvas
}

/**
 * Generates single card front PNG download
 */
export async function downloadSingleCardMockup(code: string, config?: Partial<MockupConfig>): Promise<void> {
  const canvas = await generateCardMockupCanvas(code, config)
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `ony-mockup-${code}-DEPAN.png`
  a.click()
}

/**
 * Generates a Multi-Page Duplex PDF:
 * Page 1: Kartu 1 Depan (Putih + QR)
 * Page 2: Kartu 1 Belakang (Hitam + White QR Box)
 * Page 3: Kartu 2 Depan (Putih + QR)
 * Page 4: Kartu 2 Belakang (Hitam + White QR Box)
 * ... dst
 */
export async function generateCardMockupPDFBlob(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [2.1, 3.4],
  })

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (onProgress) onProgress(i + 1, cards.length)

    const frontCanvas = await generateCardMockupCanvas(card.activation_code, config)
    const frontDataUrl = frontCanvas.toDataURL('image/png')

    const backCanvas = await generateCardBackCanvas(card.activation_code, config)
    const backDataUrl = backCanvas.toDataURL('image/png')

    if (i > 0) {
      pdf.addPage([2.1, 3.4], 'portrait')
    }
    // Page Depan (Putih)
    pdf.addImage(frontDataUrl, 'PNG', 0, 0, 2.1, 3.4)

    // Page Belakang (Hitam)
    pdf.addPage([2.1, 3.4], 'portrait')
    pdf.addImage(backDataUrl, 'PNG', 0, 0, 2.1, 3.4)
  }

  return pdf.output('blob')
}

/**
 * Download PDF Print-Ready (Duplex Order: Putih 1, Hitam 1, Putih 2, Hitam 2...)
 */
export async function downloadCardMockupPDF(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (!cards.length) return
  const pdfBlob = await generateCardMockupPDFBlob(cards, config, onProgress)
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = cards.length === 1 
    ? `ony-card-${cards[0].activation_code}-print-depan-belakang.pdf`
    : `ony-cards-print-duplex-batch-${cards.length}-items.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads ZIP containing paired PNG images (Depan & Belakang) + Combined Duplex PDF file
 */
export async function downloadCardMockupsZIP(
  cards: { activation_code: string }[],
  config?: Partial<MockupConfig>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (!cards.length) return
  const zip = new JSZip()

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (onProgress) onProgress(i + 1, cards.length)

    const prefixNum = String(i + 1).padStart(2, '0')

    try {
      // 1. Depan (Putih + QR + Code ID)
      const frontCanvas = await generateCardMockupCanvas(card.activation_code, config)
      const frontBlob = await new Promise<Blob | null>((resolve) => frontCanvas.toBlob(resolve, 'image/png'))
      if (frontBlob) {
        zip.file(`${prefixNum}_ony_card_${card.activation_code}_DEPAN.png`, frontBlob)
      }

      // 2. Belakang (Hitam + White QR Base + Code ID)
      const backCanvas = await generateCardBackCanvas(card.activation_code, config)
      const backBlob = await new Promise<Blob | null>((resolve) => backCanvas.toBlob(resolve, 'image/png'))
      if (backBlob) {
        zip.file(`${prefixNum}_ony_card_${card.activation_code}_BELAKANG.png`, backBlob)
      }
    } catch (err) {
      console.error(`Gagal render mockup untuk ${card.activation_code}:`, err)
    }
  }

  // Include ready-to-print duplex PDF inside ZIP
  try {
    const pdfBlob = await generateCardMockupPDFBlob(cards, config)
    zip.file(`00_PRINT_DUPLEX_SEMUA_KARTU_${cards.length}_ITEMS.pdf`, pdfBlob)
  } catch (err) {
    console.error('Gagal menyertakan PDF ke ZIP:', err)
  }

  const zipContent = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipContent)
  const a = document.createElement('a')
  a.href = url
  a.download = `ony-cards-mockup-batch-${cards.length}-items.zip`
  a.click()
  URL.revokeObjectURL(url)
}
