/**
 * Vite Configuration for Responsive PyMastery Frontend
 * Optimized for mobile-first development with performance focus
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@contexts': resolve(__dirname, 'src/contexts'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Expose to network for mobile testing
    open: false, // Don't auto-open browser
    cors: true,
    
    // Proxy for API calls during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Build configuration
  build: {
    // Target modern browsers for better performance
    target: ['es2020', 'chrome80', 'firefox78', 'safari13'],
    
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom'],
          
          // Router chunk
          router: ['react-router-dom'],
          
          // UI chunk
          ui: ['lucide-react', 'framer-motion'],
          
          // Utils chunk
          utils: ['clsx', 'tailwind-merge', 'axios'],
        },
        
        // Asset naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          const extType = info.split('.').pop();
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(info)) {
            return 'assets/media/[name]-[hash][extname]';
          }
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/.test(info)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4KB
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // CSS configuration
  css: {
    // PostCSS configuration for Tailwind
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
    
    // CSS modules
    modules: {
      localsConvention: 'camelCase',
    },
  },

  // Environment variables
  define: {
    // Define global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Preview configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Optimizations
  optimizeDeps: {
    // Pre-bundle dependencies for faster development
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'axios',
      'framer-motion',
    ],
    
    // Exclude from bundling (will be loaded from CDN if available)
    exclude: ['@types/react'],
  },

  // Experimental features
  experimental: {
    // Render built HTML for each route
    renderBuiltUrl: (filename, { hostType }) => {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: `/${filename}` };
      }
    },
  },

  // Environment-specific configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Development-specific settings
    esbuild: {
      // Keep class names in development for debugging
      keepNames: true,
    },
  }),
  
  ...(process.env.NODE_ENV === 'production' && {
    // Production-specific settings
    esbuild: {
      // Drop console and debugger in production
      drop: ['console', 'debugger'],
    },
  }),
});
