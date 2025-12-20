import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 커스텀 도메인 사용 시 '/'로 설정
  base: '/',
})
