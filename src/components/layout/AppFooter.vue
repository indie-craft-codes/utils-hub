<script setup>
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}
</script>

<template>
  <footer class="border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <router-link
            to="/about"
            class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ safeT('footer.about', '소개') }}
          </router-link>
          <span class="hidden sm:inline">|</span>
          <router-link
            to="/contact"
            class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ safeT('footer.contact', '문의하기') }}
          </router-link>
          <span class="hidden sm:inline">|</span>
          <router-link
            to="/terms"
            class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ safeT('footer.terms', '이용약관') }}
          </router-link>
          <span class="hidden sm:inline">|</span>
          <router-link
            to="/privacy"
            class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ safeT('footer.privacy', '개인정보처리방침') }}
          </router-link>
        </div>
        <p>&copy; {{ new Date().getFullYear() }} Utils Hub. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
