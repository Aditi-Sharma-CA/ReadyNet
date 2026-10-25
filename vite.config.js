// Vite settings.
//  - react(): lets Vite understand .jsx files
//  - VitePWA(): makes ReadyNet an installable app (HANDOVER.md section 10).
//    It writes the app manifest (name, icons, colors) and a "service worker" that
//    saves the app on the phone, so it opens even with no signal after the first visit.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // new versions install themselves
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'ReadyNet',
        short_name: 'ReadyNet',
        description: 'Disaster check-in for Milpitas residents, CERT volunteers and first responders.',
        start_url: '/',
        display: 'standalone', // opens full-screen, without browser bars
        theme_color: '#0B1620',
        background_color: '#F4F6F8',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Save the app shell, fonts and icons on the phone (map pictures still need internet)
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
        navigateFallback: '/index.html', // /responder also opens offline
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
