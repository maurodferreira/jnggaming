/**
 * O MSW inicializa em paralelo à primeira pintura do React.
 * As chamadas REST e a conexão Socket.IO aguardam esta mesma promessa,
 * impedindo requisições sem mock durante o carregamento.
 */
let ready: Promise<void> = Promise.resolve()

export function setMockStartup(startup: Promise<void>): void {
  ready = startup
}

export function waitForMockStartup(): Promise<void> {
  return ready
}
