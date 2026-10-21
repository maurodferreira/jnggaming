export interface CollectorProfile {
  id: string
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarDataUrl: string | null
}

export type WalletNetwork = 'Ethereum' | 'Polygon' | 'Solana'
export type WalletType = 'Software' | 'Hardware'

export interface CollectorWallet {
  id: string
  label: string
  nickname: string
  network: WalletNetwork
  address: string
  type: WalletType
  isPrimary: boolean
}

export interface WalletInput {
  label: string
  nickname: string
  network: WalletNetwork
  address: string
  type: WalletType
  isPrimary: boolean
}

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
