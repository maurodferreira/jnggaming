import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface AccountSelectOption<T extends string> {
  value: T
  label: string
}

interface AccountSelectProps<T extends string> {
  id: string
  label: string
  value: T
  options: readonly AccountSelectOption<T>[]
  onValueChange: (value: T) => void
  required?: boolean
  disabled?: boolean
  hint?: string
}

/**
 * A consistent, accessible select for account forms.
 *
 * Uses the existing Base UI / shadcn primitive for keyboard navigation,
 * focus management and a portal-based popup, without the native OS menu.
 */
export function AccountSelect<T extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
  required = false,
  disabled = false,
  hint,
}: AccountSelectProps<T>) {
  const labelId = `${id}-label`

  return (
    <div className="min-w-0 space-y-2">
      <label id={labelId} htmlFor={id} className="block text-xs text-foreground">
        {label}{required && <span aria-hidden="true" className="text-primary"> *</span>}
      </label>
      <Select
        name={id}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChange(nextValue as T)
        }}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={labelId}
          className="h-11 w-full min-w-0 rounded-md border border-[#624230] bg-[#1e130f] px-3 text-sm text-[#f5f1eb] shadow-none transition-colors hover:border-[#b47546] hover:bg-[#291911] focus-visible:border-[#e89b55] focus-visible:ring-2 focus-visible:ring-[#e89b55]/30 data-[popup-open]:border-[#e89b55] data-[popup-open]:bg-[#291911] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          side="bottom"
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-[100] overflow-hidden rounded-xl border border-[#734831] bg-[#241612] p-1.5 text-[#f5f1eb] shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-0"
        >
          {options.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-11 cursor-pointer rounded-lg px-3 py-2.5 text-sm text-[#f5f1eb] transition-colors focus:bg-[#493021] focus:text-[#f5f1eb] data-[highlighted]:bg-[#493021] data-[highlighted]:text-[#f5f1eb] data-[selected]:text-[#e89b55]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs leading-5 text-[#c5a77c]">{hint}</p>}
    </div>
  )
}
