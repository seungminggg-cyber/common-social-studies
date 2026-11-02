import { defineConfig } from 'vite';

// GitHub Pages 주소가 /common-social-studies/ 아래에 있어서 base를 맞춰줍니다.
export default defineConfig({
  base: '/common-social-studies/',
  build: { chunkSizeWarningLimit: 1000 },
});
