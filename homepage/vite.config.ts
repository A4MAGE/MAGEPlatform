import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // shader-park (inside @notrac/mage) eval()s GLSL strings that reference
    // identifiers defined as local functions. Bundler mangling/dead-code
    // elimination renames or removes them, breaking the engine at runtime.
    rollupOptions: {
      treeshake: false,
    },
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
})
