import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/pages/NftDetailPage'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
})
