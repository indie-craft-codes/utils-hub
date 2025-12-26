<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const text = ref('')
const size = ref(256)
const qrDataUrl = ref('')
const qrSvg = ref('')

const sizes = [128, 256, 512]

watch([text, size], async () => {
  if (!text.value.trim()) {
    qrDataUrl.value = ''
    qrSvg.value = ''
    return
  }

  try {
    qrDataUrl.value = await QRCode.toDataURL(text.value, {
      width: size.value,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    qrSvg.value = await QRCode.toString(text.value, {
      type: 'svg',
      width: size.value,
      margin: 2
    })
  } catch (e) {
    console.error('QR generation failed:', e)
  }
}, { immediate: true })

const downloadPng = () => {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = 'qrcode.png'
  link.href = qrDataUrl.value
  link.click()
}

const downloadSvg = () => {
  if (!qrSvg.value) return
  const blob = new Blob([qrSvg.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'qrcode.svg'
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
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
        {{ t('tools.qrcode.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.qrcode.description') }}
      </p>
    </div>

    <div class="card space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('common.input') }}
        </label>
        <textarea
          v-model="text"
          class="textarea h-24"
          :placeholder="t('tools.qrcode.placeholder')"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.qrcode.size') }}
        </label>
        <div class="flex gap-2">
          <button
            v-for="s in sizes"
            :key="s"
            @click="size = s"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="size === s
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
          >
            {{ s }}px
          </button>
        </div>
      </div>

      <div v-if="qrDataUrl" class="flex flex-col items-center gap-4">
        <div class="p-4 bg-white rounded-xl shadow-inner">
          <img :src="qrDataUrl" alt="QR Code" :width="size" :height="size" class="max-w-full h-auto" />
        </div>

        <div class="flex gap-3">
          <button @click="downloadPng" class="btn btn-primary">
            {{ t('tools.qrcode.downloadPng') }}
          </button>
          <button @click="downloadSvg" class="btn btn-secondary">
            {{ t('tools.qrcode.downloadSvg') }}
          </button>
        </div>
      </div>

      <div v-else class="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p class="text-gray-400">{{ t('tools.qrcode.placeholder') }}</p>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="4567890123" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
