// Vite settings. The React plugin lets Vite understand .jsx files.
// The PWA plugin gets added on Day 4.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
