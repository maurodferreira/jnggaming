import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// Local Windows fallback for files locked by antivirus, the editor or Vite.
// When enabled, use only the checked-in, up-to-date routeTree.gen.ts.
// CI intentionally leaves this unset so typed routes regenerate normally.
const skipGeneration = process.env.KURIO_SKIP_ROUTE_GENERATION === 'true'

export default defineConfig(() => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      enableRouteGeneration: !skipGeneration,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
