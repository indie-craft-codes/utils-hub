<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  toolKey: {
    type: String,
    required: true
  }
})

const { t, te } = useI18n()

const hasGuide = (key) => te(`tools.${props.toolKey}.guide.${key}`)
const getGuide = (key, fallback = []) => {
  const fullKey = `tools.${props.toolKey}.guide.${key}`
  return te(fullKey) ? t(fullKey) : fallback
}
const getGuideItems = (key) => {
  const items = getGuide(key, [])
  return Array.isArray(items) ? items : []
}
</script>

<template>
  <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
    <!-- 사용법 -->
    <section v-if="hasGuide('howToUse')" class="mb-8">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ t('guide.howToUse') }}
      </h2>
      <ol class="space-y-3">
        <li
          v-for="(step, index) in getGuideItems('howToUse')"
          :key="index"
          class="flex gap-3 text-gray-600 dark:text-gray-400"
        >
          <span class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
            {{ index + 1 }}
          </span>
          <span>{{ step }}</span>
        </li>
      </ol>
    </section>

    <!-- 팁 -->
    <section v-if="hasGuide('tips')" class="mb-8">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {{ t('guide.tips') }}
      </h2>
      <ul class="space-y-2">
        <li
          v-for="(tip, index) in getGuideItems('tips')"
          :key="index"
          class="flex gap-2 text-gray-600 dark:text-gray-400"
        >
          <span class="text-yellow-500">•</span>
          <span>{{ tip }}</span>
        </li>
      </ul>
    </section>

    <!-- FAQ -->
    <section v-if="hasGuide('faq')">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ t('guide.faq') }}
      </h2>
      <div class="space-y-4">
        <div
          v-for="(item, index) in getGuideItems('faq')"
          :key="index"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
        >
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">{{ item.q }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.a }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
