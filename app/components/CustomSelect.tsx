'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Selecionar...', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const base = "w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] transition-colors duration-200"

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${base} flex items-center justify-between text-left cursor-pointer
          ${open ? 'border-white/25' : 'hover:border-white/15'}
          ${value ? 'text-white/75' : 'text-white/15'}
          ${className}`}
      >
        <span>{value || placeholder}</span>
        <span className={`text-white/20 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5
                        bg-[#0d0d14] border border-white/[0.12]
                        shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                        max-h-60 overflow-y-auto">
          {/* Placeholder option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-4 py-3 text-[12px] transition-colors duration-150 border-b border-white/[0.05]
              ${!value ? 'text-white/40 bg-white/[0.04]' : 'text-white/20 hover:bg-white/[0.04] hover:text-white/40'}`}
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-[12px] tracking-[0.05em] transition-colors duration-150
                ${value === opt
                  ? 'text-white/80 bg-white/[0.07]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
