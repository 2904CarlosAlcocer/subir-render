import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      jpg: { quality: 85 },
      jpeg: { quality: 85 },
      png: { quality: 85 },
      webp: { quality: 85 },
    }),
    visualizer({
      open: true,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // FIX bug Vite 8 / Rolldown: fuerza la condición 'production' explícita
  // en el build, en vez de confiar en la resolución automática de
  // 'development|production' que en Rolldown a veces resuelve mal para
  // dependencias anidadas (p.ej. el paquete interno 'react-router' del
  // que depende react-router-dom).
  resolve: {
    conditions:
      command === 'build'
        ? ['production', 'import', 'module', 'browser', 'default']
        : undefined,
  },
  // Workaround documentado por el equipo de Vite para bugs de resolución
  // en Vite 8: desactiva el plugin nativo de Rust y usa el resolver JS.
  experimental: {
    enableNativePlugin: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'esnext', // navegadores modernos, menos polyfills = menos JS a evaluar
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // OJO: react-router-dom depende internamente del paquete
            // 'react-router' (sin '-dom'), por eso el chunk problemático
            // no caía aquí antes y terminaba en el 'vendor' genérico.
            if (id.includes('react-router')) return 'router-vendor'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            if (id.includes('zustand')) return 'state-vendor'
            if (id.includes('axios')) return 'axios-vendor'
            if (id.includes('lucide-react')) return 'icons-vendor'
            return 'vendor' // resto de node_modules
          }
        },
      },
    },
  },
}))