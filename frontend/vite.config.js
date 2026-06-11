import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Proxy de desarrollo ────────────────────────────────────────────────
  // Durante "npm run dev", Vite escucha en el puerto 5173.
  // Express escucha en el puerto 3001.
  //
  // Sin proxy, cuando React hace fetch('/api/products'), el navegador
  // intentaría ir a http://localhost:5173/api/products — que no existe.
  // Además, el navegador bloquearía la petición por CORS (política de
  // mismo origen: no puedes pedir datos de un puerto diferente sin
  // que el servidor lo permita explícitamente).
  //
  // Con este proxy, Vite intercepta cualquier URL que empiece con /api
  // y la redirige al servidor Express. Es completamente transparente
  // para React: el componente solo ve '/api/products' y funciona.
  //
  // En PRODUCCIÓN este proxy no existe (Vite no corre en prod).
  // Allí, React y Express deben estar en el mismo dominio, o Express
  // debe configurar el header CORS correctamente.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Dirección de tu servidor Express
        changeOrigin: true,              // Cambia el header 'Origin' de la petición
      },
    },
  },
})

