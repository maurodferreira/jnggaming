import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { getAuthErrorMessage, useLogin, useRegister, useSession } from '@/features/auth/useAuth'

type Mode = 'login' | 'register'

const catalogSearch = {
  q: '', collection: 'all', available: false, sort: 'featured' as const, page: 1,
}

function Field({
  label, id, name, type = 'text', value, onChange, autoComplete, placeholder,
}: {
  label: string
  id: string
  name: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  const isSecret = type === 'password'
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isSecret && visible ? 'text' : type}
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder ?? label}
          required
          minLength={isSecret ? 8 : undefined}
          className="h-[50px] w-full rounded-[9px] border border-[#624230] bg-[#140d0a] px-4 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-[#b39463] focus-visible:border-[#e89b55] focus-visible:ring-1 focus-visible:ring-[#e89b55] md:h-10 md:rounded-md"
        />
        {isSecret && (
          <button
            type="button"
            aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute inset-y-0 right-3 flex items-center text-[#b39463] hover:text-primary"
          >
            {visible ? <Eye size={19}/> : <EyeOff size={19}/>}
          </button>
        )}
      </div>
    </div>
  )
}

export function AuthPage({ mode }: { mode: Mode }) {
  const next = useRouterState({
    select: state => {
      const search = state.location.search
      return 'next' in search && search.next === '/cart' ? '/cart' : '/'
    },
  })
  const navigate = useNavigate()
  const login = useLogin()
  const register = useRegister()
  const session = useSession()
  const mutation = mode === 'login' ? login : register

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (session.data) {
      if (next === '/cart') void navigate({ to: '/cart', replace: true })
      else void navigate({ to: '/', search: catalogSearch, replace: true })
    }
  }, [session.data, next, navigate])

  const isRegister = mode === 'register'
  const error = formError || (mutation.isError ? getAuthErrorMessage(mutation.error) : '')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (isRegister && password !== confirmPassword) {
      setFormError('As senhas precisam ser iguais.')
      return
    }
    if (password.length < 8) {
      setFormError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    try {
      if (isRegister) await register.mutateAsync({ name, email, password, confirmPassword })
      else await login.mutateAsync({ email, password })
      if (next === '/cart') await navigate({ to: '/cart', replace: true })
      else await navigate({ to: '/', search: catalogSearch, replace: true })
    } catch {
      // Error is rendered from the mutation's HTTP response, never treated as success.
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100vh-70px)] items-center justify-center overflow-hidden px-5 py-12 md:min-h-[800px] md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-40 md:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#4b2e20_0%,transparent_65%)]"/>
        <img src="/assets/nfts/emerald-ape.png" alt="" className="absolute right-[5%] top-[-1%] w-[31%] max-w-[420px] rounded-xl object-cover"/>
        <img src="/assets/nfts/sage-nomad.png" alt="" className="absolute bottom-[4%] left-[9%] w-[22%] max-w-[270px] rounded-xl object-cover"/>
        <img src="/assets/nfts/golden-beat.png" alt="" className="absolute bottom-[-4%] right-[14%] w-[21%] max-w-[260px] rounded-xl object-cover"/>
      </div>
      <div className="absolute inset-0 hidden bg-[#140d0a]/55 md:block" aria-hidden="true"/>

      <section aria-labelledby="auth-title" className="relative z-10 w-full max-w-[430px] rounded-lg bg-[#241612] px-2 py-12 shadow-2xl sm:px-10 md:max-w-[430px] md:border md:border-[#624230]/60 md:px-10 md:py-9">
        <div className="mb-14 text-center md:mb-5">
          <Link to="/" search={catalogSearch} className="text-3xl font-bold tracking-[0.18em] text-foreground md:hidden">KURIO</Link>
          <Link to="/" search={catalogSearch} aria-label="Fechar e voltar ao início" className="absolute right-3 top-3 hidden p-2 text-primary hover:text-[#e89b55] md:block"><X size={18}/></Link>
        </div>
        <div className="text-center">
          <h1 id="auth-title" className="mb-9 text-[19px] font-bold text-foreground md:mb-4 md:text-sm">
            <span className="md:hidden">{isRegister ? 'Criar perfil de colecionador' : 'Entrar'}</span>
            <span className="hidden md:inline">
              <Link to="/login" search={{ next }} className={!isRegister ? 'text-primary' : 'hover:text-primary'}>Entrar</Link>
              {' | '}
              <Link to="/register" search={{ next }} className={isRegister ? 'text-primary' : 'hover:text-primary'}>Criar conta</Link>
            </span>
          </h1>
          <p className="mb-6 hidden text-xs leading-5 text-[#cfb28c] md:block">
            {isRegister
              ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
              : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
          </p>
        </div>

        <form onSubmit={submit} noValidate={false} className="space-y-3">
          {isRegister && (
            <Field label="Nome de usuário" id="auth-name" name="name" value={name} onChange={setName} autoComplete="name"/>
          )}
          <Field label="E-mail" id="auth-email" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="contato@email.com"/>
          <Field label="Senha" id="auth-password" name="password" type="password" value={password} onChange={setPassword} autoComplete={isRegister ? 'new-password' : 'current-password'}/>
          {isRegister && (
            <Field label="Confirmar senha" id="auth-confirm-password" name="confirmPassword" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password"/>
          )}
          {!isRegister && <p className="text-right text-xs text-[#e89b55]">Recuperação de senha indisponível na demonstração.</p>}
          {error && <p role="alert" aria-live="assertive" className="rounded-md border border-destructive/50 p-3 text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={mutation.isPending || Boolean(session.data)}
            className="mt-7 flex h-[58px] w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-[#e89b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e89b55] disabled:opacity-60 md:mt-4 md:h-10 md:text-sm"
          >
            {mutation.isPending ? 'Aguarde...' : isRegister ? 'Criar perfil' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 md:mt-5">
          <div className="flex items-center gap-3 text-xs text-[#cfb28c]">
            <span className="h-px flex-1 bg-[#624230]"/>
            Ou continue com
            <span className="h-px flex-1 bg-[#624230]"/>
          </div>
          <div className="mt-3 space-y-3">
            <button type="button" disabled title="Login com Google não faz parte deste mock" className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-[#624230] text-sm text-muted-foreground opacity-60 md:h-10">
              <span className="font-bold text-primary">G</span> Continuar com Google (indisponível)
            </button>
            <button type="button" disabled title="Login com Facebook não faz parte deste mock" className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-[#624230] text-sm text-muted-foreground opacity-60 md:h-10">
              <span className="font-bold text-primary">f</span> Continuar com Facebook (indisponível)
            </button>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-[#cfb28c] md:mt-6">
          {isRegister ? 'Já tem uma conta?' : 'Novo na Kurio?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} search={{ next }} className="font-semibold text-[#e89b55] underline-offset-4 hover:underline">
            {isRegister ? 'Entre' : 'Crie uma conta'}
          </Link>
        </p>
        <p className="mt-5 text-center text-[10px] leading-4 text-muted-foreground">
          Ambiente demonstrativo. Não use uma senha pessoal.
        </p>
      </section>
    </main>
  )
}
