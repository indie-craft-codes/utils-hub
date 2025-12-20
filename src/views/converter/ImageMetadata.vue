<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import exifr from 'exifr'

const { t } = useI18n()

const file = ref(null)
const preview = ref('')
const isDragging = ref(false)
const loading = ref(false)
const metadata = ref(null)
const exifData = ref(null)
const copied = ref('')

// Google Maps API Key (환경변수에서 가져오기)
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const showMap = ref(false)

// 지도 URL 생성
const mapEmbedUrl = computed(() => {
  if (!exifData.value?.gps || !googleMapsApiKey) return ''
  const { latitude, longitude } = exifData.value.gps
  return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${latitude},${longitude}&zoom=15`
})

const handleFileSelect = (event) => {
  const selectedFile = event.target.files?.[0]
  if (selectedFile) {
    loadFile(selectedFile)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const droppedFile = event.dataTransfer.files?.[0]
  if (droppedFile) {
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

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const isHeic = (file) => {
  const name = file.name.toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif')
}

const loadFile = async (selectedFile) => {
  file.value = selectedFile
  loading.value = true
  metadata.value = null
  exifData.value = null
  preview.value = ''

  try {
    // 기본 파일 정보
    const basicInfo = {
      name: selectedFile.name,
      size: formatSize(selectedFile.size),
      sizeBytes: selectedFile.size,
      type: selectedFile.type || getTypeFromExtension(selectedFile.name),
      lastModified: new Date(selectedFile.lastModified).toLocaleString()
    }

    // EXIF 데이터 추출 (exifr 사용)
    const exif = await extractExifWithExifr(selectedFile)

    // 이미지 크기 정보
    let imageInfo = { width: 0, height: 0, aspectRatio: '0', megapixels: '0' }

    // EXIF에서 이미지 크기 가져오기
    if (exif?.ImageWidth && exif?.ImageHeight) {
      imageInfo = {
        width: exif.ImageWidth,
        height: exif.ImageHeight,
        aspectRatio: (exif.ImageWidth / exif.ImageHeight).toFixed(2),
        megapixels: ((exif.ImageWidth * exif.ImageHeight) / 1000000).toFixed(2)
      }
    } else if (exif?.ExifImageWidth && exif?.ExifImageHeight) {
      imageInfo = {
        width: exif.ExifImageWidth,
        height: exif.ExifImageHeight,
        aspectRatio: (exif.ExifImageWidth / exif.ExifImageHeight).toFixed(2),
        megapixels: ((exif.ExifImageWidth * exif.ExifImageHeight) / 1000000).toFixed(2)
      }
    } else if (!isHeic(selectedFile)) {
      // HEIC가 아닌 경우 Image API로 크기 가져오기
      imageInfo = await getImageInfo(selectedFile)
    }

    metadata.value = { ...basicInfo, ...imageInfo }
    exifData.value = exif

    // 미리보기 생성 (HEIC가 아닌 경우)
    if (!isHeic(selectedFile)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        preview.value = e.target?.result
      }
      reader.readAsDataURL(selectedFile)
    } else {
      // HEIC는 썸네일 추출 시도
      try {
        const thumb = await exifr.thumbnail(selectedFile)
        if (thumb) {
          const blob = new Blob([thumb], { type: 'image/jpeg' })
          preview.value = URL.createObjectURL(blob)
        }
      } catch (e) {
        // 썸네일 없음
      }
    }

  } catch (e) {
    console.error('Failed to extract metadata:', e)
  } finally {
    loading.value = false
  }
}

const getTypeFromExtension = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    tiff: 'image/tiff',
    tif: 'image/tiff'
  }
  return types[ext] || 'image/unknown'
}

const extractExifWithExifr = async (file) => {
  try {
    const exif = await exifr.parse(file, {
      // 모든 메타데이터 추출
      tiff: true,
      exif: true,
      gps: true,
      ifd0: true,
      ifd1: true,
      // HEIC 지원
      icc: false,
      iptc: false,
      xmp: false
    })

    if (!exif) return null

    // 정리된 EXIF 데이터
    const result = {}

    // 카메라 정보
    if (exif.Make) result.make = exif.Make
    if (exif.Model) result.model = exif.Model

    // 촬영 설정
    if (exif.ExposureTime) result.exposureTime = exif.ExposureTime
    if (exif.FNumber) result.fNumber = exif.FNumber
    if (exif.ISO) result.iso = exif.ISO
    if (exif.FocalLength) result.focalLength = exif.FocalLength
    if (exif.FocalLengthIn35mmFormat) result.focalLength35mm = exif.FocalLengthIn35mmFormat

    // 날짜
    if (exif.DateTimeOriginal) {
      result.dateTimeOriginal = formatExifDate(exif.DateTimeOriginal)
    } else if (exif.CreateDate) {
      result.dateTimeOriginal = formatExifDate(exif.CreateDate)
    } else if (exif.ModifyDate) {
      result.dateTime = formatExifDate(exif.ModifyDate)
    }

    // GPS
    if (exif.latitude && exif.longitude) {
      result.gps = {
        latitude: exif.latitude.toFixed(6),
        longitude: exif.longitude.toFixed(6)
      }
    }

    // 이미지 크기
    if (exif.ImageWidth) result.ImageWidth = exif.ImageWidth
    if (exif.ImageHeight) result.ImageHeight = exif.ImageHeight
    if (exif.ExifImageWidth) result.ExifImageWidth = exif.ExifImageWidth
    if (exif.ExifImageHeight) result.ExifImageHeight = exif.ExifImageHeight

    // 렌즈 정보
    if (exif.LensModel) result.lensModel = exif.LensModel

    // 기타
    if (exif.Software) result.software = exif.Software
    if (exif.Orientation) result.orientation = exif.Orientation

    return Object.keys(result).length > 0 ? result : null
  } catch (e) {
    console.error('EXIF parsing error:', e)
    return null
  }
}

const formatExifDate = (date) => {
  if (date instanceof Date) {
    return date.toLocaleString()
  }
  return String(date)
}

const getImageInfo = (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2),
        megapixels: ((img.width * img.height) / 1000000).toFixed(2)
      })
      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      resolve({ width: 0, height: 0, aspectRatio: '0', megapixels: '0' })
      URL.revokeObjectURL(url)
    }

    img.src = url
  })
}

const formatExposure = (value) => {
  if (!value) return null
  if (value >= 1) return `${value}s`
  return `1/${Math.round(1/value)}s`
}

const formatFNumber = (value) => {
  if (!value) return null
  return `f/${value.toFixed(1)}`
}

const formatFocalLength = (value) => {
  if (!value) return null
  return `${value.toFixed(0)}mm`
}

const copy = async (value, key) => {
  try {
    await navigator.clipboard.writeText(String(value))
    copied.value = key
    setTimeout(() => copied.value = '', 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const reset = () => {
  file.value = null
  preview.value = ''
  metadata.value = null
  exifData.value = null
}

const openInMaps = () => {
  if (exifData.value?.gps) {
    const { latitude, longitude } = exifData.value.gps
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
  }
}

// 지원 포맷 목록
const supportedFormats = 'JPEG, PNG, WebP, HEIC, HEIF, TIFF'
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
        {{ t('tools.metadata.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.metadata.description') }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {{ supportedFormats }}
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
          {{ t('tools.metadata.selectFile') }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('tools.metadata.dragDrop') }}
        </span>
        <input type="file" accept="image/*,.heic,.heif" @change="handleFileSelect" class="hidden" />
      </label>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="card text-center py-12">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-gray-600 dark:text-gray-400">{{ t('tools.metadata.loading') }}</p>
    </div>

    <!-- Results -->
    <div v-else class="space-y-6">
      <!-- Preview & File Info -->
      <div class="card">
        <div class="flex items-start gap-6">
          <div class="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
            <img v-if="preview" :src="preview" alt="Preview" class="w-full h-full object-cover" />
            <svg v-else class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {{ metadata.name }}
              </h2>
              <button @click="reset" class="btn btn-secondary text-sm">
                {{ t('tools.metadata.changeFile') }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.fileSize') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.size }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.format') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.type }}</span>
              </div>
              <div v-if="metadata.width > 0">
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.dimensions') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.width }} x {{ metadata.height }}</span>
              </div>
              <div v-if="metadata.megapixels !== '0'">
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.megapixels') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.megapixels }} MP</span>
              </div>
              <div v-if="metadata.aspectRatio !== '0'">
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.aspectRatio') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.aspectRatio }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.lastModified') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.lastModified }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EXIF Data -->
      <div v-if="exifData" class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.metadata.exifData') }}
        </h2>

        <!-- Camera Info -->
        <div v-if="exifData.make || exifData.model || exifData.lensModel" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {{ t('tools.metadata.cameraInfo') }}
          </h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div v-if="exifData.make" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">{{ t('tools.metadata.make') }}</span>
              <span class="text-gray-900 dark:text-white font-medium">{{ exifData.make }}</span>
            </div>
            <div v-if="exifData.model" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">{{ t('tools.metadata.model') }}</span>
              <span class="text-gray-900 dark:text-white font-medium">{{ exifData.model }}</span>
            </div>
            <div v-if="exifData.lensModel" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg col-span-2">
              <span class="text-gray-600 dark:text-gray-400">Lens</span>
              <span class="text-gray-900 dark:text-white font-medium">{{ exifData.lensModel }}</span>
            </div>
          </div>
        </div>

        <!-- Shooting Settings -->
        <div v-if="exifData.exposureTime || exifData.fNumber || exifData.iso || exifData.focalLength" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {{ t('tools.metadata.shootingSettings') }}
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div v-if="exifData.exposureTime" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t('tools.metadata.shutter') }}</p>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatExposure(exifData.exposureTime) }}</p>
            </div>
            <div v-if="exifData.fNumber" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t('tools.metadata.aperture') }}</p>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatFNumber(exifData.fNumber) }}</p>
            </div>
            <div v-if="exifData.iso" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">ISO</p>
              <p class="text-gray-900 dark:text-white font-medium">{{ exifData.iso }}</p>
            </div>
            <div v-if="exifData.focalLength" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t('tools.metadata.focalLength') }}</p>
              <p class="text-gray-900 dark:text-white font-medium">
                {{ formatFocalLength(exifData.focalLength) }}
                <span v-if="exifData.focalLength35mm" class="text-xs text-gray-500">({{ exifData.focalLength35mm }}mm)</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Date/Time -->
        <div v-if="exifData.dateTimeOriginal || exifData.dateTime" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {{ t('tools.metadata.dateTime') }}
          </h3>
          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
            <span class="text-gray-900 dark:text-white">{{ exifData.dateTimeOriginal || exifData.dateTime }}</span>
          </div>
        </div>

        <!-- Software -->
        <div v-if="exifData.software" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Software
          </h3>
          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
            <span class="text-gray-900 dark:text-white">{{ exifData.software }}</span>
          </div>
        </div>

        <!-- GPS -->
        <div v-if="exifData.gps" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {{ t('tools.metadata.gpsInfo') }}
          </h3>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
            <!-- 지도 표시 -->
            <div v-if="googleMapsApiKey && showMap" class="w-full h-64">
              <iframe
                :src="mapEmbedUrl"
                class="w-full h-full border-0"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <!-- API 키 미설정 안내 -->
            <div v-else-if="!googleMapsApiKey" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>{{ t('tools.metadata.mapApiKeyRequired') }}</p>
              <p class="text-xs mt-1 font-mono">VITE_GOOGLE_MAPS_API_KEY</p>
            </div>

            <!-- 지도 표시 버튼 -->
            <div v-else class="p-4 text-center">
              <button @click="showMap = true" class="btn btn-secondary text-sm">
                {{ t('tools.metadata.showMap') }}
              </button>
            </div>

            <!-- 좌표 정보 -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between">
                <div class="text-sm">
                  <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('tools.metadata.coordinates') }}</p>
                  <p class="text-gray-900 dark:text-white font-mono">
                    {{ exifData.gps.latitude }}, {{ exifData.gps.longitude }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="copy(`${exifData.gps.latitude}, ${exifData.gps.longitude}`, 'coords')"
                    class="btn btn-secondary text-sm"
                  >
                    {{ copied === 'coords' ? t('common.copied') : t('common.copy') }}
                  </button>
                  <button @click="openInMaps" class="btn btn-primary text-sm">
                    {{ t('tools.metadata.openMaps') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No EXIF -->
      <div v-else class="card text-center py-8">
        <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.noExif') }}</p>
      </div>
    </div>
  </div>
</template>
