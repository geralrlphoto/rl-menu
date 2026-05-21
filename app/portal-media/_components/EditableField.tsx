'use client'

interface Props {
  value: string
  isEditing: boolean
  onChange: (val: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  type?: string
}

export default function EditableField({ value, isEditing, onChange, className = '', placeholder, multiline, type = 'text' }: Props) {
  if (!isEditing) return <span className={className}>{value || <span className="opacity-30 italic">vazio</span>}</span>

  const base = `bg-white/[0.06] border border-white/20 text-white/80 px-2 py-1 outline-none focus:border-white/40 rounded-sm w-full ${className}`

  if (multiline) return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`${base} resize-y text-sm leading-relaxed`}
    />
  )

  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} text-sm`}
    />
  )
}
