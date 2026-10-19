import { useState, type FormEvent } from 'react'
import { Camera, UserRound } from 'lucide-react'
import { AccountField } from '@/components/account/AccountField'
import { AccountLayout } from '@/components/account/AccountLayout'
import { getAuthErrorMessage } from '@/features/auth/useAuth'
import { useChangePassword, useProfile, useSaveProfile } from '@/features/account/useAccount'
import type { CollectorProfile } from '@/features/account/types'
import { Skeleton } from '@/components/ui/skeleton'

type EditableProfile = Omit<CollectorProfile, 'id'>

export function ProfilePage() {
  const profile = useProfile()
  const save = useSaveProfile()
  const passwordChange = useChangePassword()
  const [overrides, setOverrides] = useState<Partial<EditableProfile>>({})
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [formMessage, setFormMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const draft: EditableProfile | null = profile.data ? {
    displayName: profile.data.displayName,
    username: profile.data.username,
    email: profile.data.email,
    ensName: profile.data.ensName,
    walletNickname: profile.data.walletNickname,
    avatarDataUrl: profile.data.avatarDataUrl,
    ...overrides,
  } : null

  function patch<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setOverrides(current => ({ ...current, [key]: value }))
    setFormMessage('')
  }

  async function readAvatar(file: File | undefined) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setFormMessage('Use uma imagem PNG, JPG ou WebP de até 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') patch('avatarDataUrl', reader.result)
    }
    reader.onerror = () => setFormMessage('Não foi possível ler a imagem selecionada.')
    reader.readAsDataURL(file)
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    setFormMessage('')
    try {
      await save.mutateAsync(draft)
      setOverrides({})
      setFormMessage('Perfil salvo com sucesso.')
    } catch {
      // HTTP error is displayed below.
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage('')
    if (password.newPassword !== password.confirmPassword) {
      setPasswordMessage('As novas senhas não coincidem.')
      return
    }
    try {
      await passwordChange.mutateAsync(password)
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Senha atualizada com sucesso.')
    } catch {
      // HTTP error is displayed below.
    }
  }

  return (
    <AccountLayout active="/profile">
      <div className="max-w-[850px] space-y-9">
        <h2 className="text-lg font-bold">Perfil do colecionador</h2>
        {profile.isError ? (
          <div role="alert" className="space-y-4 text-sm text-destructive">
            <p>Não foi possível consultar o perfil.</p>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => void profile.refetch()}>Tentar novamente</button>
          </div>
        ) : profile.isPending || !draft ? (
          <div className="grid gap-5 sm:grid-cols-2" aria-label="Carregando dados do perfil">
            {Array.from({ length: 6 }, (_, i) => <Skeleton className="h-[74px]" key={i}/>)}
          </div>
        ) : (
          <>
            <form onSubmit={submitProfile} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <AccountField label="Nome de exibição" id="profile-display-name" required minLength={2} maxLength={60}
                  value={draft.displayName} onChange={e => patch('displayName', e.target.value)}/>
                <AccountField label="Nome de usuário" id="profile-username" required minLength={3} maxLength={30}
                  pattern="[a-zA-Z0-9_.]{3,30}" value={draft.username} onChange={e => patch('username', e.target.value)}/>
                <AccountField label="E-mail" id="profile-email" required type="email" value={draft.email}
                  onChange={e => patch('email', e.target.value)}/>
                <AccountField label="Nome ENS (opcional)" id="profile-ens" placeholder="colecionador.eth" maxLength={64}
                  value={draft.ensName} onChange={e => patch('ensName', e.target.value)}/>
                <AccountField label="Apelido da carteira (opcional)" id="profile-nickname" maxLength={40}
                  value={draft.walletNickname} onChange={e => patch('walletNickname', e.target.value)}/>
                <div className="space-y-2">
                  <p className="text-xs">Avatar</p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#301d15] text-primary">
                      {draft.avatarDataUrl ? <img src={draft.avatarDataUrl} alt="Prévia do seu avatar" className="size-full object-cover"/> : <UserRound size={24}/>}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-[#e89b55]">
                      <Camera size={16}/> Alterar
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => void readAvatar(e.target.files?.[0])}/>
                    </label>
                    <button type="button" onClick={() => patch('avatarDataUrl', null)} className="text-xs text-[#cfb28c] hover:text-primary">Remover</button>
                  </div>
                </div>
              </div>
              {formMessage && <p role="status" className="text-sm text-[#e89b55]">{formMessage}</p>}
              {save.isError && <p role="alert" className="text-sm text-destructive">{getAuthErrorMessage(save.error)}</p>}
              <button type="submit" disabled={save.isPending} className="rounded-md bg-primary px-8 py-3 text-xs font-bold text-primary-foreground hover:bg-[#e89b55] disabled:opacity-50">
                {save.isPending ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </form>

            <section className="max-w-[400px] space-y-5 border-t border-[#624230] pt-7" aria-label="Alteração de senha">
              <h3 className="text-sm font-bold">Alterar senha</h3>
              <form onSubmit={submitPassword} className="space-y-5">
                <AccountField label="Senha atual" id="current-password" type="password" required minLength={8}
                  autoComplete="current-password" value={password.currentPassword} onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}/>
                <AccountField label="Nova senha" id="new-password" type="password" required minLength={8}
                  autoComplete="new-password" value={password.newPassword} onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))}/>
                <AccountField label="Confirmar nova senha" id="confirm-password" type="password" required minLength={8}
                  autoComplete="new-password" value={password.confirmPassword} onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))}/>
                {passwordMessage && <p role="status" className="text-sm text-[#e89b55]">{passwordMessage}</p>}
                {passwordChange.isError && <p role="alert" className="text-sm text-destructive">{getAuthErrorMessage(passwordChange.error)}</p>}
                <button type="submit" disabled={passwordChange.isPending} className="rounded-md bg-primary px-8 py-3 text-xs font-bold text-primary-foreground hover:bg-[#e89b55] disabled:opacity-50">
                  {passwordChange.isPending ? 'Salvando...' : 'Atualizar senha'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </AccountLayout>
  )
}
