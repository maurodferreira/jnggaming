import { useState, type FormEvent } from 'react'
import { AccountField } from '@/components/account/AccountField'
import { AccountSelect } from '@/components/account/AccountSelect'
import { AccountLayout } from '@/components/account/AccountLayout'
import { useRemoveWallet, useSaveWallet, useWallets } from '@/features/account/useAccount'
import { getAuthErrorMessage } from '@/features/auth/useAuth'
import type { CollectorWallet, WalletInput, WalletNetwork, WalletType } from '@/features/account/types'
import { Skeleton } from '@/components/ui/skeleton'

const networkOptions: readonly { value: WalletNetwork; label: string }[] = [
  { value: 'Ethereum', label: 'Ethereum' },
  { value: 'Polygon', label: 'Polygon' },
  { value: 'Solana', label: 'Solana' },
]

const walletTypeOptions: readonly { value: WalletType; label: string }[] = [
  { value: 'Software', label: 'Software' },
  { value: 'Hardware', label: 'Hardware' },
]

const emptyWallet = (isPrimary: boolean): WalletInput => ({
  label: isPrimary ? 'Minha carteira principal' : 'Minha carteira secundária',
  nickname: '',
  network: 'Ethereum',
  address: '',
  type: 'Software',
  isPrimary,
})

function WalletEditor({ wallet, isPrimary }: { wallet?: CollectorWallet; isPrimary: boolean }) {
  const save = useSaveWallet()
  const remove = useRemoveWallet()
  const [overrides, setOverrides] = useState<Partial<WalletInput>>({})
  const [notice, setNotice] = useState('')

  const draft: WalletInput = {
    ...(wallet ? {
      label: wallet.label,
      nickname: wallet.nickname,
      network: wallet.network,
      address: wallet.address,
      type: wallet.type,
      isPrimary,
    } : emptyWallet(isPrimary)),
    ...overrides,
  }

  function update<K extends keyof WalletInput>(key: K, value: WalletInput[K]) {
    setOverrides(current => ({ ...current, [key]: value }))
    setNotice('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    try {
      await save.mutateAsync(draft)
      setOverrides({})
      setNotice('Carteira salva com sucesso.')
    } catch {
      // HTTP validation message is rendered below.
    }
  }

  async function removeSecondary() {
    try {
      await remove.mutateAsync()
      setOverrides({})
      setNotice('Carteira secundária removida.')
    } catch {
      // HTTP error is rendered below.
    }
  }

  return (
    <section aria-labelledby={isPrimary ? 'primary-wallet' : 'secondary-wallet'} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 id={isPrimary ? 'primary-wallet' : 'secondary-wallet'} className="text-base font-bold">
            {isPrimary ? 'Carteira principal' : 'Carteira secundária'}
          </h2>
          <p className="text-xs leading-6 text-[#cfb28c]">
            {isPrimary
              ? 'Carteiras cadastradas ficam disponíveis no checkout simulado.'
              : 'Você pode adicionar uma segunda carteira ou usar apenas a principal.'}
          </p>
        </div>
        {wallet && !isPrimary && (
          <button type="button" onClick={() => void removeSecondary()} disabled={remove.isPending}
            className="text-xs text-primary hover:underline disabled:opacity-50">Remover carteira</button>
        )}
      </header>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <AccountField label="Nome de exibição" id={`wallet-${isPrimary}-label`} required minLength={2} maxLength={60}
            value={draft.label} onChange={event => update('label', event.target.value)}/>
          <AccountField label="Apelido da carteira" id={`wallet-${isPrimary}-nickname`} required minLength={2} maxLength={40}
            value={draft.nickname} onChange={event => update('nickname', event.target.value)}/>
          <AccountSelect
            label="Rede"
            id={`wallet-${isPrimary}-network`}
            required
            value={draft.network}
            options={networkOptions}
            onValueChange={network => {
              if (network === draft.network) return
              setOverrides(current => ({ ...current, network, address: '' }))
              setNotice('')
            }}
          />
          <AccountSelect
            label="Tipo de carteira"
            id={`wallet-${isPrimary}-type`}
            required
            value={draft.type}
            options={walletTypeOptions}
            onValueChange={value => update('type', value)}
          />
          <div className="sm:col-span-2">
            <AccountField label="Endereço da carteira" id={`wallet-${isPrimary}-address`} required
              pattern={draft.network === 'Solana' ? '[1-9A-HJ-NP-Za-km-z]{32,44}' : '0x[a-fA-F0-9]{40}'}
              placeholder={draft.network === 'Solana' ? 'Endereço Solana (base58)' : '0x...'}
              hint="Use apenas um endereço fictício para esta demonstração."
              value={draft.address} onChange={event => update('address', event.target.value)}/>
          </div>
        </div>

        {notice && <p role="status" className="text-sm text-[#e89b55]">{notice}</p>}
        {save.isError && <p role="alert" className="text-sm text-destructive">{getAuthErrorMessage(save.error)}</p>}
        {remove.isError && <p role="alert" className="text-sm text-destructive">{getAuthErrorMessage(remove.error)}</p>}
        <button type="submit" disabled={save.isPending || remove.isPending}
          className="rounded-md bg-primary px-7 py-3 text-xs font-bold text-primary-foreground hover:bg-[#e89b55] disabled:opacity-50">
          {save.isPending ? 'Salvando...' : wallet ? 'Atualizar carteira' : 'Salvar carteira'}
        </button>
      </form>
    </section>
  )
}

export function WalletsPage() {
  const wallets = useWallets()

  return (
    <AccountLayout active="/wallets">
      {wallets.isPending ? (
        <div className="space-y-4" aria-label="Carregando carteiras">
          <Skeleton className="h-10 w-64"/>
          <Skeleton className="h-64 w-full"/>
        </div>
      ) : wallets.isError ? (
        <div role="alert" className="space-y-4 text-sm">
          <p>Não foi possível carregar as carteiras.</p>
          <button type="button" onClick={() => void wallets.refetch()} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Tentar novamente</button>
        </div>
      ) : (
        <div className="max-w-[850px] space-y-10">
          <WalletEditor isPrimary wallet={wallets.data?.find(wallet => wallet.isPrimary)} />
          <div className="border-t border-[#624230] pt-8">
            <WalletEditor isPrimary={false} wallet={wallets.data?.find(wallet => !wallet.isPrimary)} />
          </div>
        </div>
      )}
    </AccountLayout>
  )
}
