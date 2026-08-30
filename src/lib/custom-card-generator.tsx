import { createRoot } from 'react-dom/client'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import jsPDF from 'jspdf'

export interface CustomCardConfig {
  // Mode Selection: 'custom' (single custom link for all cards) or 'ony' (auto batch Ony activation codes)
  urlMode: 'custom' | 'ony'
  onyPrefix: string            // Prefix for auto-generated Ony codes (e.g. "ONY-")

  // Target URL & Identifier Badge
  targetUrl: string
  badgeText: string
  centerLogoUrl: string | null // Data URL for logo inside QR center
  centerLogoSize: number       // Logo size percentage relative to QR size (15% to 34%)

  // Template Images Uploaded by Admin / Client
  frontBgImage: string | null // Data URL of uploaded front design image
  backBgImage: string | null  // Data URL of uploaded back design image

  // Solid Color Fallbacks if no image uploaded
  frontBgColor: string
  backBgColor: string

  // QR Overlay Toggles & Styling
  showFrontQr: boolean
  showBackQr: boolean
  showBackQrBox: boolean // Draw white background box behind QR on back side

  qrFgColor: string
  qrBgColor: string
  qrSize: number
  qrX: number
  qrY: number
  qrCenterLogo: boolean
}

export const DEFAULT_CUSTOM_CONFIG: CustomCardConfig = {
  urlMode: 'custom',
  onyPrefix: 'ONY-',

  targetUrl: 'https://ony.my.id',
  badgeText: '',
  centerLogoUrl: null,
  centerLogoSize: 28, // Default 28% of QR code width

  frontBgImage: null,
  backBgImage: null,

  frontBgColor: '#FFFFFF',
  backBgColor: '#0F172A',

  showFrontQr: true,
  showBackQr: true,
  showBackQrBox: true,

  qrFgColor: '#0F172A',
  qrBgColor: '#FFFFFF',
  qrSize: 280,
  qrX: 175,
  qrY: 440,
  qrCenterLogo: true,
}

/**
 * Generates QR Code Image as HTMLImageElement
 */
export async function generateCustomQrImage(
  url: string,
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  size = 600
): Promise<HTMLImageElement> {
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
        value={url || 'https://ony.my.id'}
        size={size}
        level="H"
        includeMargin={false}
        fgColor={fgColor}
        bgColor={bgColor}
      />
    )
    setTimeout(resolve, 60)
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth = 1
) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()

  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  if (strokeColor) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeColor
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Render Front Card Canvas
 * Default resolution: 630px x 1020px @ 300 DPI vertical
 */
