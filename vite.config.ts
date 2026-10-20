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
  // Isolate the costly initial UI and mock libraries into predictable chunks.
  // This is a measured stage-3 experiment; revert if Lighthouse regresses.
  // Do not split mock handlers from the MSW registration sequence.
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-core',
              test: /node_modules[\\/](?:react|react-dom)[\\/]/,
              priority: 30,
            },
            {
              name: 'msw-core',
              test: /node_modules[\\/](?:msw|@mswjs|@open-draft)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
