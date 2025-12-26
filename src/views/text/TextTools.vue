<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CryptoJS from 'crypto-js'
import AdBanner from '../../components/AdBanner.vue'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

const inputText = ref('')
const outputText = ref('')
const copied = ref(false)
const selectedTool = ref('base64Encode')

const tools = [
  { id: 'base64Encode', category: 'encoding' },
  { id: 'base64Decode', category: 'encoding' },
  { id: 'urlEncode', category: 'encoding' },
  { id: 'urlDecode', category: 'encoding' },
  { id: 'md5', category: 'hash' },
  { id: 'sha256', category: 'hash' },
  { id: 'uppercase', category: 'case' },
  { id: 'lowercase', category: 'case' }
]

const stats = computed(() => {
  const text = inputText.value
  return {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0
  }
})

watch([inputText, selectedTool], () => {
  if (inputText.value) {
    trackToolUsage('text_transform', { tool: selectedTool.value, input_length: inputText.value.length })
  }
  transform()
})

const transform = () => {
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    switch (selectedTool.value) {
      case 'base64Encode':
        outputText.value = btoa(unescape(encodeURIComponent(inputText.value)))
        break
      case 'base64Decode':
        outputText.value = decodeURIComponent(escape(atob(inputText.value)))
        break
      case 'urlEncode':
        outputText.value = encodeURIComponent(inputText.value)
        break
      case 'urlDecode':
        outputText.value = decodeURIComponent(inputText.value)
        break
      case 'md5':
        outputText.value = CryptoJS.MD5(inputText.value).toString()
        break
      case 'sha256':
        outputText.value = CryptoJS.SHA256(inputText.value).toString()
        break
      case 'uppercase':
        outputText.value = inputText.value.toUpperCase()
        break
      case 'lowercase':
        outputText.value = inputText.value.toLowerCase()
        break
      default:
        outputText.value = inputText.value
    }
  } catch (e) {
    outputText.value = `Error: ${e.message}`
  }
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const clear = () => {
  inputText.value = ''
  outputText.value = ''
}

const swap = () => {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
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
        {{ t('tools.text.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.text.description') }}
      </p>
    </div>

    <!-- Tool Selection -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="selectedTool = tool.id"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="selectedTool === tool.id
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          {{ t(`tools.text.${tool.id}`) }}
        </button>
      </div>
    </div>

    <!-- Editor Grid -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Input -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('common.input') }}
          </h2>
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ t('tools.text.charCount') }}: {{ stats.chars }}</span>
            <span>{{ t('tools.text.wordCount') }}: {{ stats.words }}</span>
            <span>{{ t('tools.text.lineCount') }}: {{ stats.lines }}</span>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="textarea font-mono text-sm h-80"
          placeholder="Enter text here..."
        ></textarea>
      </div>

      <!-- Output -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('common.output') }}
          </h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="copyOutput"
              class="btn btn-secondary text-sm py-1 px-3"
            >
              {{ copied ? t('common.copied') : t('common.copy') }}
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          readonly
          class="textarea font-mono text-sm h-80 bg-gray-50 dark:bg-gray-700/50"
          placeholder="Output will appear here..."
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-center gap-4 mt-6">
      <button @click="swap" class="btn btn-secondary flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        Swap
      </button>
      <button @click="clear" class="btn btn-secondary">
        {{ t('common.clear') }}
      </button>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="5678901234" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