export async function generateCustomFrontCanvas(
  config: CustomCardConfig,
  overrideCode?: string
): Promise<HTMLCanvasElement> {
  let width = 630
  let height = 1020

  let bgImg: HTMLImageElement | null = null
  if (config.frontBgImage) {
    try {
      bgImg = await loadImage(config.frontBgImage)
      if (bgImg.naturalWidth && bgImg.naturalHeight) {
        width = bgImg.naturalWidth
        height = bgImg.naturalHeight
      }
    } catch (e) {
      console.warn('Gagal memuat gambar template depan:', e)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Determine effective target URL and text badge for this card
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ony.my.id'
  let targetUrl = config.targetUrl
  let badgeText = config.badgeText

  if (config.urlMode === 'ony') {
    const code = overrideCode || `${config.onyPrefix || 'ONY-'}${String(1).padStart(3, '0')}`
    targetUrl = `${baseUrl}/c/${code}`
    badgeText = code
  }

  // 1. Draw Template Image or Background Color
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height)
  } else {
    try {
      const defaultFrontBg = await loadImage('/mockup-kartu.png')
      ctx.drawImage(defaultFrontBg, 0, 0, width, height)
    } catch {
      ctx.fillStyle = config.frontBgColor || '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
    }
  }

  // 2. Draw QR Code Overlay on Front Side
  if (config.showFrontQr) {
    const qrImg = await generateCustomQrImage(
      targetUrl,
      config.qrFgColor,
      config.qrBgColor,
      600
    )

    const scale = width / 630
    const qrX = config.qrX * scale
    const qrY = config.qrY * scale
    const qrSize = config.qrSize * scale

    // Draw QR Code
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Draw Center Badge (Uploaded Center Logo OR Text Badge) inside QR
    if (config.qrCenterLogo) {
      const centerX = qrX + qrSize / 2
      const centerY = qrY + qrSize / 2

      let logoDrawn = false
      if (config.centerLogoUrl) {
        try {
          const centerImg = await loadImage(config.centerLogoUrl)
          const logoRatio = (config.centerLogoSize || 28) / 100
          const badgeSize = qrSize * logoRatio
          const badgeX = centerX - badgeSize / 2
          const badgeY = centerY - badgeSize / 2

          drawRoundedRect(
            ctx,
            badgeX,
            badgeY,
            badgeSize,
            badgeSize,
            Math.max(8 * scale, 4),
            config.qrBgColor,
            config.qrFgColor,
            1.5 * scale
          )

          const pad = Math.max(3 * scale, 2)
          const logoMaxW = badgeSize - pad * 2
          const logoMaxH = badgeSize - pad * 2

          let drawW = logoMaxW
          let drawH = logoMaxH
          if (centerImg.naturalWidth && centerImg.naturalHeight) {
            const aspect = centerImg.naturalWidth / centerImg.naturalHeight
            if (aspect > 1) {
              drawH = logoMaxW / aspect
            } else {
              drawW = logoMaxH * aspect
            }
          }

          const drawX = badgeX + (badgeSize - drawW) / 2
          const drawY = badgeY + (badgeSize - drawH) / 2

          ctx.drawImage(centerImg, drawX, drawY, drawW, drawH)
          logoDrawn = true
        } catch {
          logoDrawn = false
        }
      }

      if (!logoDrawn && badgeText) {
        ctx.save()
        ctx.font = `bold ${Math.max(14 * scale, 12)}px monospace`
        const textW = ctx.measureText(badgeText).width
        const badgeW = Math.max(textW + 20 * scale, 75 * scale)
        const badgeH = 26 * scale
        const badgeX = centerX - badgeW / 2
        const badgeY = centerY - badgeH / 2

        drawRoundedRect(
          ctx,
          badgeX,
          badgeY,
          badgeW,
          badgeH,
          6 * scale,
          config.qrBgColor,
          config.qrFgColor,
          2 * scale
        )

        ctx.fillStyle = config.qrFgColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(badgeText, centerX, centerY + 1 * scale)
        ctx.restore()
      }
    }
  }

  return canvas
}

/**
 * Render Back Card Canvas
 * Default resolution: 630px x 1020px @ 300 DPI vertical
 */
