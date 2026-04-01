import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/MAGEPlatform/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@homepage': path.resolve(__dirname, '../homepage/src'),
      '@audio': path.resolve(__dirname, '../audio'),
      '@search': path.resolve(__dirname, '../search'),
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'embla-carousel-react': path.resolve(__dirname, 'node_modules/embla-carousel-react'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
