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
    target: 'es2020',
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('gsap') || id.includes('lenis')) {
            return 'vendor-anim';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [],
  },
});
