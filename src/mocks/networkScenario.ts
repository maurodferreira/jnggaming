import { delay, HttpResponse } from 'msw'

export type CatalogNetworkScenario = 'normal' | 'slow' | 'variable' | 'http-500' | 'offline'

const STORAGE_KEY = 'kurio:mock:catalog-network:v1'
let requestNumber = 0

export function getCatalogNetworkScenario(): CatalogNetworkScenario {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'slow' || value === 'variable' || value === 'http-500' || value === 'offline'
    ? value
    : 'normal'
}

export function setCatalogNetworkScenario(scenario: CatalogNetworkScenario) {
  localStorage.setItem(STORAGE_KEY, scenario)
  requestNumber = 0
}

export function resetCatalogNetworkScenario() {
  localStorage.removeItem(STORAGE_KEY)
  requestNumber = 0
}

/**
 * One shared, deterministic MSW transport profile for both catalog routes.
 *
 * Normal remains realistic but low-latency to avoid penalizing all navigation;
 * slow/variable/error/offline are separately reproducible, including in the
 * optimized build. None of the React components know about demo scenarios.
 */
export async function simulateCatalogNetwork(): Promise<Response | null> {
  const scenario = getCatalogNetworkScenario()
  if (scenario === 'offline') return HttpResponse.error()

  // Alternating delays exercise stale-response cancellation via Axios signal.
  const duration = scenario === 'slow'
    ? 1_500
    : scenario === 'variable'
      ? (requestNumber++ % 2 === 0 ? 1_100 : 120)
      : 40

  await delay(duration)

  if (scenario === 'http-500') {
    return HttpResponse.json(
      { message: 'Serviço de catálogo temporariamente indisponível.' },
      { status: 503 },
    )
  }
  return null
}
