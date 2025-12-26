<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t, locale } = useI18n()

const birthDate = ref('')
const showResult = ref(false)
const savedFortune = ref(null)
const inputMode = ref('select') // 'select' or 'picker'
const nickname = ref('')
const selectedCategory = ref(null) // null = 전체, 또는 특정 카테고리
const showHistory = ref(false)
const fortuneHistory = ref([])

// 직접 입력용
const birthYear = ref('')
const birthMonth = ref('')
const birthDay = ref('')

const STORAGE_KEY = 'utils-hub-fortune'
const HISTORY_KEY = 'utils-hub-fortune-history'

// 현재 연도
const currentYear = new Date().getFullYear()

// 년/월/일 입력값으로 birthDate 동기화
const syncBirthDate = () => {
  if (birthYear.value && birthMonth.value && birthDay.value) {
    const y = birthYear.value.toString().padStart(4, '0')
    const m = birthMonth.value.toString().padStart(2, '0')
    const d = birthDay.value.toString().padStart(2, '0')
    birthDate.value = `${y}-${m}-${d}`
  } else {
    birthDate.value = ''
  }
}

// birthDate에서 년/월/일 분리
const syncFromBirthDate = () => {
  if (birthDate.value) {
    const [y, m, d] = birthDate.value.split('-')
    birthYear.value = parseInt(y)
    birthMonth.value = parseInt(m)
    birthDay.value = parseInt(d)
  }
}

// 입력값 검증
const isValidDate = computed(() => {
  if (inputMode.value === 'picker') {
    return !!birthDate.value
  }

  const y = parseInt(birthYear.value)
  const m = parseInt(birthMonth.value)
  const d = parseInt(birthDay.value)

  if (!y || !m || !d) return false
  if (y < 1900 || y > currentYear) return false
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false

  // 월별 일수 검증
  const daysInMonth = new Date(y, m, 0).getDate()
  if (d > daysInMonth) return false

  return true
})

