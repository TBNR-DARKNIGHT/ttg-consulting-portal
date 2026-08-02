import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Keeps the HMR client targeting the same port the browser already uses (helps behind
    // some proxies / Windows setups where the default WS URL is wrong).
    hmr: {
      protocol: 'ws',
      port: 5173,
      clientPort: 5173,
    },
  },
  build: {
    // Mux bundles the HLS playback engine as a large lazy-loaded vendor chunk. Keep the warning
    // budget above that known player chunk while still low enough to catch accidental app bloat.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll('\\', '/');
          if (!normalized.includes('/node_modules/')) return;
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (
            normalized.includes('/node_modules/@tanstack/react-router/') ||
            normalized.includes('/node_modules/@tanstack/router-core/') ||
            normalized.includes('/node_modules/@tanstack/react-query/')
          ) {
            return 'vendor-tanstack';
          }
          if (normalized.includes('/node_modules/@clerk/')) {
            return 'vendor-auth';
          }
          if (
            normalized.includes('/node_modules/@mux/') ||
            normalized.includes('/node_modules/castable-video/') ||
            normalized.includes('/node_modules/ce-la-react/') ||
            normalized.includes('/node_modules/custom-media-element/') ||
            normalized.includes('/node_modules/hls.js/') ||
            normalized.includes('/node_modules/media-chrome/') ||
            normalized.includes('/node_modules/media-tracks/') ||
            normalized.includes('/node_modules/mux-embed/') ||
            normalized.includes('/node_modules/player.style/')
          ) {
            return 'vendor-media';
          }
          if (
            normalized.includes('/node_modules/react-pdf/') ||
            normalized.includes('/node_modules/pdfjs-dist/')
          ) {
            return 'vendor-pdf';
          }
          if (normalized.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (
            normalized.includes('/node_modules/@radix-ui/') ||
            normalized.includes('/node_modules/radix-ui/') ||
            normalized.includes('/node_modules/aria-hidden/') ||
            normalized.includes('/node_modules/class-variance-authority/') ||
            normalized.includes('/node_modules/tailwind-merge/') ||
            normalized.includes('/node_modules/clsx/') ||
            normalized.includes('/node_modules/get-nonce/') ||
            normalized.includes('/node_modules/react-remove-scroll/') ||
            normalized.includes('/node_modules/react-remove-scroll-bar/') ||
            normalized.includes('/node_modules/react-style-singleton/') ||
            normalized.includes('/node_modules/sonner/') ||
            normalized.includes('/node_modules/use-callback-ref/') ||
            normalized.includes('/node_modules/use-sidecar/')
          ) {
            return 'vendor-ui';
          }
          if (
            normalized.includes('/node_modules/dequal/') ||
            normalized.includes('/node_modules/goober/') ||
            normalized.includes('/node_modules/js-cookie/') ||
            normalized.includes('/node_modules/seroval/') ||
            normalized.includes('/node_modules/seroval-plugins/') ||
            normalized.includes('/node_modules/std-env/') ||
            normalized.includes('/node_modules/zod/') ||
            normalized.includes('/node_modules/zod-validation-error/')
          ) {
            return 'vendor-auth';
          }
          return 'vendor-misc';
        },
      },
    },
  },
});
