<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const title = ref('')
const targetDate = ref('')
const ddays = ref([])

const STORAGE_KEY = 'utils-hub-ddays'

onMounted(() => {
  loadDdays()
  // 오늘 날짜를 기본값으로 설정
  const today = new Date()
  targetDate.value = formatDateInput(today)
})

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const preview = computed(() => {
  if (!targetDate.value) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(targetDate.value)
  target.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const weekdays = [
    t('tools.dday.weekdays.sun'),
    t('tools.dday.weekdays.mon'),
    t('tools.dday.weekdays.tue'),
    t('tools.dday.weekdays.wed'),
    t('tools.dday.weekdays.thu'),
    t('tools.dday.weekdays.fri'),
    t('tools.dday.weekdays.sat')
  ]

  return {
    dday: diffDays === 0 ? 'D-Day' : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`,
    label: diffDays === 0
      ? t('tools.dday.today')
      : diffDays > 0
        ? t('tools.dday.daysLeft', { days: diffDays })
        : t('tools.dday.daysPassed', { days: Math.abs(diffDays) }),
    weekday: weekdays[target.getDay()],
    formattedDate: formatDisplayDate(target),
    isPast: diffDays < 0,
    isToday: diffDays === 0
  }
})

const formatDisplayDate = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return t('tools.dday.dateFormat', { year, month, day })
}

const loadDdays = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      ddays.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load D-days:', e)
  }
}

const saveDdays = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ddays.value))
  } catch (e) {
    console.error('Failed to save D-days:', e)
  }
}

const addDday = () => {
  if (!targetDate.value) return

  const newDday = {
    id: Date.now(),
    title: title.value || t('tools.dday.untitled'),
    date: targetDate.value
  }

  ddays.value.unshift(newDday)
  saveDdays()

  // 입력 초기화
  title.value = ''
}

const removeDday = (id) => {
  ddays.value = ddays.value.filter(d => d.id !== id)
  saveDdays()
}

const getDdayDisplay = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    text: diffDays === 0 ? 'D-Day' : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`,
    isPast: diffDays < 0,
    isToday: diffDays === 0
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
        {{ t('tools.dday.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.dday.description') }}
      </p>
    </div>

    <!-- 입력 폼 -->
    <div class="card mb-6">
      <div class="space-y-4">
        <!-- 제목 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.dday.titleLabel') }}
          </label>
          <input
            v-model="title"
            type="text"
            class="input w-full"
            :placeholder="t('tools.dday.titlePlaceholder')"
          />
        </div>

        <!-- 날짜 선택 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.dday.dateLabel') }}
          </label>
          <input
            v-model="targetDate"
            type="date"
            class="input w-full"
          />
        </div>

        <!-- 실시간 미리보기 -->
        <div v-if="preview" class="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {{ title || t('tools.dday.untitled') }}
          </p>
          <p
            class="text-4xl font-bold mb-2"
            :class="{
              'text-red-500': preview.isPast,
              'text-green-500': preview.isToday,
              'text-primary-600 dark:text-primary-400': !preview.isPast && !preview.isToday
            }"
          >
            {{ preview.dday }}
          </p>
          <p class="text-gray-600 dark:text-gray-300">
            {{ preview.formattedDate }} ({{ preview.weekday }})
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ preview.label }}
          </p>
        </div>

        <!-- 저장 버튼 -->
        <button
          @click="addDday"
          :disabled="!targetDate"
          class="btn btn-primary w-full"
        >
          {{ t('tools.dday.save') }}
        </button>
      </div>
    </div>

    <!-- 저장된 D-Day 목록 -->
    <div v-if="ddays.length > 0" class="card">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ t('tools.dday.savedList') }}
      </h2>
      <div class="space-y-3">
        <div
          v-for="dday in ddays"
          :key="dday.id"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ dday.title }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ dday.date }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="text-xl font-bold"
              :class="{
                'text-red-500': getDdayDisplay(dday.date).isPast,
                'text-green-500': getDdayDisplay(dday.date).isToday,
                'text-primary-600 dark:text-primary-400': !getDdayDisplay(dday.date).isPast && !getDdayDisplay(dday.date).isToday
              }"
            >
              {{ getDdayDisplay(dday.date).text }}
            </span>
            <button
              @click="removeDday(dday.id)"
              class="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="card text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">
        {{ t('tools.dday.empty') }}
      </p>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="6789012345" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
