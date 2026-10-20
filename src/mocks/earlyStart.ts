import { worker } from './browser'

// Entry leve e antecipado: o navegador busca o bundle do MSW em paralelo
// ao bundle React. A interface só inicia depois que ele assumir a rede.
const target = window as Window & { __kurioMockReady?: Promise<void> }

if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  target.__kurioMockReady = worker.start().then(() => undefined)
}
