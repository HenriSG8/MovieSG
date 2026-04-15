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
      // Forçamos o uso da versão pré-compilada para evitar que o esbuild tente compilar os arquivos internos do Node.js
      'webtorrent': 'webtorrent/dist/webtorrent.min.js',
      'bittorrent-dht': path.resolve(__dirname, './src/bittorrent-dht-stub.js'),
    },
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
