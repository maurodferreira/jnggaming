const WEI_PER_ETH = 10n ** 18n

export function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')

  if (
    !/^\d+$/.test(whole) ||
    !/^\d{0,18}$/.test(fraction)
  ) {
    throw new Error('Valor em ETH inválido')
  }

  return (
    BigInt(whole) * WEI_PER_ETH +
    BigInt(fraction.padEnd(18, '0'))
  )
}

export function weiToEth(value: bigint): string {
  if (value < 0n) {
    throw new Error('Valor negativo não permitido')
  }

  const whole = value / WEI_PER_ETH
  const fraction = (value % WEI_PER_ETH)
    .toString()
    .padStart(18, '0')
    .replace(/0+$/, '')

  return fraction
    ? `${whole}.${fraction}`
    : whole.toString()
}

export function multiplyEth(
  priceEth: string,
  quantity: number
): string {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('Quantidade inválida')
  }

  return weiToEth(
    ethToWei(priceEth) * BigInt(quantity)
  )
}
