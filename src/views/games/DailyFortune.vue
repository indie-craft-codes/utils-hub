<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const birthDate = ref('')
const showResult = ref(false)
const savedFortune = ref(null)

const STORAGE_KEY = 'utils-hub-fortune'

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
  const luckyNumber1 = Math.floor(seededRandom(seed + 8) * 45) + 1
  const luckyNumber2 = Math.floor(seededRandom(seed + 9) * 45) + 1

  // 키워드 인덱스 (3개)
  const keywordIndices = [
    Math.floor(seededRandom(seed + 10) * 10),
    Math.floor(seededRandom(seed + 11) * 10),
    Math.floor(seededRandom(seed + 12) * 10)
  ]

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
    date: today.toISOString().split('T')[0]
  }
})

// 저장된 운세 확인
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      const today = new Date().toISOString().split('T')[0]
      if (data.date === today) {
        birthDate.value = data.birthDate
        savedFortune.value = data
        showResult.value = true
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})

const viewFortune = () => {
  if (!birthDate.value) return

  showResult.value = true

  // 오늘 운세 저장
  const data = {
    date: new Date().toISOString().split('T')[0],
    birthDate: birthDate.value,
    fortune: fortune.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const reset = () => {
  showResult.value = false
  birthDate.value = ''
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

const share = async () => {
  const text = `${t('tools.fortune.shareText')} ${fortune.value.score}${t('tools.fortune.points')}! ${t(`tools.fortune.types.${fortune.value.fortuneType}`)}`

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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.fortune.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.fortune.description') }}
      </p>
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

        <div class="max-w-xs mx-auto">
          <input
            v-model="birthDate"
            type="date"
            class="input w-full text-center text-lg mb-4"
            :max="new Date().toISOString().split('T')[0]"
          />

          <button
            @click="viewFortune"
            :disabled="!birthDate"
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

      <!-- 카테고리별 운세 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tools.fortune.detailedFortune') }}
        </h3>

        <div class="space-y-4">
          <!-- 총운 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">
                📌 {{ t('tools.fortune.categories.general') }}
              </span>
              <span class="text-yellow-500">{{ getStars(fortune.categories.general) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t(`tools.fortune.categoryMessages.general.${fortune.categoryMessages.general}`) }}
            </p>
          </div>

          <!-- 연애운 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">
                💕 {{ t('tools.fortune.categories.love') }}
              </span>
              <span class="text-yellow-500">{{ getStars(fortune.categories.love) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t(`tools.fortune.categoryMessages.love.${fortune.categoryMessages.love}`) }}
            </p>
          </div>

          <!-- 금전운 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">
                💰 {{ t('tools.fortune.categories.money') }}
              </span>
              <span class="text-yellow-500">{{ getStars(fortune.categories.money) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t(`tools.fortune.categoryMessages.money.${fortune.categoryMessages.money}`) }}
            </p>
          </div>

          <!-- 건강운 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">
                💪 {{ t('tools.fortune.categories.health') }}
              </span>
              <span class="text-yellow-500">{{ getStars(fortune.categories.health) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t(`tools.fortune.categoryMessages.health.${fortune.categoryMessages.health}`) }}
            </p>
          </div>

          <!-- 일/학업운 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">
                💼 {{ t('tools.fortune.categories.work') }}
              </span>
              <span class="text-yellow-500">{{ getStars(fortune.categories.work) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t(`tools.fortune.categoryMessages.work.${fortune.categoryMessages.work}`) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 행운 요소 -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🍀 {{ t('tools.fortune.luckyElements') }}
        </h3>

        <div class="grid grid-cols-3 gap-4 text-center">
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
  </div>
</template>
