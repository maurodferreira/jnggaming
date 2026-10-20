import { worker } from './browser'

// Register the mock before React starts reading REST data.
// A static import avoids the extra network waterfall observed with
// the dynamic worker bundle in mobile Lighthouse.
const target = window as Window & { __kurioMockReady?: Promise<void> }

if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  target.__kurioMockReady = worker.start().then(() => undefined)
}
