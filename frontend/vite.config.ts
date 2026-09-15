import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const __dirname = import.meta.dirname

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

function gitSafe(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return fallback
  }
}

const BUILD_COUNT = gitSafe('git rev-list --count HEAD', '0')
const BUILD_SHA = gitSafe('git rev-parse --short HEAD', 'unknown')

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
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COUNT__: JSON.stringify(BUILD_COUNT),
    __BUILD_SHA__: JSON.stringify(BUILD_SHA),
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
