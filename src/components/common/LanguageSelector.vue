<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' }
]

const changeLocale = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="changeLocale(lang.code)"
      class="px-2 py-1 text-sm rounded transition-colors"
      :class="locale === lang.code
        ? 'bg-primary-600 text-white'
        : 'hover:bg-gray-200 dark:hover:bg-gray-700'"
    >
      {{ lang.label }}
    </button>
  </div>
</template>
