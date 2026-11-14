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
    // Prometheus metrics live outside /v1 (Monitoring page).
    '/metrics': { target: apiTarget, changeOrigin: false, xfwd: true },
  };

  const securityHeaders = { 'Referrer-Policy': 'no-referrer' };

  return {
    plugins: [react()],
    define: { __STUDIO_VERSION__: JSON.stringify(pkg.version) },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // Same Referrer-Policy as the Docker image (docker/40-axentra-studio.sh) and index.html.
    server: { port: 5173, strictPort: false, proxy, headers: securityHeaders },
    preview: { port: 4173, proxy, headers: securityHeaders },
    build: {
      target: 'es2022',
      // No source maps in the production build (assessment C-04): nginx would serve every
      // `.map` next to its chunk. `npm run dev` has them; for a debuggable build run
      // `npx vite build --sourcemap`.
      sourcemap: false,
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
      // The transformed-module cache on disk (node_modules/.vitest-cache) bakes the result of
      // `import.meta.glob` into the cached module: a new locale namespace or help article was
      // missing until the cache was deleted. Transforms are a small share of the run.
      fsModuleCache: false,
      // jsdom + userEvent tests take several seconds when the machine is busy (CI runners,
      // parallel e2e); the 5 s default made about 37 of them flaky under load.
      testTimeout: 10_000,
    },
  };
});
