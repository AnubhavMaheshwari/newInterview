import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.{js,jsx,ts,tsx}'],
    }),
    tailwindcss(),
  ],
  esbuild: {
    loader: 'jsx',
    // Treat .js files under src/ as JSX (Windows + POSIX paths)
    include: /src[\\/].*\.[jt]sx?$/,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
});

