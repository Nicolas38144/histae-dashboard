import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), {
      name: 'histae-development-photo-csp',
      transformIndexHtml(html) {
        return mode === 'development'
          ? html.replace("img-src 'self' data: https:", "img-src 'self' data: https: http://127.0.0.1:8333")
          : html;
      },
    }],
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV),
    },
    server: {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://127.0.0.1:8333; connect-src 'self' ws:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    },
    build: { sourcemap: false },
  };
});
