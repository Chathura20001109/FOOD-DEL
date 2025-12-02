import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../back_end/ssl/cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../back_end/ssl/cert.crt')),
      ca: fs.readFileSync(path.resolve(__dirname, '../back_end/ssl/ca.crt'))
    },
    port: 5176,
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5176,
      clientPort: 5176,
      timeout: 30000,
      overlay: true
    }
  }
})