export async function generateCustomBackCanvas(
  config: CustomCardConfig,
  overrideCode?: string
): Promise<HTMLCanvasElement> {
  let width = 630
  let height = 1020

  let bgImg: HTMLImageElement | null = null
  if (config.backBgImage) {
    try {
      bgImg = await loadImage(config.backBgImage)
      if (bgImg.naturalWidth && bgImg.naturalHeight) {
        width = bgImg.naturalWidth
        height = bgImg.naturalHeight
      }
    } catch (e) {
      console.warn('Gagal memuat gambar template belakang:', e)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Determine effective target URL and text badge for this card
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ony.my.id'
  let targetUrl = config.targetUrl
  let badgeText = config.badgeText

  if (config.urlMode === 'ony') {
    const code = overrideCode || `${config.onyPrefix || 'ONY-'}${String(1).padStart(3, '0')}`
    targetUrl = `${baseUrl}/c/${code}`
    badgeText = code
  }

  // 1. Draw Template Image or Background Color
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height)
  } else {
    try {
      const defaultBackBg = await loadImage('/desain-belakang.png')
      ctx.drawImage(defaultBackBg, 0, 0, width, height)
    } catch {
      ctx.fillStyle = config.backBgColor || '#0F172A'
      ctx.fillRect(0, 0, width, height)
    }
  }

  // 2. Draw QR Code Overlay on Back Side
  if (config.showBackQr) {
    const qrImg = await generateCustomQrImage(
      targetUrl,
      config.qrFgColor,
      config.qrBgColor,
      600
    )

    const scale = width / 630
    const qrX = config.qrX * scale
    const qrY = config.qrY * scale
    const qrSize = config.qrSize * scale
    const padding = 8 * scale

    if (config.showBackQrBox) {
      drawRoundedRect(
        ctx,
        qrX - padding,
        qrY - padding,
        qrSize + padding * 2,
        qrSize + padding * 2,
        12 * scale,
        config.qrBgColor,
        '#CBD5E1',
        1 * scale
      )
    }

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Center Badge (Uploaded Center Logo OR Text Badge)
    if (config.qrCenterLogo) {
      const centerX = qrX + qrSize / 2
      const centerY = qrY + qrSize / 2

      let logoDrawn = false
      if (config.centerLogoUrl) {
        try {
          const centerImg = await loadImage(config.centerLogoUrl)
          const logoRatio = (config.centerLogoSize || 28) / 100
          const badgeSize = qrSize * logoRatio
          const badgeX = centerX - badgeSize / 2
          const badgeY = centerY - badgeSize / 2

          drawRoundedRect(
            ctx,
            badgeX,
            badgeY,
            badgeSize,
            badgeSize,
            Math.max(8 * scale, 4),
            config.qrBgColor,
            config.qrFgColor,
            1.5 * scale
          )

          const pad = Math.max(3 * scale, 2)
          const logoMaxW = badgeSize - pad * 2
          const logoMaxH = badgeSize - pad * 2

          let drawW = logoMaxW
          let drawH = logoMaxH
          if (centerImg.naturalWidth && centerImg.naturalHeight) {
            const aspect = centerImg.naturalWidth / centerImg.naturalHeight
            if (aspect > 1) {
              drawH = logoMaxW / aspect
            } else {
              drawW = logoMaxH * aspect
            }
          }

          const drawX = badgeX + (badgeSize - drawW) / 2
          const drawY = badgeY + (badgeSize - drawH) / 2

          ctx.drawImage(centerImg, drawX, drawY, drawW, drawH)
          logoDrawn = true
        } catch {
          logoDrawn = false
        }
      }

      if (!logoDrawn && badgeText) {
        ctx.save()
        ctx.font = `bold ${Math.max(14 * scale, 12)}px monospace`
        const textW = ctx.measureText(badgeText).width
        const badgeW = Math.max(textW + 20 * scale, 75 * scale)
        const badgeH = 26 * scale
        const badgeX = centerX - badgeW / 2
        const badgeY = centerY - badgeH / 2

        drawRoundedRect(
          ctx,
          badgeX,
          badgeY,
          badgeW,
          badgeH,
          6 * scale,
          config.qrBgColor,
          config.qrFgColor,
          2 * scale
        )

        ctx.fillStyle = config.qrFgColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(badgeText, centerX, centerY + 1 * scale)
        ctx.restore()
      }
    }
  }

  return canvas
}

export async function downloadCustomFrontPNG(config: CustomCardConfig): Promise<void> {
  const canvas = await generateCustomFrontCanvas(config)
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `custom-card-DEPAN-${config.urlMode === 'ony' ? 'ONY-001' : 'client'}.png`
  a.click()
}

export async function downloadCustomBackPNG(config: CustomCardConfig): Promise<void> {
  const canvas = await generateCustomBackCanvas(config)
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `custom-card-BELAKANG-${config.urlMode === 'ony' ? 'ONY-001' : 'client'}.png`
  a.click()
}

/**
 * Generates combined Duplex PDF Blob supporting bulk quantity (1 set = Front + Back)
 * In Ony mode: each set gets its own unique activation code (e.g. ONY-001, ONY-002, ...)
 */
