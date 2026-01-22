import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Logo_shabfai.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ShabaFAI',
        short_name: 'ShabaFAI',
        description: 'Votre Internet Haut Débit',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'Logo_shabfai.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Logo_shabfai.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    hmr: false, // Désactive totalement le Hot Module Replacement
    watch: {
      usePolling: false // Optionnel : désactive aussi la surveillance active si nécessaire
    }
  }
})
