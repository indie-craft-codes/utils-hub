import { ViteSSG } from 'vite-ssg'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import { routes, setupRouter } from './router'
import i18n from './i18n'
import './style.css'

// Initialize dark mode (클라이언트에서만 실행)
const initDarkMode = () => {
  if (typeof window === 'undefined') return

  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL
  },
  ({ app, router, isClient }) => {
    // Install plugins
    app.use(i18n)

    // Head 관리 (SEO 메타 태그)
    const head = createHead()
    app.use(head)

    // Router 설정 (analytics)
    setupRouter(router)

    // 클라이언트에서만 다크모드 초기화
    if (isClient) {
      initDarkMode()

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          if (e.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      })
    }
  }
)
