<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const copied = ref(false)

const isValid = computed(() => {
  if (!inputJson.value.trim()) return null
  try {
    JSON.parse(inputJson.value)
    return true
  } catch {
    return false
  }
})

watch(inputJson, () => {
  error.value = ''
  outputJson.value = ''
})

const format = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed, null, 2)
    error.value = ''
    trackToolUsage('json_format', { size: inputJson.value.length })
  } catch (e) {
    error.value = e.message
    outputJson.value = ''
  }
}

const minify = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
    error.value = ''
    trackToolUsage('json_minify', { size: inputJson.value.length })
  } catch (e) {
    error.value = e.message
    outputJson.value = ''
  }
}

const validate = () => {
  try {
    JSON.parse(inputJson.value)
    error.value = ''
    outputJson.value = t('tools.json.valid')
    trackToolUsage('json_validate', { size: inputJson.value.length })
  } catch (e) {
    error.value = e.message
    outputJson.value = ''
  }
}

const clear = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputJson.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    inputJson.value = e.target?.result
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.json.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.json.description') }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-3 mb-6">
      <button @click="format" :disabled="!inputJson.trim()" class="btn btn-primary disabled:opacity-50">
        {{ t('tools.json.format') }}
      </button>
      <button @click="minify" :disabled="!inputJson.trim()" class="btn btn-secondary disabled:opacity-50">
        {{ t('tools.json.minify') }}
      </button>
      <button @click="validate" :disabled="!inputJson.trim()" class="btn btn-secondary disabled:opacity-50">
        {{ t('tools.json.validate') }}
      </button>
      <button @click="clear" class="btn btn-secondary">
        {{ t('common.clear') }}
      </button>
      <label class="btn btn-secondary cursor-pointer">
        <input type="file" accept=".json,.txt" @change="handleFileUpload" class="hidden" />
        Upload File
      </label>
    </div>

    <!-- Editor Grid -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Input -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('common.input') }}
          </h2>
          <div v-if="isValid !== null" class="flex items-center gap-2">
            <span v-if="isValid" class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Valid
            </span>
            <span v-else class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Invalid
            </span>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="textarea font-mono text-sm h-96"
          :placeholder="t('tools.json.placeholder')"
        ></textarea>
      </div>

      <!-- Output -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('common.output') }}
          </h2>
          <button
            v-if="outputJson && !error"
            @click="copyOutput"
            class="btn btn-secondary text-sm py-1 px-3"
          >
            {{ copied ? t('common.copied') : t('common.copy') }}
          </button>
        </div>
        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p class="text-red-600 dark:text-red-400 font-mono text-sm break-all">
            {{ error }}
          </p>
        </div>
        <pre
          v-else-if="outputJson"
          class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-auto h-96 font-mono text-sm text-gray-900 dark:text-gray-100"
        >{{ outputJson }}</pre>
        <div v-else class="h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400">
          Output will appear here
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789012" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
