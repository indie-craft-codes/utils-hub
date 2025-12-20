import { createI18n } from 'vue-i18n'
import ko from './ko.json'
import en from './en.json'

const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language.split('-')[0]
const defaultLocale = savedLocale || (browserLocale === 'ko' ? 'ko' : 'en')

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    ko,
    en
  }
})

export default i18n
