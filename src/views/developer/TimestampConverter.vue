<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

const timestamp = ref('')
const datetime = ref('')
const unit = ref('seconds')
const currentTime = ref(Date.now())
const copied = ref('')

let timer = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)

  // 초기값 설정
  setNow()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const currentTimestamp = computed(() => {
  return unit.value === 'seconds'
    ? Math.floor(currentTime.value / 1000)
    : currentTime.value
})

const currentDatetime = computed(() => {
  return formatDatetime(new Date(currentTime.value))
})

const formatDatetime = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const setNow = () => {
  const now = new Date()
  timestamp.value = unit.value === 'seconds'
    ? Math.floor(now.getTime() / 1000).toString()
    : now.getTime().toString()
  datetime.value = formatDatetime(now)
}

const toDatetime = () => {
  if (!timestamp.value) return

  const ts = parseInt(timestamp.value)
  const ms = unit.value === 'seconds' ? ts * 1000 : ts
  const date = new Date(ms)

  if (isNaN(date.getTime())) {
    datetime.value = 'Invalid timestamp'
  } else {
    datetime.value = formatDatetime(date)
    trackToolUsage('timestamp_to_datetime', { unit: unit.value })
  }
}

const toTimestamp = () => {
  if (!datetime.value) return

  const date = new Date(datetime.value)

  if (isNaN(date.getTime())) {
    timestamp.value = 'Invalid datetime'
  } else {
    timestamp.value = unit.value === 'seconds'
      ? Math.floor(date.getTime() / 1000).toString()
      : date.getTime().toString()
    trackToolUsage('datetime_to_timestamp', { unit: unit.value })
  }
}

const copy = async (value, key) => {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = key
    setTimeout(() => copied.value = '', 2000)
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
        {{ t('tools.timestamp.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.timestamp.description') }}
      </p>
    </div>

    <!-- 현재 시간 -->
    <div class="card mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ t('tools.timestamp.now') }}
      </h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Unix Timestamp</p>
          <div class="flex items-center gap-2">
            <code class="text-lg font-mono text-gray-900 dark:text-white">{{ currentTimestamp }}</code>
            <button
              @click="copy(currentTimestamp.toString(), 'current-ts')"
              class="text-xs text-primary-600 hover:text-primary-700"
            >
              {{ copied === 'current-ts' ? '✓' : t('common.copy') }}
            </button>
          </div>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('tools.timestamp.datetime') }}</p>
          <div class="flex items-center gap-2">
            <code class="text-lg font-mono text-gray-900 dark:text-white">{{ currentDatetime }}</code>
            <button
              @click="copy(currentDatetime, 'current-dt')"
              class="text-xs text-primary-600 hover:text-primary-700"
            >
              {{ copied === 'current-dt' ? '✓' : t('common.copy') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 변환 -->
    <div class="card space-y-6">
      <!-- 단위 선택 -->
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('tools.timestamp.unit') }}:</span>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="unit" type="radio" value="seconds" class="w-4 h-4" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.timestamp.seconds') }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="unit" type="radio" value="milliseconds" class="w-4 h-4" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.timestamp.milliseconds') }}</span>
        </label>
        <button @click="setNow" class="btn btn-secondary text-sm py-1 px-3 ml-auto">
          {{ t('tools.timestamp.now') }}
        </button>
      </div>

      <!-- Timestamp 입력 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.timestamp.unix') }}
        </label>
        <div class="flex gap-2">
          <input
            v-model="timestamp"
            type="text"
            class="input flex-1 font-mono"
            placeholder="1703001600"
          />
          <button @click="toDatetime" class="btn btn-primary">
            {{ t('tools.timestamp.toDatetime') }}
          </button>
        </div>
      </div>

      <!-- Datetime 입력 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.timestamp.datetime') }}
        </label>
        <div class="flex gap-2">
          <input
            v-model="datetime"
            type="text"
            class="input flex-1 font-mono"
            placeholder="2024-12-20 00:00:00"
          />
          <button @click="toTimestamp" class="btn btn-primary">
            {{ t('tools.timestamp.toTimestamp') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789012" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
