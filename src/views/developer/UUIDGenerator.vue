<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const uuids = ref([])
const count = ref(5)
const copied = ref('')

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const generate = () => {
  uuids.value = [generateUUID()]
}

const generateMultiple = () => {
  uuids.value = Array.from({ length: count.value }, () => generateUUID())
}

const copyOne = async (uuid) => {
  try {
    await navigator.clipboard.writeText(uuid)
    copied.value = uuid
    setTimeout(() => copied.value = '', 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(uuids.value.join('\n'))
    copied.value = 'all'
    setTimeout(() => copied.value = '', 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

// 초기 생성
generate()
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
        {{ t('tools.uuid.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.uuid.description') }}
      </p>
    </div>

    <div class="card space-y-6">
      <div class="flex flex-wrap gap-3">
        <button @click="generate" class="btn btn-primary">
          {{ t('tools.uuid.generate') }}
        </button>

        <div class="flex items-center gap-2">
          <input
            v-model.number="count"
            type="number"
            min="1"
            max="100"
            class="input w-20 text-center"
          />
          <button @click="generateMultiple" class="btn btn-secondary">
            {{ t('tools.uuid.generateMultiple') }}
          </button>
        </div>
      </div>

      <div v-if="uuids.length > 0" class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ uuids.length }} UUID(s)
          </span>
          <button
            v-if="uuids.length > 1"
            @click="copyAll"
            class="btn btn-secondary text-sm py-1 px-3"
          >
            {{ copied === 'all' ? t('common.copied') : t('tools.uuid.copyAll') }}
          </button>
        </div>

        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(uuid, index) in uuids"
            :key="index"
            class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
          >
            <code class="flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
              {{ uuid }}
            </code>
            <button
              @click="copyOne(uuid)"
              class="btn btn-secondary text-sm py-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {{ copied === uuid ? t('common.copied') : t('common.copy') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789012" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
