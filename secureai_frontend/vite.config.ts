import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'https://localhost:7124'
  const mlUrl = env.VITE_ML_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/ml': {
          target: mlUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ml/, ''),
        },
      },
    },
  }
})
