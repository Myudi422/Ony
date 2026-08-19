import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function hexToPlaceId(hex1: string, hex2: string): string {
  const buf1 = Buffer.from(hex1.padStart(16, '0'), 'hex').reverse()
  const buf2 = Buffer.from(hex2.padStart(16, '0'), 'hex').reverse()
  const header = Buffer.from([0x0a, 0x12, 0x09])
  const mid = Buffer.from([0x11])
  const full = Buffer.concat([header, buf1, mid, buf2])
  return full.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input URL atau nama lokasi wajib diisi.' }, { status: 400 })
    }

    const cleanInput = input.trim()

    // Case 1: Direct Place ID (e.g. ChIJZ6Wes4LbaS4Rw22hPsS7w8k)
    if (/^ChIJ[a-zA-Z0-9_-]{23}$/.test(cleanInput)) {
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${cleanInput}`
      return NextResponse.json({ success: true, placeId: cleanInput, reviewUrl })
    }

    // Case 2: Already a write review URL
    const existingChij = cleanInput.match(/placeid=(ChIJ[a-zA-Z0-9_-]{23})/)
    if (existingChij) {
      const placeId = existingChij[1]
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`
      return NextResponse.json({ success: true, placeId, reviewUrl })
    }

    let targetUrl = cleanInput

    // Case 3: Shortened Google Maps link or HTTP URL -> follow redirects
    if (cleanInput.includes('maps.app.goo.gl') || cleanInput.includes('goo.gl/maps') || cleanInput.startsWith('http')) {
      try {
        const res = await fetch(cleanInput, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })
        targetUrl = res.url
      } catch (err) {
        console.error('Error resolving Google Maps URL redirect:', err)
      }
    }

    // Case 4: Extract hex pair (1s0x...:0x... or 0x...:0x...)
    const hexMatch = targetUrl.match(/1s0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)/) || targetUrl.match(/0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)/)
    if (hexMatch) {
      const placeId = hexToPlaceId(hexMatch[1], hexMatch[2])
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`
      return NextResponse.json({ success: true, placeId, reviewUrl, resolvedUrl: targetUrl })
    }

    // Case 5: CID match
    const cidMatch = targetUrl.match(/cid=([0-9]+)/)
    if (cidMatch) {
      const cidHex = BigInt(cidMatch[1]).toString(16)
      const hex1Match = targetUrl.match(/0x([0-9a-fA-F]+)/)
      if (hex1Match) {
        const placeId = hexToPlaceId(hex1Match[1], cidHex)
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`
        return NextResponse.json({ success: true, placeId, reviewUrl, resolvedUrl: targetUrl })
      }
    }

    // Fallback: If it's a generic URL or query, return targetUrl
    return NextResponse.json({
      success: true,
      placeId: null,
      reviewUrl: targetUrl,
      note: 'Tidak dapat mengekstrak Place ID otomatis. Menggunakan URL yang dimasukkan.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Gagal memproses URL Google Maps.' }, { status: 500 })
  }
}
