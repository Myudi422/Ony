'use client'

import { useState, useEffect } from 'react'
import { Star, MessageCircle, ArrowRight, CheckCircle2, ShieldCheck, HeartHandshake, Loader2 } from 'lucide-react'

interface Props {
  code: string
  businessName: string
  googleReviewUrl: string
  complaintWa: string
}

const RATING_LABELS: Record<number, { title: string; subtitle: string; emoji: string }> = {
  1: { title: 'Sangat Kecewa', subtitle: 'Mohon maaf atas ketidaknyamanan Anda. Kami ingin memperbaikinya.', emoji: '😞' },
  2: { title: 'Kurang Puas', subtitle: 'Bantu kami mengetahui apa yang kurang memuaskan.', emoji: '🙁' },
  3: { title: 'Cukup / Biasa Saja', subtitle: 'Bantu kami agar pelayanan kami bisa lebih baik.', emoji: '😐' },
  4: { title: 'Puas', subtitle: 'Terima kasih! Apa saran Anda agar kami semakin sempurna?', emoji: '🙂' },
  5: { title: 'Sangat Puas!', subtitle: 'Luar biasa! Mohon bagikan pengalaman Anda di Google Maps.', emoji: '🤩' },
}

export default function ReviewFilterPage({
  code,
  businessName,
  googleReviewUrl,
  complaintWa,
}: Props) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [redirectingGoogle, setRedirectingGoogle] = useState(false)

  useEffect(() => {
    document.title = 'Review Feedback | Ony'
  }, [])

  // Clean WhatsApp number
  let cleanWa = (complaintWa || '').replace(/\D/g, '')
  if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1)

  const handleSelectRating = (rating: number) => {
    setSelectedRating(rating)

    if (rating === 5) {
      setRedirectingGoogle(true)
      // Instant redirect to Google Maps 5-Star review dialog
      setTimeout(() => {
        window.location.href = googleReviewUrl
      }, 700)
    }
  }

  const handleSendComplaintToWa = () => {
    const feedback = feedbackText.trim() || 'Saya memiliki beberapa catatan terkait pelayanan.'
    const name = customerName.trim() || 'Pengunjung'
    const ratingLabel = RATING_LABELS[selectedRating || 3]?.title || ''

    const message = `Halo Pengelola,\n\nSaya ingin menyampaikan masukan langsung:\n\n⭐ *Rating:* ${selectedRating}/5 (${ratingLabel})\n💬 *Masukan:* ${feedback}\n👤 *Dari:* ${name}\n\nMohon untuk dapat ditingkatkan kembali. Terima kasih!`

    const targetWa = cleanWa || '6289654728249' // Fallback to Ony support if no owner wa
    window.location.href = `https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(message)}`
  }

  const activeRating = hoverRating || selectedRating

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Top Accent Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold mb-4 font-display">
          <ShieldCheck size={14} className="text-amber-600" />
          <span>Form Masukan Resmi</span>
        </div>

        {/* Question */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight mb-2 leading-snug text-balance">
          Bagaimana Pengalaman<br />Anda Hari Ini?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          Beri penilaian Anda dengan memilih bintang di bawah:
        </p>

        {/* Interactive Star Rating Selector */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = activeRating !== null && star <= activeRating
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleSelectRating(star)}
                className="p-1 sm:p-1.5 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                aria-label={`Beri bintang ${star}`}
              >
                <Star
                  size={36}
                  className={`transition-colors duration-200 ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-slate-200 hover:text-amber-200'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Dynamic Label Based on Star Selected */}
        <div className="h-10 flex flex-col items-center justify-center mb-5">
          {activeRating ? (
            <div className="animate-in fade-in duration-150">
              <span className="text-base font-bold text-slate-800 font-display flex items-center justify-center gap-1.5">
                <span>{RATING_LABELS[activeRating]?.emoji}</span>
                <span>{RATING_LABELS[activeRating]?.title}</span>
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                {RATING_LABELS[activeRating]?.subtitle}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Sentuh bintang untuk memilih nilai
            </span>
          )}
        </div>

        {/* Case 5 Stars: Redirecting to Google Maps */}
        {selectedRating === 5 && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Terima Kasih Banyak!</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Dukungan ulasan bintang 5 Anda sangat berarti bagi kelangsungan usaha kami. Sentuh bintang ke-5 pada form Google Maps yang terbuka untuk menyelesaikan ulasan Anda.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
              {redirectingGoogle ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Membuka form ulasan Google Maps...</span>
            </div>
          </div>
        )}

        {/* Case 1-4 Stars: Private Feedback Form to WhatsApp */}
        {selectedRating !== null && selectedRating < 5 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2 text-slate-800 text-xs font-bold font-display">
              <HeartHandshake size={18} className="text-ony-blue shrink-0 mt-0.5" />
              <span>Sampaikan masukan langsung ke Manajemen:</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Apa yang bisa kami perbaiki? <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Contoh: Pelayanan agak lama, kebersihan meja kurang, dll..."
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ony-blue font-sans resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nama Anda (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ony-blue font-sans"
              />
            </div>

            <button
              type="button"
              onClick={handleSendComplaintToWa}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              <MessageCircle size={16} />
              <span>Kirim Masukan ke WhatsApp Pengelola</span>
              <ArrowRight size={14} className="ml-auto" />
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-tight">
              Pesan dikirim secara privat ke pengelola untuk tindak lanjut cepat.
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Ony Smart Review Gate</span>
          <span className="font-mono text-slate-500 font-medium">ID: {code}</span>
        </div>
      </div>
    </div>
  )
}
