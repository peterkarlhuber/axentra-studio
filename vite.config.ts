/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// The dev and preview servers proxy `/v1` to a running Axentra so the Studio can use
// same-origin cookies and CSRF headers exactly like in production behind a reverse proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.AXENTRA_API_URL || process.env.AXENTRA_API_URL || 'http://127.0.0.1:8080';
  const proxy: Record<string, ProxyOptions> = {
    '/v1': { target: apiTarget, changeOrigin: false, xfwd: true },
  };

  return {
    plugins: [react()],
    define: { __STUDIO_VERSION__: JSON.stringify(pkg.version) },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: false, proxy },
    preview: { port: 4173, proxy },
    build: {
      target: 'es2022',
      sourcemap: true,
      chunkSizeWarningLimit: 900,
      // Never inline fonts as data: URLs, so the production CSP can keep `font-src 'self'`.
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
      restoreMocks: true,
    },
  };
});
