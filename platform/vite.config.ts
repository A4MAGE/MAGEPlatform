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
    },
  },
  build: {
    // shader-park (inside mage) builds GLSL by running eval() on strings
    // that reference identifiers like `input`, `sdBox`, `time` — those
    // identifiers are defined as local functions inside sculptToGLSL.
    //
    // A bundler cannot see inside eval'd strings, so it thinks those
    // locals are unused and either renames (mangle) or deletes (compress
    // dead-code) them. Both break shader-park at runtime with
    //   ReferenceError: input is not defined
    // in the production build. Dev mode is fine because it skips minify.
    //
    // Fix: use terser with mangle OFF and compress's dead-code passes OFF
    // so identifiers survive. Whitespace stripping and safe rewrites still
    // run, so the bundle stays small enough for GitHub Pages.
    // Rollup tree-shaking strips nested functions inside sculptToGLSL
    // (input, input2D, test, noLighting, etc.) because their only callers
    // live inside eval'd strings that the bundler cannot see. Without this,
    // the production build crashes with ReferenceError: input is not defined
    // on the Player page. Dev mode is unaffected because it skips bundling.
    rollupOptions: {
      treeshake: false,
    },
    // terser with mangle + compress's dead-code passes OFF so anything that
    // survives tree-shake-off also survives minification. Identifiers are
    // still referenced by name inside eval'd strings at runtime.
    minify: 'terser',
    terserOptions: {
      mangle: false,
      compress: {
        unused: false,
        dead_code: false,
        reduce_vars: false,
        collapse_vars: false,
      },
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
