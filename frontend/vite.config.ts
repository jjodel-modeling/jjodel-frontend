import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }]
        ]
      }
    }),
    nodePolyfills({
      include: ['path', 'stream', 'util', 'buffer', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    }),
  ],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
      // 'jquery': 'jquery/dist/jquery.js'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        includePaths: [path.resolve(__dirname, './src')]
      }
    }
  },
  define: {
    'global': 'globalThis',
    // 'window.jQuery': 'window.$',
    // 'window.$': 'window.$'
  }
})
