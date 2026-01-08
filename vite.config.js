import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 커스텀 도메인 사용 시 '/'로 설정
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  ssr: {
    // SSR에서 문제가 되는 라이브러리들을 external로 처리
    noExternal: ['vue-i18n', '@vueuse/head']
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: {
      reduceInlineStyles: false,
    },
    // 클라이언트 전용 컴포넌트가 있는 페이지는 제외
    includedRoutes(paths) {
      // 문제가 있는 페이지들은 SSG에서 제외 (클라이언트에서 렌더링)
      const excludeRoutes = [
        '/converter/image',      // heic2any 사용
        '/developer/erd',        // node-sql-parser 사용
        '/games/ladder',         // html2canvas, gif.js 사용
        '/games/roulette',       // html2canvas 사용
        '/converter/metadata'    // exifr 사용
      ]
      return paths.filter(path => !excludeRoutes.includes(path))
    },
    onBeforePageRender(route, indexHTML) {
      return indexHTML
    }
  }
})
