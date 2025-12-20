<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const activeTab = ref('length')
const inputValue = ref('')
const fromUnit = ref('')
const toUnit = ref('')

const tabs = ['length', 'weight', 'temperature', 'data']

// 단위 정의
const units = {
  length: {
    mm: { name: 'mm', factor: 0.001 },
    cm: { name: 'cm', factor: 0.01 },
    m: { name: 'm', factor: 1 },
    km: { name: 'km', factor: 1000 },
    inch: { name: 'inch', factor: 0.0254 },
    ft: { name: 'ft', factor: 0.3048 },
    yd: { name: 'yd', factor: 0.9144 },
    mile: { name: 'mile', factor: 1609.344 }
  },
  weight: {
    mg: { name: 'mg', factor: 0.000001 },
    g: { name: 'g', factor: 0.001 },
    kg: { name: 'kg', factor: 1 },
    ton: { name: 't', factor: 1000 },
    oz: { name: 'oz', factor: 0.0283495 },
    lb: { name: 'lb', factor: 0.453592 }
  },
  temperature: {
    celsius: { name: '°C' },
    fahrenheit: { name: '°F' },
    kelvin: { name: 'K' }
  },
  data: {
    b: { name: 'B', factor: 1 },
    kb: { name: 'KB', factor: 1024 },
    mb: { name: 'MB', factor: 1024 ** 2 },
    gb: { name: 'GB', factor: 1024 ** 3 },
    tb: { name: 'TB', factor: 1024 ** 4 },
    pb: { name: 'PB', factor: 1024 ** 5 }
  }
}

// 탭 변경 시 기본 단위 설정
const setDefaultUnits = () => {
  const unitKeys = Object.keys(units[activeTab.value])
  fromUnit.value = unitKeys[0]
  toUnit.value = unitKeys[1] || unitKeys[0]
  inputValue.value = ''
}

// 초기 설정
setDefaultUnits()

const currentUnits = computed(() => units[activeTab.value])

const switchTab = (tab) => {
  activeTab.value = tab
  setDefaultUnits()
}

const swapUnits = () => {
  const temp = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = temp
}

// 변환 계산
const result = computed(() => {
  if (!inputValue.value || isNaN(parseFloat(inputValue.value))) {
    return ''
  }

  const value = parseFloat(inputValue.value)

  if (activeTab.value === 'temperature') {
    return convertTemperature(value, fromUnit.value, toUnit.value)
  }

  // 일반 단위 변환 (기준 단위로 변환 후 목표 단위로 변환)
  const fromFactor = units[activeTab.value][fromUnit.value].factor
  const toFactor = units[activeTab.value][toUnit.value].factor
  const baseValue = value * fromFactor
  const converted = baseValue / toFactor

  return formatNumber(converted)
})

const convertTemperature = (value, from, to) => {
  if (from === to) return formatNumber(value)

  let celsius

  // 먼저 섭씨로 변환
  switch (from) {
    case 'celsius':
      celsius = value
      break
    case 'fahrenheit':
      celsius = (value - 32) * 5 / 9
      break
    case 'kelvin':
      celsius = value - 273.15
      break
  }

  // 섭씨에서 목표 단위로 변환
  switch (to) {
    case 'celsius':
      return formatNumber(celsius)
    case 'fahrenheit':
      return formatNumber(celsius * 9 / 5 + 32)
    case 'kelvin':
      return formatNumber(celsius + 273.15)
  }
}

const formatNumber = (num) => {
  if (Number.isInteger(num)) {
    return num.toString()
  }
  // 소수점 이하 불필요한 0 제거
  return parseFloat(num.toPrecision(10)).toString()
}

const copied = ref(false)

const copyResult = async () => {
  if (!result.value) return

  try {
    await navigator.clipboard.writeText(result.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
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
        {{ t('tools.unit.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.unit.description') }}
      </p>
    </div>

    <!-- 탭 -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="switchTab(tab)"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === tab
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          {{ t(`tools.unit.tabs.${tab}`) }}
        </button>
      </div>

      <!-- 변환 UI -->
      <div class="space-y-4">
        <!-- From -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.unit.from') }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="inputValue"
              type="number"
              class="input flex-1 font-mono"
              :placeholder="t('tools.unit.inputPlaceholder')"
            />
            <select v-model="fromUnit" class="input w-24">
              <option v-for="(unit, key) in currentUnits" :key="key" :value="key">
                {{ unit.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 스왑 버튼 -->
        <div class="flex justify-center">
          <button
            @click="swapUnits"
            class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <!-- To -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.unit.to') }}
          </label>
          <div class="flex gap-2">
            <div class="input flex-1 font-mono bg-gray-50 dark:bg-gray-700/50 flex items-center">
              <span class="flex-1">{{ result || '-' }}</span>
              <button
                v-if="result"
                @click="copyResult"
                class="text-xs text-primary-600 hover:text-primary-700 ml-2"
              >
                {{ copied ? '✓' : t('common.copy') }}
              </button>
            </div>
            <select v-model="toUnit" class="input w-24">
              <option v-for="(unit, key) in currentUnits" :key="key" :value="key">
                {{ unit.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 빠른 참조 -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ t('tools.unit.quickRef') }}
      </h2>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <template v-if="activeTab === 'length'">
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 inch = 2.54 cm</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 ft = 30.48 cm</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 mile = 1.609 km</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 m = 100 cm</div>
        </template>
        <template v-else-if="activeTab === 'weight'">
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 kg = 1000 g</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 lb = 453.6 g</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 oz = 28.35 g</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 ton = 1000 kg</div>
        </template>
        <template v-else-if="activeTab === 'temperature'">
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">0°C = 32°F</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">100°C = 212°F</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">0°C = 273.15 K</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">-40°C = -40°F</div>
        </template>
        <template v-else-if="activeTab === 'data'">
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 KB = 1,024 B</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 MB = 1,024 KB</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 GB = 1,024 MB</div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">1 TB = 1,024 GB</div>
        </template>
      </div>
    </div>
  </div>
</template>
