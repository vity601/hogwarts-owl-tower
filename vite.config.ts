import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 这一行是为了确保网页在 GitHub Pages 上路径不报错
});
