<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import heic2any from 'heic2any'
import AdBanner from '../../components/AdBanner.vue'
import { trackConversion } from '../../utils/analytics'

const { t } = useI18n()

const file = ref(null)
const preview = ref('')
const outputFormat = ref('png')
const quality = ref(0.9)
const convertedUrl = ref('')
const converting = ref(false)
const isDragging = ref(false)
const isHeic = ref(false)
const heicConverting = ref(false)

const formats = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' }
]

// HEIC 파일 확인
const checkIsHeic = (file) => {
  const name = file.name.toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif')
}

const fileInfo = computed(() => {
  if (!file.value) return null
  return {
    name: file.value.name,
    size: formatSize(file.value.size),
    type: file.value.type
  }
})

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const isImageFile = (file) => {
  if (file.type.startsWith('image/')) return true
  if (checkIsHeic(file)) return true
  return false
}

const handleFileSelect = (event) => {
  const selectedFile = event.target.files?.[0]
  if (selectedFile && isImageFile(selectedFile)) {
    loadFile(selectedFile)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const droppedFile = event.dataTransfer.files?.[0]
  if (droppedFile && isImageFile(droppedFile)) {
    loadFile(droppedFile)
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const loadFile = async (selectedFile) => {
  file.value = selectedFile
  convertedUrl.value = ''
  isHeic.value = checkIsHeic(selectedFile)

  if (isHeic.value) {
    // HEIC 파일은 먼저 JPEG로 변환하여 미리보기 생성
    heicConverting.value = true
    try {
      const blob = await heic2any({
        blob: selectedFile,
        toType: 'image/jpeg',
        quality: 0.8
      })
      preview.value = URL.createObjectURL(blob)
    } catch (e) {
      console.error('HEIC conversion failed:', e)
      preview.value = ''
    } finally {
      heicConverting.value = false
    }
  } else {
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result
    }
    reader.readAsDataURL(selectedFile)
  }
}

const convert = async () => {
  if (!preview.value) return

  converting.value = true

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = preview.value
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    const mimeType = `image/${outputFormat.value}`
    const qualityValue = outputFormat.value === 'png' ? undefined : quality.value

    convertedUrl.value = canvas.toDataURL(mimeType, qualityValue)

    // Analytics 추적
    trackConversion('image_convert', {
      from_format: file.value?.type || 'unknown',
      to_format: outputFormat.value,
      quality: qualityValue,
      is_heic: isHeic.value
    })
  } catch (e) {
    console.error('Conversion failed:', e)
  } finally {
    converting.value = false
  }
}

const download = () => {
  if (!convertedUrl.value) return

  const link = document.createElement('a')
  const originalName = file.value?.name.replace(/\.[^/.]+$/, '') || 'image'
  link.download = `${originalName}.${outputFormat.value}`
  link.href = convertedUrl.value
  link.click()
}

const reset = () => {
  file.value = null
  preview.value = ''
  convertedUrl.value = ''
  isHeic.value = false
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.converter.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.converter.description') }}
      </p>
    </div>

    <!-- Upload Area -->
    <div
      v-if="!file"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      class="card border-2 border-dashed transition-colors cursor-pointer"
      :class="isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'"
    >
      <label class="flex flex-col items-center justify-center py-12 cursor-pointer">
        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('tools.converter.selectFile') }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('tools.converter.dragDrop') }}
        </span>
        <input type="file" accept="image/*,.heic,.heif" @change="handleFileSelect" class="hidden" />
      </label>
    </div>

    <!-- HEIC Converting -->
    <div v-else-if="heicConverting" class="card text-center py-12">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-gray-600 dark:text-gray-400">{{ t('tools.converter.heicConverting') }}</p>
    </div>

    <!-- Preview & Convert -->
    <div v-else-if="file" class="space-y-6">
      <!-- File Info -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <img v-if="preview" :src="preview" alt="Preview" class="w-full h-full object-cover" />
              <span v-else class="text-2xl">📷</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ fileInfo.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ fileInfo.size }} - {{ fileInfo.type }}
              </p>
            </div>
          </div>
          <button @click="reset" class="btn btn-secondary">
            Change
          </button>
        </div>
      </div>

      <!-- Options -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Conversion Options
        </h3>
        <div class="grid sm:grid-cols-2 gap-6">
          <!-- Format -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tools.converter.outputFormat') }}
            </label>
            <select v-model="outputFormat" class="input">
              <option v-for="format in formats" :key="format.value" :value="format.value">
                {{ format.label }}
              </option>
            </select>
          </div>

          <!-- Quality -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tools.converter.quality') }}: {{ Math.round(quality * 100) }}%
            </label>
            <input
              v-model="quality"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              class="w-full"
              :disabled="outputFormat === 'png'"
            />
            <p v-if="outputFormat === 'png'" class="text-xs text-gray-500 mt-1">
              PNG is lossless, quality setting not applicable
            </p>
          </div>
        </div>

        <div class="mt-6">
          <button
            @click="convert"
            :disabled="converting"
            class="btn btn-primary w-full sm:w-auto"
          >
            <span v-if="converting" class="flex items-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </span>
            <span v-else>{{ t('tools.converter.convert') }}</span>
          </button>
        </div>
      </div>

      <!-- Result -->
      <div v-if="convertedUrl" class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('common.result') }}
        </h3>
        <div class="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img :src="convertedUrl" alt="Converted" class="max-h-96 object-contain" />
        </div>
        <button @click="download" class="btn btn-primary">
          {{ t('common.download') }}
        </button>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="4567890123" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
