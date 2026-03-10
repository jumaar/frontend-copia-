import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite que el servidor sea accesible desde tu red local
    // Añade tu dominio del túnel a la lista de hosts permitidos
    allowedHosts: ['vorak.app'],
  },
})
