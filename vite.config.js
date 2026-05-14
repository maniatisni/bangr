import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev (npm run dev): base is '/', app is at http://127.0.0.1:5173/
// In prod (npm run build): base is '/bangr/', app is at https://maniatisni.github.io/bangr/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/bangr/' : '/',
}))
