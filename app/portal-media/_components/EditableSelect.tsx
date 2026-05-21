'use client'

interface Props {
  value: string
  options: { value: string; label: string }[]
  isEditing: boolean
  onChange: (val: string) => void
  className?: string
}

export default function EditableSelect({ value, options, isEditing, onChange, className = '' }: Props) {
  const label = options.find(o => o.value === value)?.label ?? value

  if (!isEditing) return <span className={className}>{label}</span>

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-[#0a0a12] border border-white/20 text-white/80 px-2 py-1 outline-none focus:border-white/40 rounded-sm text-sm ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
