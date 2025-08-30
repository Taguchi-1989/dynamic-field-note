import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'app/src/main/index.ts',
    preload: 'app/src/main/preload.ts'
  },
  outDir: 'dist-electron',
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['electron'],
  noExternal: [
    'axios',
    'form-data',
    '@supabase/supabase-js',
    '@google/generative-ai',
    'openai',
    'markdown-it',
    'puppeteer-core',
    '@sparticuz/chromium',
    'zod'
  ],
  clean: true,
  shims: true,
  splitting: false,
  bundle: true,
  minify: false,
  sourcemap: true
});