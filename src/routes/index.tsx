import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/HomePage'
import { parseCatalogSearch } from '@/features/catalog/types'

export const Route = createFileRoute('/')({
  validateSearch: parseCatalogSearch,
  component: HomePage,
})
