import type { Nft, NftDetailMetadata } from '@/features/catalog/types'

// These texts and review figures are display fixtures inspired by the Figma.
// Nothing here verifies a blockchain token, IPFS record or a real collector.
const emeraldApe: Omit<NftDetailMetadata, 'tokenId'> = {
  collectionLabel: 'Kurio Apes',
  description:
    'Emerald Ape #042 é um colecionável digital da curadoria Kurio Editions. ' +
    'A obra destaca um personagem com óculos e detalhes em esmeralda. ' +
    'Nesta demonstração, o catálogo, os atributos e a aquisição são simulados.',
  attributes: ['Óculos', 'Esmeralda', 'Raro'],
  reviewSummary: { average: 4.8, count: 19 },
}

export function getNftDetailMetadata(nft: Nft): NftDetailMetadata {
  const displayNumber = nft.name.match(/#(\d+)/)?.[1]
  const tokenId = `#${(displayNumber ?? nft.id).padStart(4, '0')}`

  if (nft.id === '1') {
    return { ...emeraldApe, tokenId }
  }

  return {
    tokenId,
    collectionLabel: nft.collection,
    description:
      `${nft.name} faz parte do catálogo demonstrativo Kurio. ` +
      'Escolha uma edição e confira os dados de preço e disponibilidade fornecidos pela API simulada.',
    attributes: [],
  }
}
