import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Habilita todos os polyfills de Node.js necessários para WebTorrent
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // bittorrent-dht é Node-only (usa dgram/net), no browser usamos o stub para dev e build
      'bittorrent-dht': path.resolve(__dirname, './src/bittorrent-dht-stub.js'),
    },
  },
  optimizeDeps: {
    exclude: ['webtorrent', 'bittorrent-tracker', 'create-torrent'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          webtorrent: ['webtorrent'],
        },
      },
    },
  },
})
