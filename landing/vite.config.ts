import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve Expo app at /app and /app/* so the path is correct for Expo Router (baseUrl /app).
// Login on landing writes to localStorage and redirects here; Expo reads auth from localStorage.
function expoAppPlugin() {
  const appDir = path.resolve(dirname, 'public/app')
  return {
    name: 'expo-app',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const url = req.url?.split('?')[0] ?? ''
        const isAppRoute = url === '/app' || url === '/app/' || (url.startsWith('/app/') && !path.extname(url))
        if (isAppRoute) {
          const indexHtml = path.join(appDir, 'index.html')
          if (fs.existsSync(indexHtml)) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(fs.readFileSync(indexHtml, 'utf-8'))
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [expoAppPlugin(), react()],
})
