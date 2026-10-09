import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DATASET = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '03_fraud_transactions.json')

// Serves the private dataset from the project root to the LOCAL dev/preview
// server only. It is never copied into `dist/`, so a deployed build contains
// no data and users must upload their own JSON.
function localDataset() {
  const handler = (req, res, next) => {
    if (req.url?.split('?')[0] !== '/__local/dataset.json') return next()
    if (!fs.existsSync(DATASET)) {
      res.statusCode = 404
      return res.end('not found')
    }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    fs.createReadStream(DATASET).pipe(res)
  }
  return {
    name: 'local-dataset',
    configureServer(s) { s.middlewares.use(handler) },
    configurePreviewServer(s) { s.middlewares.use(handler) },
  }
}

export default defineConfig({
  plugins: [react(), localDataset()],
  test: { environment: 'node' },
})
