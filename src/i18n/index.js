import { createI18n } from 'vue-i18n'
import ko from './ko.json'
import en from './en.json'

// SSG 환경에서 안전하게 locale 결정
const getDefaultLocale = () => {
  if (typeof window === 'undefined') {
    return 'ko' // SSG 빌드 시 기본값
  }

  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) return savedLocale

  const browserLocale = navigator.language.split('-')[0]
  return browserLocale === 'ko' ? 'ko' : 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    ko,
    en
  }
})

export default i18n
