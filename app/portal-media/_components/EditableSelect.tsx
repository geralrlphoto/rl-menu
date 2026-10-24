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
      className={`bg-[#00141f] border border-white/[0.14] text-white px-2.5 py-1.5 outline-none focus:border-[#2e6cf6] rounded-md text-base ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
