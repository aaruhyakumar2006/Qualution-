import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/ - Qualution Studio
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'audio/**/*.mp3'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB to allow large poster assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wasm}'],
        runtimeCaching: [
          {
            // App shell and scripts
            urlPattern: /\.(?:js|css|html)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'qualution-app-shell',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Engine bundles, web workers, and heavy assets
            urlPattern: /.*(?:engine|worker|tableau|assets).*\.(?:js|wasm)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qualution-engine-bundles',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
            },
          },
          {
            // Lesson JSON files & curriculum metadata
            urlPattern: /\/(?:lessons|theory)\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qualution-lessons-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'QUALUTION Quantum Studio',
        short_name: 'QUALUTION',
        description: 'Offline-First Client-Side Quantum Simulation & Interactive Learning',
        theme_color: '#040914',
        background_color: '#040914',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco Editor — the single biggest dependency (~4 MB)
          'monaco-editor': ['@monaco-editor/react'],
          // KaTeX + ReactMarkdown — heavy, only used in TutorPanel
          'markdown-math': ['react-markdown', 'remark-math', 'rehype-katex', 'katex'],
          // React core — shared stable chunk
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 20000,
  },
});
