import { useState, type FormEvent } from 'react'
import { ethToWei } from '@/lib/eth'
import { normalizeEthFilter } from '@/features/catalog/types'
import { Button } from '@/components/ui/button'

interface CatalogPriceRangeProps {
  minPriceEth?: string
  maxPriceEth?: string
  onApply: (minPriceEth: string, maxPriceEth: string) => void
}

/**
 * Keep draft values in the form until the visitor presses Apply.
 * The validated decimal strings are then saved in the catalog URL;
 * filtering itself always happens in the simulated REST API.
 */
export function CatalogPriceRange({
  minPriceEth = '',
  maxPriceEth = '',
  onApply,
}: CatalogPriceRangeProps) {
  const [error, setError] = useState('')

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const rawMin = String(form.get('minPriceEth') ?? '').trim()
    const rawMax = String(form.get('maxPriceEth') ?? '').trim()
    const min = normalizeEthFilter(rawMin)
    const max = normalizeEthFilter(rawMax)

    if ((rawMin && !min) || (rawMax && !max)) {
      setError('Digite valores positivos válidos em ETH. Ex.: 0,50')
      return
    }

    if (min && max && ethToWei(min) > ethToWei(max)) {
      setError('O preço mínimo não pode ser maior que o máximo.')
      return
    }

    setError('')
    onApply(min, max)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[18px] font-bold">Faixa de preço</h2>
      <p className="text-xs text-[#cfb28c]">
        Preço: {minPriceEth ? minPriceEth.replace('.', ',') : '0,02'} - {maxPriceEth ? maxPriceEth.replace('.', ',') : '12,30'} ETH
      </p>
      <form
        key={`${minPriceEth}:${maxPriceEth}`}
        className="space-y-3"
        onSubmit={apply}
        aria-label="Filtrar faixa de preço"
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs text-[#cfb28c]">
            <span className="block">Mínimo (ETH)</span>
            <input
              name="minPriceEth"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={minPriceEth.replace('.', ',')}
              placeholder="0,02"
              aria-label="Preço mínimo (ETH)"
              className="h-9 w-full min-w-0 rounded-md border border-[#624230] bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
          <label className="space-y-1 text-xs text-[#cfb28c]">
            <span className="block">Máximo (ETH)</span>
            <input
              name="maxPriceEth"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={maxPriceEth.replace('.', ',')}
              placeholder="12,30"
              aria-label="Preço máximo (ETH)"
              className="h-9 w-full min-w-0 rounded-md border border-[#624230] bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <Button className="w-full" type="submit" size="sm">Aplicar faixa de preço</Button>
      </form>
    </div>
  )
}
