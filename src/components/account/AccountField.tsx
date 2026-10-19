import type { InputHTMLAttributes } from 'react'

const fieldClass = 'min-h-10 w-full min-w-0 rounded-md border border-[#624230] bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-[#b39463] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-60'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function AccountField({ label, hint, id, required, className = '', ...props }: FieldProps) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-xs text-foreground">
        {label}{required && <span aria-hidden="true" className="text-primary"> *</span>}
      </label>
      <input id={id} required={required} className={`${fieldClass} ${className}`} {...props}/>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

