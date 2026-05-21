'use client'

// Portuguese month abbreviations
const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// "15 Jul 2025" or "Jul 2025" → "2025-07-15"
function toISO(pt: string): string {
  if (!pt) return ''
  // "DD Mmm YYYY"
  const full = pt.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/)
  if (full) {
    const idx = PT_MONTHS.indexOf(full[2])
    if (idx >= 0) {
      return `${full[3]}-${String(idx + 1).padStart(2, '0')}-${full[1].padStart(2, '0')}`
    }
  }
  // "Mmm YYYY"
  const short = pt.match(/^(\w{3})\s+(\d{4})$/)
  if (short) {
    const idx = PT_MONTHS.indexOf(short[1])
    if (idx >= 0) {
      return `${short[2]}-${String(idx + 1).padStart(2, '0')}-01`
    }
  }
  return ''
}

// "2025-07-15" → "15 Jul 2025"
function fromISO(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  const m = PT_MONTHS[parseInt(month, 10) - 1]
  if (!m) return iso
  return `${parseInt(day, 10)} ${m} ${year}`
}

interface Props {
  value: string
  isEditing: boolean
  onChange: (val: string) => void
  className?: string
  placeholder?: string
}

export default function EditableDateField({ value, isEditing, onChange, className = '', placeholder }: Props) {
  if (!isEditing) {
    return (
      <span className={className}>
        {value || <span className="opacity-30 italic">{placeholder ?? 'sem data'}</span>}
      </span>
    )
  }

  const isoValue = toISO(value)

  return (
    <input
      type="date"
      value={isoValue}
      onChange={e => onChange(e.target.value ? fromISO(e.target.value) : '')}
      placeholder={placeholder}
      className={`[color-scheme:dark] bg-white/[0.06] border border-white/20 text-white/80
                  px-2 py-1 outline-none focus:border-white/40 rounded-sm w-full text-sm ${className}`}
    />
  )
}
