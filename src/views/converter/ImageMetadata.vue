<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const file = ref(null)
const preview = ref('')
const isDragging = ref(false)
const loading = ref(false)
const metadata = ref(null)
const exifData = ref(null)
const copied = ref('')

const handleFileSelect = (event) => {
  const selectedFile = event.target.files?.[0]
  if (selectedFile && selectedFile.type.startsWith('image/')) {
    loadFile(selectedFile)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const droppedFile = event.dataTransfer.files?.[0]
  if (droppedFile && droppedFile.type.startsWith('image/')) {
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

const loadFile = async (selectedFile) => {
  file.value = selectedFile
  loading.value = true
  metadata.value = null
  exifData.value = null

  try {
    // 기본 파일 정보
    const basicInfo = {
      name: selectedFile.name,
      size: formatSize(selectedFile.size),
      sizeBytes: selectedFile.size,
      type: selectedFile.type,
      lastModified: new Date(selectedFile.lastModified).toLocaleString()
    }

    // 이미지 로드 및 크기 정보
    const imageInfo = await getImageInfo(selectedFile)

    // EXIF 데이터 추출
    const exif = await extractExif(selectedFile)

    metadata.value = { ...basicInfo, ...imageInfo }
    exifData.value = exif

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result
    }
    reader.readAsDataURL(selectedFile)

  } catch (e) {
    console.error('Failed to extract metadata:', e)
  } finally {
    loading.value = false
  }
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

// EXIF 데이터 추출 (JPEG/TIFF)
const extractExif = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const buffer = e.target.result
      const exif = parseExif(buffer)
      resolve(exif)
    }

    reader.onerror = () => resolve(null)
    reader.readAsArrayBuffer(file)
  })
}

const parseExif = (buffer) => {
  const view = new DataView(buffer)

  // JPEG 확인
  if (view.getUint16(0) !== 0xFFD8) {
    return null
  }

  let offset = 2
  const length = view.byteLength

  while (offset < length) {
    if (view.getUint8(offset) !== 0xFF) {
      return null
    }

    const marker = view.getUint8(offset + 1)

    // APP1 마커 (EXIF)
    if (marker === 0xE1) {
      const exifOffset = offset + 4
      const exifHeader = String.fromCharCode(
        view.getUint8(exifOffset),
        view.getUint8(exifOffset + 1),
        view.getUint8(exifOffset + 2),
        view.getUint8(exifOffset + 3)
      )

      if (exifHeader === 'Exif') {
        return parseExifData(view, exifOffset + 6)
      }
    }

    // 다음 마커로 이동
    if (marker === 0xD8 || marker === 0xD9) {
      offset += 2
    } else {
      const segmentLength = view.getUint16(offset + 2)
      offset += 2 + segmentLength
    }
  }

  return null
}

const parseExifData = (view, tiffOffset) => {
  try {
    const littleEndian = view.getUint16(tiffOffset) === 0x4949
    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian)

    const exif = {}
    const tags = {
      0x010F: 'make',
      0x0110: 'model',
      0x0112: 'orientation',
      0x011A: 'xResolution',
      0x011B: 'yResolution',
      0x0132: 'dateTime',
      0x829A: 'exposureTime',
      0x829D: 'fNumber',
      0x8827: 'iso',
      0x9003: 'dateTimeOriginal',
      0x9004: 'dateTimeDigitized',
      0x920A: 'focalLength',
      0xA002: 'imageWidth',
      0xA003: 'imageHeight',
      0xA405: 'focalLengthIn35mm'
    }

    const gpsIfdPointer = parseIFD(view, tiffOffset, tiffOffset + ifdOffset, littleEndian, tags, exif)

    // EXIF SubIFD
    if (exif.exifIfdPointer) {
      parseIFD(view, tiffOffset, tiffOffset + exif.exifIfdPointer, littleEndian, tags, exif)
      delete exif.exifIfdPointer
    }

    // GPS IFD
    if (exif.gpsInfoIfdPointer) {
      const gps = parseGPSData(view, tiffOffset, tiffOffset + exif.gpsInfoIfdPointer, littleEndian)
      if (gps) {
        exif.gps = gps
      }
      delete exif.gpsInfoIfdPointer
    }

    return Object.keys(exif).length > 0 ? exif : null
  } catch (e) {
    return null
  }
}