export async function generateCustomDuplexPDFBlob(
  config: CustomCardConfig,
  quantity = 1
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [2.1, 3.4],
  })

  const totalSets = Math.max(1, Math.min(quantity, 200))
  const prefix = config.onyPrefix || 'ONY-'

  if (config.urlMode === 'ony') {
    // Generate distinct card set for each quantity count
    for (let i = 0; i < totalSets; i++) {
      const code = `${prefix}${String(i + 1).padStart(3, '0')}`
      const frontCanvas = await generateCustomFrontCanvas(config, code)
      const backCanvas = await generateCustomBackCanvas(config, code)

      if (i > 0) pdf.addPage([2.1, 3.4], 'portrait')
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 2.1, 3.4)

      pdf.addPage([2.1, 3.4], 'portrait')
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 2.1, 3.4)
    }
  } else {
    // Custom URL mode: all sets use the identical custom URL canvas
    const frontCanvas = await generateCustomFrontCanvas(config)
    const frontDataUrl = frontCanvas.toDataURL('image/png')

    const backCanvas = await generateCustomBackCanvas(config)
    const backDataUrl = backCanvas.toDataURL('image/png')

    for (let i = 0; i < totalSets; i++) {
      if (i > 0) pdf.addPage([2.1, 3.4], 'portrait')
      pdf.addImage(frontDataUrl, 'PNG', 0, 0, 2.1, 3.4)

      pdf.addPage([2.1, 3.4], 'portrait')
      pdf.addImage(backDataUrl, 'PNG', 0, 0, 2.1, 3.4)
    }
  }

  return pdf.output('blob')
}

/**
 * Downloads combined Duplex PDF Ready for Print with quantity support
 */
export async function downloadCustomDuplexPDF(
  config: CustomCardConfig,
  quantity = 1
): Promise<void> {
  const blob = await generateCustomDuplexPDFBlob(config, quantity)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `custom-card-duplex-${quantity}sets.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads ZIP package containing paired PNG images + Print-ready PDF for requested quantity
 */
export async function downloadCustomZIP(
  config: CustomCardConfig,
  quantity = 1
): Promise<void> {
  const zip = new JSZip()
  const prefix = config.onyPrefix || 'ONY-'

  try {
    if (config.urlMode === 'ony') {
      for (let i = 1; i <= quantity; i++) {
        const code = `${prefix}${String(i).padStart(3, '0')}`
        const frontCanvas = await generateCustomFrontCanvas(config, code)
        const frontBlob = await new Promise<Blob | null>((r) => frontCanvas.toBlob(r, 'image/png'))
        if (frontBlob) zip.file(`DEPAN_${code}.png`, frontBlob)

        const backCanvas = await generateCustomBackCanvas(config, code)
        const backBlob = await new Promise<Blob | null>((r) => backCanvas.toBlob(r, 'image/png'))
        if (backBlob) zip.file(`BELAKANG_${code}.png`, backBlob)
      }
    } else {
      const frontCanvas = await generateCustomFrontCanvas(config)
      const frontBlob = await new Promise<Blob | null>((r) => frontCanvas.toBlob(r, 'image/png'))

      const backCanvas = await generateCustomBackCanvas(config)
      const backBlob = await new Promise<Blob | null>((r) => backCanvas.toBlob(r, 'image/png'))

      if (quantity === 1) {
        if (frontBlob) zip.file(`01_DEPAN_custom.png`, frontBlob)
        if (backBlob) zip.file(`02_BELAKANG_custom.png`, backBlob)
      } else {
        for (let i = 1; i <= quantity; i++) {
          if (frontBlob) zip.file(`DEPAN_custom_set${i}.png`, frontBlob)
          if (backBlob) zip.file(`BELAKANG_custom_set${i}.png`, backBlob)
        }
      }
    }

    const pdfBlob = await generateCustomDuplexPDFBlob(config, quantity)
    zip.file(`00_PRINT_DUPLEX_${quantity}SETS.pdf`, pdfBlob)
  } catch (err) {
    console.error('Gagal generate package ZIP custom card:', err)
  }

  const zipContent = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipContent)
  const a = document.createElement('a')
  a.href = url
  a.download = `custom-card-package-${quantity}sets.zip`
  a.click()
  URL.revokeObjectURL(url)
}
