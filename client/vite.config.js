import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false, // Désactive totalement le Hot Module Replacement
    watch: {
      usePolling: false // Optionnel : désactive aussi la surveillance active si nécessaire
    }
  }
})