const parseIFD = (view, tiffOffset, ifdOffset, littleEndian, tags, result) => {
  try {
    const numEntries = view.getUint16(ifdOffset, littleEndian)

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12)
      const tag = view.getUint16(entryOffset, littleEndian)
      const type = view.getUint16(entryOffset + 2, littleEndian)
      const numValues = view.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = entryOffset + 8

      // EXIF SubIFD 포인터
      if (tag === 0x8769) {
        result.exifIfdPointer = view.getUint32(valueOffset, littleEndian)
        continue
      }

      // GPS IFD 포인터
      if (tag === 0x8825) {
        result.gpsInfoIfdPointer = view.getUint32(valueOffset, littleEndian)
        continue
      }

      if (!tags[tag]) continue

      const value = readTagValue(view, tiffOffset, type, numValues, valueOffset, littleEndian)
      if (value !== null) {
        result[tags[tag]] = value
      }
    }
  } catch (e) {
    // 파싱 오류 무시
  }
}

const parseGPSData = (view, tiffOffset, ifdOffset, littleEndian) => {
  try {
    const numEntries = view.getUint16(ifdOffset, littleEndian)
    const gps = {}

    const gpsTags = {
      0x0001: 'latitudeRef',
      0x0002: 'latitude',
      0x0003: 'longitudeRef',
      0x0004: 'longitude',
      0x0005: 'altitudeRef',
      0x0006: 'altitude'
    }

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12)
      const tag = view.getUint16(entryOffset, littleEndian)
      const type = view.getUint16(entryOffset + 2, littleEndian)
      const numValues = view.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = entryOffset + 8

      if (!gpsTags[tag]) continue

      if (tag === 0x0002 || tag === 0x0004) {
        // GPS 좌표 (rational 배열)
        const dataOffset = view.getUint32(valueOffset, littleEndian)
        const degrees = view.getUint32(tiffOffset + dataOffset, littleEndian) / view.getUint32(tiffOffset + dataOffset + 4, littleEndian)
        const minutes = view.getUint32(tiffOffset + dataOffset + 8, littleEndian) / view.getUint32(tiffOffset + dataOffset + 12, littleEndian)
        const seconds = view.getUint32(tiffOffset + dataOffset + 16, littleEndian) / view.getUint32(tiffOffset + dataOffset + 20, littleEndian)
        gps[gpsTags[tag]] = degrees + (minutes / 60) + (seconds / 3600)
      } else {
        const value = readTagValue(view, tiffOffset, type, numValues, valueOffset, littleEndian)
        if (value !== null) {
          gps[gpsTags[tag]] = value
        }
      }
    }

    if (gps.latitude && gps.longitude) {
      const lat = gps.latitudeRef === 'S' ? -gps.latitude : gps.latitude
      const lng = gps.longitudeRef === 'W' ? -gps.longitude : gps.longitude
      return { latitude: lat.toFixed(6), longitude: lng.toFixed(6) }
    }

    return null
  } catch (e) {
    return null
  }
}

const readTagValue = (view, tiffOffset, type, numValues, valueOffset, littleEndian) => {
  try {
    switch (type) {
      case 1: // BYTE
      case 7: // UNDEFINED
        return view.getUint8(valueOffset)
      case 2: // ASCII
        const strOffset = numValues > 4 ? view.getUint32(valueOffset, littleEndian) + tiffOffset : valueOffset
        let str = ''
        for (let i = 0; i < numValues - 1; i++) {
          str += String.fromCharCode(view.getUint8(strOffset + i))
        }
        return str.trim()
      case 3: // SHORT
        return view.getUint16(valueOffset, littleEndian)
      case 4: // LONG
        return view.getUint32(valueOffset, littleEndian)
      case 5: // RATIONAL
        const ratOffset = view.getUint32(valueOffset, littleEndian) + tiffOffset
        const numerator = view.getUint32(ratOffset, littleEndian)
        const denominator = view.getUint32(ratOffset + 4, littleEndian)
        return denominator ? (numerator / denominator) : 0
      default:
        return null
    }
  } catch (e) {
    return null
  }
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
        <input type="file" accept="image/*" @change="handleFileSelect" class="hidden" />
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
          <div class="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            <img :src="preview" alt="Preview" class="w-full h-full object-cover" />
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
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.dimensions') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.width }} x {{ metadata.height }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ t('tools.metadata.megapixels') }}:</span>
                <span class="ml-2 text-gray-900 dark:text-white">{{ metadata.megapixels }} MP</span>
              </div>
              <div>
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
        <div v-if="exifData.make || exifData.model" class="mb-6">
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
              <p class="text-gray-900 dark:text-white font-medium">{{ formatFocalLength(exifData.focalLength) }}</p>
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

        <!-- GPS -->
        <div v-if="exifData.gps" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {{ t('tools.metadata.gpsInfo') }}
          </h3>
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="text-sm">
                <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('tools.metadata.coordinates') }}</p>
                <p class="text-gray-900 dark:text-white font-mono">
                  {{ exifData.gps.latitude }}, {{ exifData.gps.longitude }}
                </p>
              </div>
              <button @click="openInMaps" class="btn btn-primary text-sm">
                {{ t('tools.metadata.openMaps') }}
              </button>
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
