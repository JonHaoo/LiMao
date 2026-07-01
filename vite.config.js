import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3333,
    open: false,
    proxy: {
      '/api': 'http://localhost:3001',
      '/admin': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['echarts'],
  },
});
