import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

const __dirname = import.meta.dirname

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }]
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
  optimizeDeps: {
    include: ['svgpath']
  },
  define: {
    'global': 'globalThis',
    // 'window.jQuery': 'window.$',
    // 'window.$': 'window.$'
  },
  // Production-only: strip diagnostic console.log/debug/info/trace calls and
  // debugger statements. console.warn and console.error are preserved so user
  // bug reports still surface useful signals. Source files are untouched — this
  // prevents the class of regressions where manual cleanup of console.log
  // accidentally comments out live code (see commit 4d81bbed33).
  esbuild: mode === 'production' ? {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info', 'console.trace'],
  } : {},
}))
