import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
      '@assets': resolve(__dirname, './src/assets'),
      '@services': resolve(__dirname, './src/services'),
      '@theme': resolve(__dirname, './src/theme'),
    },
  },
  server: {
    host: true,
    port: 5173,
    open: true,
    cors: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // Router
            if (id.includes('react-router')) {
              return 'router';
            }
            
            // UI libraries
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-vendor';
            }
            
            // Editor
            if (id.includes('@monaco-editor')) {
              return 'editor';
            }
            
            // Animation
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            
            // HTTP client and state management
            if (id.includes('axios') || id.includes('zustand') || id.includes('@tanstack/react-query')) {
              return 'state-vendor';
            }
            
            // Date utilities
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'date-vendor';
            }
            
            // Chart libraries
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'chart-vendor';
            }
            
            // Other large vendor libraries
            return 'vendor';
          }
          
          // Application chunks
          if (id.includes('pages/')) {
            const pageName = id.split('/').pop()?.split('.')[0];
            return `page-${pageName}`;
          }
          
          if (id.includes('components/')) {
            const componentName = id.split('/').pop()?.split('.')[0];
            return `component-${componentName}`;
          }
          
          // Context and hooks
          if (id.includes('contexts/') || id.includes('hooks/')) {
            return 'app-logic';
          }
          
          // Services and API
          if (id.includes('services/') || id.includes('api')) {
            return 'app-services';
          }
          
          // Utils and types
          if (id.includes('utils/') || id.includes('types/')) {
            return 'app-utils';
          }
        },
        chunkFileNames: () => {
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
            return `media/[name]-[hash].[ext]`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name)) {
            return `images/[name]-[hash].[ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `fonts/[name]-[hash].[ext]`;
          }
          return `${extType}/[name]-[hash].[ext]`;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@monaco-editor/react',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'axios',
      'zustand',
      '@tanstack/react-query',
      'framer-motion',
    ],
    exclude: ['@monaco-editor/monaco-editor'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  preview: {
    port: 4173,
    host: true,
  },
  css: {
    devSourcemap: false,
  },
})
