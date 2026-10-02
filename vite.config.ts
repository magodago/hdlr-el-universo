import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * La base apunta a la subruta de GitHub Pages en el build de produccion.
 * En desarrollo se sirve desde la raiz para que las rutas sean comodas.
 * Para cambiarla sin tocar el archivo: `npm run build -- --base=/otra-ruta/`.
 */
export default defineConfig(({ command, isPreview }) => ({
  // En desarrollo se sirve desde la raiz. En build y en preview se usa la subruta
  // de GitHub Pages, que es la que queda grabada en los assets.
  base: command === 'build' || isPreview ? '/hdlr-el-universo/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2019',
  },
}));
