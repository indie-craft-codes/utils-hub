import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Initialize dark mode based on system preference
const initDarkMode = () => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

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

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