// 별자리 데이터
const zodiacSigns = [
  { id: 'capricorn', symbol: '♑', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { id: 'aquarius', symbol: '♒', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { id: 'pisces', symbol: '♓', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { id: 'aries', symbol: '♈', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { id: 'taurus', symbol: '♉', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { id: 'gemini', symbol: '♊', startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
  { id: 'cancer', symbol: '♋', startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
  { id: 'leo', symbol: '♌', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { id: 'virgo', symbol: '♍', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { id: 'libra', symbol: '♎', startMonth: 9, startDay: 23, endMonth: 10, endDay: 23 },
  { id: 'scorpio', symbol: '♏', startMonth: 10, startDay: 24, endMonth: 11, endDay: 21 },
  { id: 'sagittarius', symbol: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 }
]

// 띠 데이터
const chineseZodiacs = [
  { id: 'rat', emoji: '🐀' },
  { id: 'ox', emoji: '🐂' },
  { id: 'tiger', emoji: '🐅' },
  { id: 'rabbit', emoji: '🐇' },
  { id: 'dragon', emoji: '🐉' },
  { id: 'snake', emoji: '🐍' },
  { id: 'horse', emoji: '🐴' },
  { id: 'goat', emoji: '🐐' },
  { id: 'monkey', emoji: '🐒' },
  { id: 'rooster', emoji: '🐓' },
  { id: 'dog', emoji: '🐕' },
  { id: 'pig', emoji: '🐖' }
]

// 행운 컬러
const luckyColors = [
  { id: 'red', hex: '#EF4444' },
  { id: 'orange', hex: '#F97316' },
  { id: 'yellow', hex: '#EAB308' },
  { id: 'green', hex: '#22C55E' },
  { id: 'blue', hex: '#3B82F6' },
  { id: 'purple', hex: '#A855F7' },
  { id: 'pink', hex: '#EC4899' },
  { id: 'white', hex: '#F3F4F6' },
  { id: 'black', hex: '#1F2937' },
  { id: 'gold', hex: '#F59E0B' }
]

// 오늘의 한 단어 목록
const luckyWords = [
  'patience', 'courage', 'harmony', 'growth', 'balance',
  'wisdom', 'kindness', 'focus', 'trust', 'joy',
  'peace', 'energy', 'love', 'hope', 'strength'
]

// 피해야 할 것 목록
const avoidThings = [
  'haste', 'overthinking', 'conflict', 'laziness', 'doubt',
  'greed', 'stubbornness', 'isolation', 'negativity', 'excess'
]

// 카테고리 정보
const categoryInfo = [
  { id: 'general', icon: '📌', color: 'gray' },
  { id: 'love', icon: '💕', color: 'pink' },
  { id: 'money', icon: '💰', color: 'yellow' },
  { id: 'health', icon: '💪', color: 'green' },
  { id: 'work', icon: '💼', color: 'blue' }
]

// 시드 기반 랜덤 생성기
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const generateSeed = (birthDateStr, today) => {
  const birth = new Date(birthDateStr)
  const seed = birth.getFullYear() * 10000 +
               (birth.getMonth() + 1) * 100 +
               birth.getDate() +
               today.getFullYear() * 1000 +
               (today.getMonth() + 1) * 10 +
               today.getDate()
  return seed
}

// 별자리 계산
const getZodiacSign = (date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()

  for (const sign of zodiacSigns) {
    if (sign.startMonth === 12 && sign.endMonth === 1) {
      if ((month === 12 && day >= sign.startDay) || (month === 1 && day <= sign.endDay)) {
        return sign
      }
    } else if (
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    ) {
      return sign
    }
  }
  return zodiacSigns[0]
}

// 띠 계산
const getChineseZodiac = (year) => {
  const index = (year - 4) % 12
  return chineseZodiacs[index]
}

// 운세 생성
const fortune = computed(() => {
  if (!birthDate.value) return null

  const today = new Date()
  const birth = new Date(birthDate.value)
  const seed = generateSeed(birthDate.value, today)

  const zodiac = getZodiacSign(birth)
  const chinese = getChineseZodiac(birth.getFullYear())

  // 운세 점수 (50-100)
  const score = Math.floor(seededRandom(seed) * 50) + 50

  // 운세 타입 (8종)
  const fortuneTypes = ['stable', 'opportunity', 'caution', 'communication', 'recovery', 'focus', 'wealth', 'relationship']
  const fortuneType = fortuneTypes[Math.floor(seededRandom(seed + 1) * fortuneTypes.length)]

  // 카테고리별 점수 (1-5)
  const categories = {
    general: Math.floor(seededRandom(seed + 2) * 5) + 1,
    love: Math.floor(seededRandom(seed + 3) * 5) + 1,
    money: Math.floor(seededRandom(seed + 4) * 5) + 1,
    health: Math.floor(seededRandom(seed + 5) * 5) + 1,
    work: Math.floor(seededRandom(seed + 6) * 5) + 1
  }

  // 행운 요소
  const luckyColor = luckyColors[Math.floor(seededRandom(seed + 7) * luckyColors.length)]

  // 행운 숫자 (중복 방지)
  const luckyNumber1 = Math.floor(seededRandom(seed + 8) * 45) + 1
  let luckyNumber2 = Math.floor(seededRandom(seed + 9) * 44) + 1
  if (luckyNumber2 >= luckyNumber1) luckyNumber2++ // 중복 회피

  // 키워드 인덱스 (3개, 중복 방지)
  const getUniqueIndices = (seed, count, max) => {
    const indices = []
    const available = Array.from({ length: max }, (_, i) => i)
    for (let i = 0; i < count; i++) {
      const randomIdx = Math.floor(seededRandom(seed + i) * available.length)
      indices.push(available[randomIdx])
      available.splice(randomIdx, 1)
    }
    return indices
  }
  const keywordIndices = getUniqueIndices(seed + 10, 3, 10)

  // 메시지 인덱스
  const messageIndex = Math.floor(seededRandom(seed + 13) * 10)
  const adviceIndex = Math.floor(seededRandom(seed + 14) * 10)

  // 카테고리별 메시지 인덱스
  const categoryMessages = {
    general: Math.floor(seededRandom(seed + 15) * 8),
    love: Math.floor(seededRandom(seed + 16) * 8),
    money: Math.floor(seededRandom(seed + 17) * 8),
    health: Math.floor(seededRandom(seed + 18) * 8),
    work: Math.floor(seededRandom(seed + 19) * 8)
  }

  // 카테고리별 주의 포인트 인덱스
  const cautionIndices = {
    general: Math.floor(seededRandom(seed + 20) * 8),
    love: Math.floor(seededRandom(seed + 21) * 8),
    money: Math.floor(seededRandom(seed + 22) * 8),
    health: Math.floor(seededRandom(seed + 23) * 8),
    work: Math.floor(seededRandom(seed + 24) * 8)
  }

  // 오늘의 한 단어
  const luckyWordIndex = Math.floor(seededRandom(seed + 25) * luckyWords.length)
  const luckyWord = luckyWords[luckyWordIndex]

  // 피해야 할 것
  const avoidIndex = Math.floor(seededRandom(seed + 26) * avoidThings.length)
  const avoidThing = avoidThings[avoidIndex]

  return {
    zodiac,
    chinese,
    score,
    fortuneType,
    categories,
    luckyColor,
    luckyNumbers: [luckyNumber1, luckyNumber2].sort((a, b) => a - b),
    keywordIndices,
    messageIndex,
    adviceIndex,
    categoryMessages,
    cautionIndices,
    luckyWord,
    avoidThing,
    date: today.toISOString().split('T')[0]
  }
})

// 히스토리 로드
const loadHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY)
  if (saved) {
    try {
      fortuneHistory.value = JSON.parse(saved)
    } catch (e) {
      fortuneHistory.value = []
    }
  }
}

// 히스토리에 저장
const saveToHistory = (fortuneData) => {
  loadHistory()

  // 같은 날 데이터가 있으면 업데이트, 없으면 추가
  const existingIndex = fortuneHistory.value.findIndex(f => f.date === fortuneData.date)
  if (existingIndex >= 0) {
    fortuneHistory.value[existingIndex] = {
      ...fortuneData,
      nickname: nickname.value,
      birthDate: birthDate.value
    }
  } else {
    fortuneHistory.value.unshift({
      ...fortuneData,
      nickname: nickname.value,
      birthDate: birthDate.value
    })
  }

  // 최대 30일치만 보관
  if (fortuneHistory.value.length > 30) {
    fortuneHistory.value = fortuneHistory.value.slice(0, 30)
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(fortuneHistory.value))
}

// 저장된 운세 확인
onMounted(() => {
  loadHistory()

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      const today = new Date().toISOString().split('T')[0]
      if (data.date === today) {
        birthDate.value = data.birthDate
        nickname.value = data.nickname || ''
        savedFortune.value = data
        showResult.value = true
        syncFromBirthDate()
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})

const viewFortune = () => {
  // 직접 입력 모드일 경우 동기화
  if (inputMode.value === 'select') {
    syncBirthDate()
  }

  if (!birthDate.value || !isValidDate.value) return

  showResult.value = true
  selectedCategory.value = null

  // 오늘 운세 저장
  const data = {
    date: new Date().toISOString().split('T')[0],
    birthDate: birthDate.value,
    nickname: nickname.value,
    fortune: fortune.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

  // 히스토리에도 저장
  saveToHistory(fortune.value)
}

const reset = () => {
  showResult.value = false
  birthDate.value = ''
  birthYear.value = ''
  birthMonth.value = ''
  birthDay.value = ''
  nickname.value = ''
  selectedCategory.value = null
  localStorage.removeItem(STORAGE_KEY)
}

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

const getStars = (count) => {
  return '★'.repeat(count) + '☆'.repeat(5 - count)
}

const formatHistoryDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('tools.fortune.history.today')
  if (diffDays === 1) return t('tools.fortune.history.yesterday')
  if (diffDays < 7) return t('tools.fortune.history.daysAgo', { days: diffDays })

  return dateStr
}

const deleteHistoryItem = (index) => {
  fortuneHistory.value.splice(index, 1)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(fortuneHistory.value))
}

const share = async () => {
  const name = nickname.value ? `${nickname.value}${t('tools.fortune.honorific')} ` : ''
  const text = `${name}${t('tools.fortune.shareText')} ${fortune.value.score}${t('tools.fortune.points')}! ${t(`tools.fortune.types.${fortune.value.fortuneType}`)}`

  if (navigator.share) {
    try {
      await navigator.share({ text })
    } catch (e) {
      // 취소됨
    }
  } else {
    try {
      await navigator.clipboard.writeText(text)
      alert(t('common.copied'))
    } catch (e) {
      // 복사 실패
    }
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('tools.fortune.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ t('tools.fortune.description') }}
          </p>
        </div>
        <!-- 히스토리 버튼 -->
        <button
          v-if="fortuneHistory.length > 0"
          @click="showHistory = !showHistory"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          :title="t('tools.fortune.history.title')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 히스토리 패널 -->
    <div v-if="showHistory" class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t('tools.fortune.history.title') }}
        </h3>
        <button @click="showHistory = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="fortuneHistory.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4">
        {{ t('tools.fortune.history.empty') }}
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(item, index) in fortuneHistory"
          :key="item.date"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ item.score >= 80 ? '😊' : item.score >= 60 ? '🙂' : item.score >= 40 ? '😐' : '😔' }}</span>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatHistoryDate(item.date) }}
                <span class="ml-2" :class="getScoreColor(item.score)">{{ item.score }}{{ t('tools.fortune.points') }}</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t(`tools.fortune.types.${item.fortuneType}`) }}
              </p>
            </div>
          </div>
          <button
            @click="deleteHistoryItem(index)"
            class="text-gray-400 hover:text-red-500"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 입력 화면 -->
    <div v-if="!showResult" class="card">
      <div class="text-center py-8">
        <div class="text-6xl mb-6">🔮</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('tools.fortune.inputTitle') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ t('tools.fortune.inputDescription') }}
        </p>

        <div class="max-w-sm mx-auto">
          <!-- 닉네임 입력 (선택) -->
          <div class="mb-4">
            <input
              v-model="nickname"
              type="text"
              :placeholder="t('tools.fortune.nicknamePlaceholder')"
              class="input w-full text-center"
              maxlength="10"
            />
            <p class="text-xs text-gray-400 mt-1">{{ t('tools.fortune.nicknameHint') }}</p>
          </div>

          <!-- 입력 모드 토글 -->
          <div class="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-4">
            <button
              @click="inputMode = 'select'"
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors"
              :class="inputMode === 'select'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            >
              {{ t('tools.fortune.directInput') }}
            </button>
            <button
              @click="inputMode = 'picker'"
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors"
              :class="inputMode === 'picker'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            >
              {{ t('tools.fortune.datePicker') }}
            </button>
          </div>

          <!-- 직접 입력 (년/월/일) -->
          <div v-if="inputMode === 'select'" class="mb-4">
            <div class="flex gap-2 items-center justify-center">
              <div class="flex-1">
                <input
                  v-model="birthYear"
                  type="number"
                  :placeholder="t('tools.fortune.year')"
                  class="input w-full text-center"
                  min="1900"
                  :max="currentYear"
                  @input="syncBirthDate"
                />
              </div>
              <span class="text-gray-400">.</span>
              <div class="w-20">
                <input
                  v-model="birthMonth"
                  type="number"
                  :placeholder="t('tools.fortune.month')"
                  class="input w-full text-center"
                  min="1"
                  max="12"
                  @input="syncBirthDate"
                />
              </div>
              <span class="text-gray-400">.</span>
              <div class="w-20">
                <input
                  v-model="birthDay"
                  type="number"
                  :placeholder="t('tools.fortune.day')"
                  class="input w-full text-center"
                  min="1"
                  max="31"
                  @input="syncBirthDate"
                />
              </div>
            </div>
          </div>

          <!-- 날짜 선택기 -->
          <div v-else class="mb-4">
            <input
              v-model="birthDate"
              type="date"
              class="input w-full text-center text-lg"
              :max="new Date().toISOString().split('T')[0]"
              @change="syncFromBirthDate"
            />
          </div>

          <button
            @click="viewFortune"
            :disabled="!isValidDate"
            class="btn btn-primary w-full text-lg py-3"
          >
            {{ t('tools.fortune.viewFortune') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 결과 화면 -->
    <div v-else-if="fortune" class="space-y-6">
      <!-- 기본 정보 카드 -->
      <div class="card text-center">
        <div class="flex justify-center gap-6 mb-4">
          <div>
            <span class="text-3xl">{{ fortune.zodiac.symbol }}</span>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t(`tools.fortune.zodiac.${fortune.zodiac.id}`) }}
            </p>
          </div>
          <div>
            <span class="text-3xl">{{ fortune.chinese.emoji }}</span>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t(`tools.fortune.chinese.${fortune.chinese.id}`) }}
            </p>
          </div>
        </div>

        <!-- 운세 타입 -->
        <div class="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4"
             :class="{
               'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': fortune.fortuneType === 'stable' || fortune.fortuneType === 'opportunity',
               'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': fortune.fortuneType === 'caution' || fortune.fortuneType === 'recovery',
               'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': fortune.fortuneType === 'communication' || fortune.fortuneType === 'focus',
               'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': fortune.fortuneType === 'wealth' || fortune.fortuneType === 'relationship'
             }">
          {{ t(`tools.fortune.types.${fortune.fortuneType}`) }}
        </div>

        <!-- 점수 -->
        <div class="mb-4">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span v-if="nickname">{{ nickname }}{{ t('tools.fortune.honorific') }} </span>
            {{ t('tools.fortune.todayScore') }}
          </p>
          <p class="text-5xl font-bold" :class="getScoreColor(fortune.score)">
            {{ fortune.score }}<span class="text-2xl">{{ t('tools.fortune.points') }}</span>
          </p>
        </div>

        <!-- 오늘의 한 줄 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-lg text-gray-800 dark:text-gray-200">
            {{ t(`tools.fortune.messages.${fortune.messageIndex}`) }}
          </p>
        </div>
      </div>

      <!-- 오늘의 키워드 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {{ t('tools.fortune.todayKeywords') }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(idx, i) in fortune.keywordIndices"
            :key="i"
            class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
          >
            {{ t(`tools.fortune.keywords.${idx}`) }}
          </span>
        </div>
      </div>

      <!-- 선택형 운세: 오늘은 이게 궁금해요 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {{ t('tools.fortune.selectCategory') }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="selectedCategory = null"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="selectedCategory === null
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
          >
            {{ t('tools.fortune.allCategories') }}
          </button>
          <button
            v-for="cat in categoryInfo"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="selectedCategory === cat.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
          >
            {{ cat.icon }} {{ t(`tools.fortune.categories.${cat.id}`) }}
          </button>
        </div>
      </div>

      <!-- 카테고리별 운세 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.fortune.detailedFortune') }}
        </h3>

        <div class="space-y-4">
          <template v-for="cat in categoryInfo" :key="cat.id">
            <div
              v-if="selectedCategory === null || selectedCategory === cat.id"
              class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              :class="{ 'ring-2 ring-primary-500': selectedCategory === cat.id }"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ cat.icon }} {{ t(`tools.fortune.categories.${cat.id}`) }}
                </span>
                <span class="text-yellow-500">{{ getStars(fortune.categories[cat.id]) }}</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ t(`tools.fortune.categoryMessages.${cat.id}.${fortune.categoryMessages[cat.id]}`) }}
              </p>
              <!-- 조심 포인트 -->
              <p class="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <span>⚠️</span>
                {{ t(`tools.fortune.cautions.${cat.id}.${fortune.cautionIndices[cat.id]}`) }}
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- 행운 요소 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🍀 {{ t('tools.fortune.luckyElements') }}
        </h3>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ t('tools.fortune.luckyColor') }}
            </p>
            <div
              class="w-8 h-8 rounded-full mx-auto mb-1 border-2 border-gray-200 dark:border-gray-600"
              :style="{ backgroundColor: fortune.luckyColor.hex }"
            ></div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ t(`tools.fortune.colors.${fortune.luckyColor.id}`) }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ t('tools.fortune.luckyNumbers') }}
            </p>
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ fortune.luckyNumbers.join(', ') }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ t('tools.fortune.luckyWord') }}
            </p>
            <p class="text-lg font-medium text-gray-900 dark:text-white">
              {{ t(`tools.fortune.words.${fortune.luckyWord}`) }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ t('tools.fortune.luckyDirection') }}
            </p>
            <p class="text-2xl">
              {{ ['🧭', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'][Math.floor(fortune.score / 12)] }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ t(`tools.fortune.directions.${Math.floor(fortune.score / 12) % 8}`) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 피해야 할 것 -->
      <div class="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
          🚫 {{ t('tools.fortune.avoidToday') }}
        </h3>
        <p class="text-red-600 dark:text-red-300">
          {{ t(`tools.fortune.avoids.${fortune.avoidThing}`) }}
        </p>
      </div>

      <!-- 오늘의 조언 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          💡 {{ t('tools.fortune.todayAdvice') }}
        </h3>
        <p class="text-gray-700 dark:text-gray-300 p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg">
          {{ t(`tools.fortune.advices.${fortune.adviceIndex}`) }}
        </p>
      </div>

      <!-- 버튼 그룹 -->
      <div class="flex gap-3">
        <button @click="share" class="btn btn-primary flex-1">
          {{ t('tools.fortune.share') }}
        </button>
        <button @click="reset" class="btn btn-secondary flex-1">
          {{ t('tools.fortune.reset') }}
        </button>
      </div>

      <!-- 면책 조항 -->
      <p class="text-xs text-center text-gray-400 dark:text-gray-500">
        {{ t('tools.fortune.disclaimer') }}
      </p>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="2345678901" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
