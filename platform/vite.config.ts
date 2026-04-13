import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@homepage': path.resolve(__dirname, '../homepage/src'),
      '@audio': path.resolve(__dirname, '../audio'),
      '@search': path.resolve(__dirname, '../search'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js'),
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'embla-carousel-react': path.resolve(__dirname, 'node_modules/embla-carousel-react'),
      '@fontsource/michroma': path.resolve(__dirname, 'node_modules/@fontsource/michroma'),
      '@fontsource/anta': path.resolve(__dirname, 'node_modules/@fontsource/anta'),
      'mage': path.resolve(__dirname, 'node_modules/mage/dist/mage-engine.js'), // Fix for errors with importing MAGE engine from file.
    },
  },
  build: {
    // shader-park (inside mage) builds GLSL via eval() on strings that
    // reference identifiers like `input`, `sdBox`, `time`. esbuild's
    // minifier mangles local variable names, which breaks those eval'd
    // lookups — works in dev, ReferenceError in production build.
    // terser with mangle:false preserves names but still removes dead code
    // and whitespace, so the bundle stays small and shader-park survives.
    minify: 'terser',
    terserOptions: {
      mangle: false,
    },
  },
  optimizeDeps: {
    exclude: ['mage'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
