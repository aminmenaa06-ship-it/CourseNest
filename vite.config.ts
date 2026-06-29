import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Served from "/" during local dev, and from "/CourseNest/" on GitHub Pages.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/CourseNest/' : '/',
  plugins: [react(), tailwindcss()],
}))
