'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, QrCode, Palette } from 'lucide-react'

interface Card { id: string; card_name: string; activation_code: string }

export default function QRStudioPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [fgColor, setFgColor] = useState('#087CFF')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [size, setSize] = useState(300)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const svgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/cards/mine')
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(data)
          if (data.length > 0) setSelected(data[0])
        }
      })
      .catch(() => {})
  }, [])

  const qrUrl = selected
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://ony.id'}/c/${selected.activation_code}`
    : ''

  const getLogoBase64 = async (): Promise<string> => {
    try {
      const res = await fetch('/logo.png')
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.readAsDataURL(blob)
      })
    } catch (_) {
      return ''
    }
  }

  const injectCircularBadge = (svgStr: string, bg = '#FFFFFF') => {
    if (!svgStr.includes('<image')) return svgStr
    const xMatch = svgStr.match(/<image[^>]*\bx="([^"]+)"/)
    const yMatch = svgStr.match(/<image[^>]*\by="([^"]+)"/)
    const wMatch = svgStr.match(/<image[^>]*\bwidth="([^"]+)"/)
    if (!xMatch || !yMatch || !wMatch) return svgStr

    const x = parseFloat(xMatch[1])
    const y = parseFloat(yMatch[1])
    const w = parseFloat(wMatch[1])

    const cx = (x + w / 2).toFixed(2)
    const cy = (y + w / 2).toFixed(2)
    const r = (w * 0.65).toFixed(2)

    const circleElement = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}" stroke="#E2E8F0" stroke-width="1.5" />`
    return svgStr.replace(/<image /g, `${circleElement}<image `)
  }

  const downloadSVG = async () => {
    if (!svgRef.current) return
    const svg = svgRef.current.querySelector('svg')
    if (!svg) return

    let svgData = new XMLSerializer().serializeToString(svg)
    const logoBase64 = await getLogoBase64()

    if (logoBase64) {
      svgData = svgData.replace(/href="\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = svgData.replace(/href="http[^"]*\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = injectCircularBadge(svgData, bgColor)
    }

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ony-qr-${selected?.activation_code ?? 'code'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = async () => {
    if (!svgRef.current) return
    const svg = svgRef.current.querySelector('svg')
    if (!svg) return

    let svgData = new XMLSerializer().serializeToString(svg)
    const logoBase64 = await getLogoBase64()

    if (logoBase64) {
      svgData = svgData.replace(/href="\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = svgData.replace(/href="http[^"]*\/logo\.png"/g, `href="${logoBase64}"`)
      svgData = injectCircularBadge(svgData, bgColor)
    }

    const canvas = document.createElement('canvas')
    const targetSize = Math.max(600, size * 2)
    canvas.width = targetSize
    canvas.height = targetSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetSize, targetSize)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `ony-qr-${selected?.activation_code ?? 'code'}.png`
      a.click()
    }

    img.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const presets = [
    { name: 'Classic Light', fg: '#0F172A', bg: '#FFFFFF' },
    { name: 'Ony Blue', fg: '#087CFF', bg: '#F8FAFC' },
    { name: 'Ony Indigo', fg: '#4F46E5', bg: '#F8FAFC' },
    { name: 'Dark Contrast', fg: '#FFFFFF', bg: '#0F172A' },
  ]

  const safeCards = Array.isArray(cards) ? cards : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">QR Studio</h1>
        <p className="text-slate-600">Generate QR code resolusi tinggi untuk kartu NFC kamu.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          {/* Card Selector */}
          <div className="card-surface p-6">
            <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3 block">Pilih Kartu</label>
            <select
              className="input-field"
              value={selected?.id ?? ''}
              onChange={e => setSelected(safeCards.find(c => c.id === e.target.value) ?? null)}
            >
              {safeCards.length === 0 && <option value="">Belum ada kartu</option>}
              {safeCards.map(c => (
                <option key={c.id} value={c.id}>{c.card_name} — {c.activation_code}</option>
              ))}
            </select>
            {selected && (
              <div className="mt-2 text-xs text-slate-500 font-mono break-all">
                URL: {qrUrl}
              </div>
            )}
          </div>

          {/* Color Presets */}
          <div className="card-surface p-6">
            <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette size={14} className="text-ony-blue" />
              Warna
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setFgColor(p.fg); setBgColor(p.bg) }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-all text-xs font-semibold text-slate-700 shadow-xs"
                >
                  <div className="w-5 h-5 rounded border border-slate-300" style={{ background: p.bg }}>
                    <div className="w-full h-full rounded-xs flex items-center justify-center">
                      <div className="w-2 h-2 rounded-xs" style={{ background: p.fg }} />
                    </div>
                  </div>
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1.5 block">Warna QR</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 bg-white cursor-pointer" />
                  <input className="input-field flex-1 font-mono text-xs py-2" value={fgColor}
                    onChange={e => setFgColor(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1.5 block">Latar Belakang</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 bg-white cursor-pointer" />
                  <input className="input-field flex-1 font-mono text-xs py-2" value={bgColor}
                    onChange={e => setBgColor(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card-surface p-6">
            <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-4 block">Pengaturan</label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600 font-medium">Ukuran</span>
                  <span className="text-slate-900 font-mono font-bold">{size}px</span>
                </div>
                <input type="range" min="200" max="600" step="50" value={size}
                  onChange={e => setSize(+e.target.value)}
                  className="w-full accent-ony-blue" />
              </div>

              <div>
                <label className="text-slate-600 text-xs font-medium mb-2 block">Error Correction</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['L', 'M', 'Q', 'H'] as const).map(l => (
                    <button key={l} onClick={() => setErrorLevel(l)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                        errorLevel === l ? 'bg-ony-blue text-white' : 'border border-slate-200 text-slate-600 bg-white'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-2">H = highest error tolerance (best for logo overlay)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="space-y-5">
          <div className="card-surface p-6 flex flex-col items-center">
            <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-4 w-full">Preview</div>

            {qrUrl ? (
              <div ref={svgRef} className="rounded-3xl p-6 mb-4 shadow-xl border border-slate-200/90 relative overflow-hidden transition-all" style={{ background: bgColor }}>
                <QRCodeSVG
                  value={qrUrl}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={errorLevel}
                  marginSize={1}
                  imageSettings={{
                    src: '/logo.png',
                    height: Math.round(size * 0.20),
                    width: Math.round(size * 0.20),
                    excavate: true,
                  }}
                />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl mb-4 bg-slate-50">
                <QrCode size={40} className="text-slate-300" />
              </div>
            )}

            <div className="text-center mb-4">
              <div className="text-slate-900 font-bold text-sm">{selected?.card_name ?? 'Pilih kartu'}</div>
              <div className="text-slate-500 text-xs font-mono">{selected?.activation_code}</div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                id="download-svg-btn"
                onClick={downloadSVG}
                disabled={!qrUrl}
                className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm py-3"
              >
                <Download size={16} />
                SVG
              </button>
              <button
                id="download-png-btn"
                onClick={downloadPNG}
                disabled={!qrUrl}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3"
              >
                <Download size={16} />
                PNG (2x)
              </button>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">💡 Tips Penggunaan</h3>
            <ul className="space-y-2 text-slate-600 text-xs leading-relaxed">
              <li>• <span className="text-slate-900 font-semibold">Error Correction H</span> untuk QR dengan logo overlay</li>
              <li>• Download <span className="text-slate-900 font-semibold">SVG</span> untuk cetak resolusi tak terbatas</li>
              <li>• Gunakan <span className="text-slate-900 font-semibold">PNG 2x</span> untuk WhatsApp, stiker digital</li>
              <li>• Quiet zone minimal 4 modul di sekeliling QR</li>
              <li>• Pastikan kontras warna cukup tinggi untuk scanning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
