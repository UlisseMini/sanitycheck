// ABOUTME: Extension build-time configuration.
// ABOUTME: BACKEND_URL is injected by esbuild at build time.

declare const __BACKEND_URL__: string;

if (typeof __BACKEND_URL__ === 'undefined') {
  throw new Error('__BACKEND_URL__ must be defined at build time');
}

export const BACKEND_URL = __BACKEND_URL__;
export const DEBUG_MODE = BACKEND_URL.includes('localhost');
