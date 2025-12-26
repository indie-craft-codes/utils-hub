<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const min = ref(1)
const max = ref(100)
const numCount = ref(1)
const allowDuplicate = ref(false)
const numbers = ref([])

const generateNumbers = () => {
  const range = max.value - min.value + 1

  if (allowDuplicate.value) {
    numbers.value = Array.from({ length: numCount.value }, () =>
      Math.floor(Math.random() * range) + min.value
    )
  } else {
    if (numCount.value > range) {
      alert(t('tools.numberPicker.rangeError'))
      return
    }

    const pool = Array.from({ length: range }, (_, i) => min.value + i)
    const result = []

    for (let i = 0; i < numCount.value; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      result.push(pool[idx])
      pool.splice(idx, 1)
    }

    numbers.value = result
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.numberPicker.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.numberPicker.description') }}
      </p>
    </div>

    <div class="card space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('tools.numberPicker.min') }}
          </label>
          <input v-model.number="min" type="number" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('tools.numberPicker.max') }}
          </label>
          <input v-model.number="max" type="number" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('tools.numberPicker.count') }}
          </label>
          <input v-model.number="numCount" type="number" min="1" class="input" />
        </div>
      </div>

      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="allowDuplicate" type="checkbox" class="w-4 h-4 rounded" />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {{ t('tools.numberPicker.allowDuplicate') }}
        </span>
      </label>

      <button @click="generateNumbers" class="btn btn-primary w-full">
        {{ t('tools.numberPicker.generate') }}
      </button>

      <div v-if="numbers.length > 0" class="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
        <div class="flex flex-wrap justify-center gap-3">
          <span
            v-for="(num, idx) in numbers"
            :key="idx"
            class="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xl font-bold"
          >
            {{ num }}
          </span>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="2345678901" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
