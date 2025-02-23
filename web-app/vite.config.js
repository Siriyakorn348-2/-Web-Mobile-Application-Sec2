import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/Web-Mobile-Application-Sec2", 
  server: {
    historyApiFallback: true, 
  }
})
