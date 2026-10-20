import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CatalogSort } from '@/features/catalog/types'

const sortLabels: Record<CatalogSort, string> = {
  featured: 'Destaques',
  newest: 'Listados recentemente',
  trending: 'Em alta',
  name_asc: 'Nome (A-Z)',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
}

/**
 * The Figma desktop select is deliberately isolated from the mobile route.
 * The tab buttons remain the visible mobile sorting interface, so loading the
 * Base UI select on a phone would add JavaScript without providing a control.
 */
export function DesktopCatalogSort({
  value,
  onChange,
}: {
  value: CatalogSort
  onChange: (sort: CatalogSort) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={next => {
        if (next) onChange(next as CatalogSort)
      }}
    >
      <SelectTrigger
        aria-label="Ordenar por"
        className="h-9 w-[190px] rounded-md border-[#624230] bg-[#241612] text-xs text-[#f5f1eb] hover:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <SelectValue>{sortLabels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent
        align="end"
        sideOffset={6}
        className="z-[100] rounded-lg border-[#624230] bg-[#241612] text-[#f5f1eb] shadow-xl"
      >
        <SelectItem value="featured">Destaques</SelectItem>
        <SelectItem value="newest">Listados recentemente</SelectItem>
        <SelectItem value="trending">Em alta</SelectItem>
        <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
        <SelectItem value="price_asc">Menor preço</SelectItem>
        <SelectItem value="price_desc">Maior preço</SelectItem>
      </SelectContent>
    </Select>
  )
}
