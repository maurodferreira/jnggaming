// Start MSW as a separate async bundle while the browser parses React.
// The promise is registered synchronously, so main.tsx will still wait for
// the worker before rendering any REST-driven components.
const target = window as Window & { __kurioMockReady?: Promise<void> }

if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
  target.__kurioMockReady = import('./browser')
    .then(({ worker }) => worker.start())
    .then(() => undefined)
}
