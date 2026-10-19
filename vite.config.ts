import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// Emergency local workaround for Windows file locks on routeTree.gen.ts.
// Normal development and production builds still regenerate typed routes.
const skipGeneration = process.env.KURIO_SKIP_ROUTE_GENERATION === 'true'

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      enableRouteGeneration: command !== 'serve' || !skipGeneration,
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
