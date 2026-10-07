import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPrefix = (env.VITE_DEV_API_PREFIX || '/villamor-riesbelle-lavalust-main').replace(/\/+$/, '')

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_ORIGIN || 'https://villamor-riesbelle-lavalust-back.onrender.com',
          changeOrigin: true,
          rewrite: (path) => `${apiPrefix}${path}`,
        },
      },
    },
  }
})
