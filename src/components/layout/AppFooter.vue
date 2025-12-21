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
      <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {{ new Date().getFullYear() }} Utils Hub. All rights reserved.</p>
        <span class="hidden sm:inline">|</span>
        <router-link
          to="/privacy"
          class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {{ safeT('footer.privacy', '개인정보처리방침') }}
        </router-link>
      </div>
    </div>
  </footer>
</template>
