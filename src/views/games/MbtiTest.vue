<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

// 안전한 번역 함수 (fallback 지원)
const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}

// 상태
const currentStep = ref('intro') // intro, test, result
const shareStatus = ref('') // '', 'success', 'error'
const testMode = ref('standard') // standard(36), precision(60)
const currentQuestion = ref(0)
const answers = ref([])
const result = ref(null)
const showHistory = ref(false)
const testHistory = ref([])
const compareMode = ref(false)
const compareType = ref('')

const STORAGE_KEY = 'utils-hub-mbti'
const HISTORY_KEY = 'utils-hub-mbti-history'

// 문항 데이터 (축별 구분)
const questions = {
  // E/I 문항 (정방향: E, 역방향: I)
  EI: [
    { id: 'ei1', direction: 'E' },
    { id: 'ei2', direction: 'I' },
    { id: 'ei3', direction: 'E' },
    { id: 'ei4', direction: 'I' },
    { id: 'ei5', direction: 'E' },
    { id: 'ei6', direction: 'I' },
    { id: 'ei7', direction: 'E' },
    { id: 'ei8', direction: 'I' },
    { id: 'ei9', direction: 'E' },
    // 정밀 모드 추가
    { id: 'ei10', direction: 'E', precision: true },
    { id: 'ei11', direction: 'I', precision: true },
    { id: 'ei12', direction: 'E', precision: true },
    { id: 'ei13', direction: 'I', precision: true },
    { id: 'ei14', direction: 'E', precision: true },
    { id: 'ei15', direction: 'I', precision: true }
  ],
  // S/N 문항
  SN: [
    { id: 'sn1', direction: 'S' },
    { id: 'sn2', direction: 'N' },
    { id: 'sn3', direction: 'S' },
    { id: 'sn4', direction: 'N' },
    { id: 'sn5', direction: 'S' },
    { id: 'sn6', direction: 'N' },
    { id: 'sn7', direction: 'S' },
    { id: 'sn8', direction: 'N' },
    { id: 'sn9', direction: 'S' },
    { id: 'sn10', direction: 'S', precision: true },
    { id: 'sn11', direction: 'N', precision: true },
    { id: 'sn12', direction: 'S', precision: true },
    { id: 'sn13', direction: 'N', precision: true },
    { id: 'sn14', direction: 'S', precision: true },
    { id: 'sn15', direction: 'N', precision: true }
  ],
  // T/F 문항
  TF: [
    { id: 'tf1', direction: 'T' },
    { id: 'tf2', direction: 'F' },
    { id: 'tf3', direction: 'T' },
    { id: 'tf4', direction: 'F' },
    { id: 'tf5', direction: 'T' },
    { id: 'tf6', direction: 'F' },
    { id: 'tf7', direction: 'T' },
    { id: 'tf8', direction: 'F' },
    { id: 'tf9', direction: 'T' },
    { id: 'tf10', direction: 'T', precision: true },
    { id: 'tf11', direction: 'F', precision: true },
    { id: 'tf12', direction: 'T', precision: true },
    { id: 'tf13', direction: 'F', precision: true },
    { id: 'tf14', direction: 'T', precision: true },
    { id: 'tf15', direction: 'F', precision: true }
  ],
  // J/P 문항
  JP: [
    { id: 'jp1', direction: 'J' },
    { id: 'jp2', direction: 'P' },
    { id: 'jp3', direction: 'J' },
    { id: 'jp4', direction: 'P' },
    { id: 'jp5', direction: 'J' },
    { id: 'jp6', direction: 'P' },
    { id: 'jp7', direction: 'J' },
    { id: 'jp8', direction: 'P' },
    { id: 'jp9', direction: 'J' },
    { id: 'jp10', direction: 'J', precision: true },
    { id: 'jp11', direction: 'P', precision: true },
    { id: 'jp12', direction: 'J', precision: true },
    { id: 'jp13', direction: 'P', precision: true },
    { id: 'jp14', direction: 'J', precision: true },
    { id: 'jp15', direction: 'P', precision: true }
  ]
}

// 현재 모드에 맞는 문항 리스트
const questionList = computed(() => {
  const allQuestions = []
  const axes = ['EI', 'SN', 'TF', 'JP']

  axes.forEach(axis => {
    questions[axis].forEach(q => {
      if (testMode.value === 'precision' || !q.precision) {
        allQuestions.push({ ...q, axis })
      }
    })
  })

  // 섞기 (crypto 기반)
  return shuffleArray(allQuestions)
})

// 암호학적으로 안전한 랜덤 함수
const cryptoRandom = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] / (0xFFFFFFFF + 1)
  }
  return Math.random()
}

// 배열 섞기 (Fisher-Yates with crypto random)
const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(cryptoRandom() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 총 문항 수
const totalQuestions = computed(() => questionList.value.length)

// 진행률
const progress = computed(() => {
  return Math.round((currentQuestion.value / totalQuestions.value) * 100)
})

// 현재 문항
const currentQ = computed(() => {
  return questionList.value[currentQuestion.value]
})

// 응답 옵션 (5점 리커트)
const responseOptions = [
  { value: 1, label: 'stronglyDisagree' },
  { value: 2, label: 'disagree' },
  { value: 3, label: 'neutral' },
  { value: 4, label: 'agree' },
  { value: 5, label: 'stronglyAgree' }
]

// 테스트 시작
const startTest = (mode) => {
  testMode.value = mode
  currentStep.value = 'test'
  currentQuestion.value = 0
  answers.value = []
}

// 응답 선택
const selectAnswer = (value) => {
  answers.value[currentQuestion.value] = {
    question: currentQ.value,
    value
  }

  if (currentQuestion.value < totalQuestions.value - 1) {
    currentQuestion.value++
  } else {
    calculateResult()
  }
}

// 이전 문항
const prevQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

// 결과 계산
const calculateResult = () => {
  const scores = {
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0
  }

  const counts = {
    EI: 0, SN: 0, TF: 0, JP: 0
  }

  answers.value.forEach(answer => {
    if (!answer) return

    const { question, value } = answer
    const { axis, direction } = question

    counts[axis]++

    // 정방향: 높은 점수 = 해당 방향
    // 역방향: 높은 점수 = 반대 방향
    const opposites = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' }

    if (direction === 'E' || direction === 'S' || direction === 'T' || direction === 'J') {
      scores[direction] += value
      scores[opposites[direction]] += (6 - value)
    } else {
      scores[direction] += value
      scores[opposites[direction]] += (6 - value)
    }
  })

  // 퍼센트 계산
  const calcPercent = (a, b) => {
    const total = scores[a] + scores[b]
    if (total === 0) return 50
    return Math.round((scores[a] / total) * 100)
  }

  const percentages = {
    E: calcPercent('E', 'I'),
    I: calcPercent('I', 'E'),
    S: calcPercent('S', 'N'),
    N: calcPercent('N', 'S'),
    T: calcPercent('T', 'F'),
    F: calcPercent('F', 'T'),
    J: calcPercent('J', 'P'),
    P: calcPercent('P', 'J')
  }

  // 타입 결정
  const type =
    (percentages.E >= 50 ? 'E' : 'I') +
    (percentages.S >= 50 ? 'S' : 'N') +
    (percentages.T >= 50 ? 'T' : 'F') +
    (percentages.J >= 50 ? 'J' : 'P')

  // 신뢰도 계산 (경계값 비율)
  const borderlineCount = [
    Math.abs(percentages.E - 50) < 6,
    Math.abs(percentages.S - 50) < 6,
    Math.abs(percentages.T - 50) < 6,
    Math.abs(percentages.J - 50) < 6
  ].filter(Boolean).length

  let reliability = 'high'
  if (borderlineCount >= 3) reliability = 'low'
  else if (borderlineCount >= 1) reliability = 'medium'

  // 서브타입(상태) 결정
  const subTypes = ['stable', 'overload', 'recovery', 'focus']
  const subType = subTypes[Math.floor(cryptoRandom() * subTypes.length)]
  const timestamp = Date.now()

  // soft-hash: 결과 무결성 검증용 (보안 목적 X, 신뢰도 목적 O)
  const hash = btoa(`${type}-${timestamp}`).substring(0, 12)

  result.value = {
    type,
    percentages,
    reliability,
    subType,
    mode: testMode.value,
    date: new Date().toISOString().split('T')[0],
    timestamp,
    hash
  }

  // 저장
  saveResult()
  currentStep.value = 'result'
}

// 결과 저장
const saveResult = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result.value))

  // 히스토리에 추가
  loadHistory()
  testHistory.value.unshift(result.value)
  if (testHistory.value.length > 10) {
    testHistory.value = testHistory.value.slice(0, 10)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(testHistory.value))
}

// 해시 검증 (soft validation)
const validateHash = (item) => {
  if (!item.hash || !item.type || !item.timestamp) return true // 이전 버전 호환
  const expectedHash = btoa(`${item.type}-${item.timestamp}`).substring(0, 12)
  return item.hash === expectedHash
}

// 히스토리 로드 (30일 이전 자동 삭제 + 해시 검증)
const EXPIRY_DAYS = 30
const loadHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const now = Date.now()
      const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000
      // 30일 이내 + 해시 유효한 결과만 유지
      testHistory.value = parsed.filter(item => {
        const notExpired = item.timestamp && (now - item.timestamp) < expiryMs
        const hashValid = validateHash(item)
        return notExpired && hashValid
      })
      // 만료되거나 변조된 항목이 있었다면 저장
      if (testHistory.value.length !== parsed.length) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(testHistory.value))
      }
    } catch (e) {
      testHistory.value = []
    }
  }
}

// 전체 히스토리 삭제
const clearAllHistory = () => {
  testHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

// 초기화
onMounted(() => {
  loadHistory()
})

// 다시 테스트
const resetTest = () => {
  currentStep.value = 'intro'
  result.value = null
  answers.value = []
  currentQuestion.value = 0
}

// 공유
const share = async () => {
  if (!result.value) return

  const text = `${t('tools.mbti.shareText')} ${result.value.type}! ${safeT(`tools.mbti.types.${result.value.type}.tagline`, result.value.type)}`

  shareStatus.value = ''

  if (navigator.share) {
    try {
      await navigator.share({ text })
      shareStatus.value = 'success'
    } catch (e) {
      // 사용자가 공유 취소한 경우는 무시
      if (e.name !== 'AbortError') {
        shareStatus.value = 'error'
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(text)
      shareStatus.value = 'success'
      setTimeout(() => { shareStatus.value = '' }, 2000)
    } catch (e) {
      shareStatus.value = 'error'
      console.error('Clipboard write failed:', e)
    }
  }
}

// 탭 관리
const activeTab = ref('summary')
const tabs = ['summary', 'strengths', 'stress', 'relationship', 'work', 'growth']

// 히스토리 삭제
const deleteHistoryItem = (index) => {
  testHistory.value.splice(index, 1)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(testHistory.value))
}

// 날짜 포맷
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

// 궁합 계산
const compatibility = computed(() => {
  if (!result.value || !compareType.value || compareType.value.length !== 4) return null

  const myType = result.value.type
  const theirType = compareType.value.toUpperCase()

  // 간단한 궁합 로직
  let score = 50

  // 같은 타입
  if (myType === theirType) score = 85

  // N/S 일치
  if (myType[1] === theirType[1]) score += 10

  // T/F 보완
  if (myType[2] !== theirType[2]) score += 5

  // E/I 보완
  if (myType[0] !== theirType[0]) score += 5

  return Math.min(100, Math.max(0, score))
})

// MBTI 타입 목록
const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
]
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
            {{ t('tools.mbti.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ t('tools.mbti.description') }}
          </p>
        </div>
        <button
          v-if="testHistory.length > 0"
          @click="showHistory = !showHistory"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          {{ t('tools.mbti.history.title') }}
        </h3>
        <div class="flex items-center gap-2">
          <button
            v-if="testHistory.length > 0"
            @click="clearAllHistory"
            class="text-xs text-red-500 hover:text-red-700"
          >
            {{ safeT('tools.mbti.history.clearAll', '전체 삭제') }}
          </button>
          <button @click="showHistory = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(item, index) in testHistory"
          :key="item.timestamp"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-primary-600">{{ item.type }}</span>
            <div>
              <p class="text-sm text-gray-500">{{ formatDate(item.date) }}</p>
              <p class="text-xs text-gray-400">{{ item.mode === 'precision' ? '60문항' : '36문항' }}</p>
            </div>
          </div>
          <button @click="deleteHistoryItem(index)" class="text-gray-400 hover:text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 인트로 화면 -->
    <div v-if="currentStep === 'intro'" class="card">
      <div class="text-center py-8">
        <div class="text-6xl mb-6">🧠</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('tools.mbti.intro.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">
          {{ t('tools.mbti.intro.description') }}
        </p>

        <div class="space-y-4 max-w-md mx-auto">
          <!-- 표준 모드 -->
          <button
            @click="startTest('standard')"
            class="w-full p-4 border-2 border-primary-500 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ t('tools.mbti.intro.standardMode') }}
                </p>
                <p class="text-sm text-gray-500">{{ t('tools.mbti.intro.standardDesc') }}</p>
              </div>
              <span class="text-2xl">⚡</span>
            </div>
          </button>

          <!-- 정밀 모드 -->
          <button
            @click="startTest('precision')"
            class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ t('tools.mbti.intro.precisionMode') }}
                </p>
                <p class="text-sm text-gray-500">{{ t('tools.mbti.intro.precisionDesc') }}</p>
              </div>
              <span class="text-2xl">🎯</span>
            </div>
          </button>
        </div>

        <p class="text-xs text-gray-400 mt-6">
          {{ t('tools.mbti.disclaimer') }}
        </p>
      </div>
    </div>

    <!-- 테스트 화면 -->
    <div v-else-if="currentStep === 'test'" class="card">
      <!-- 진행 바 -->
      <div class="mb-6">
        <div class="flex justify-between text-sm text-gray-500 mb-2">
          <span>{{ currentQuestion + 1 }} / {{ totalQuestions }}</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- 문항 -->
      <div class="py-8">
        <p class="text-lg text-center text-gray-900 dark:text-white mb-8 min-h-[3rem]">
          {{ t(`tools.mbti.questions.${currentQ.id}`) }}
        </p>

        <!-- 응답 옵션 -->
        <div class="space-y-3">
          <button
            v-for="option in responseOptions"
            :key="option.value"
            @click="selectAnswer(option.value)"
            class="w-full p-4 rounded-lg border-2 transition-all"
            :class="answers[currentQuestion]?.value === option.value
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'"
          >
            <span class="text-gray-700 dark:text-gray-300">
              {{ t(`tools.mbti.responses.${option.label}`) }}
            </span>
          </button>
        </div>
      </div>

      <!-- 네비게이션 -->
      <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="prevQuestion"
          :disabled="currentQuestion === 0"
          class="btn btn-secondary"
          :class="{ 'opacity-50 cursor-not-allowed': currentQuestion === 0 }"
        >
          {{ t('tools.mbti.prev') }}
        </button>
        <button
          @click="resetTest"
          class="text-gray-500 hover:text-gray-700 text-sm"
        >
          {{ t('tools.mbti.cancel') }}
        </button>
      </div>
    </div>

    <!-- 결과 화면 -->
    <div v-else-if="currentStep === 'result' && result" class="space-y-6">
      <!-- 결과 카드 -->
      <div class="card text-center">
        <!-- 타입 -->
        <div class="mb-6">
          <p class="text-sm text-gray-500 mb-2">{{ t('tools.mbti.result.yourType') }}</p>
          <h2 class="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            {{ result.type }}
          </h2>
          <p class="text-xl text-gray-700 dark:text-gray-300">
            {{ t(`tools.mbti.types.${result.type}.name`) }}
          </p>
        </div>

        <!-- 한 줄 요약 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
          <p class="text-lg text-gray-800 dark:text-gray-200">
            "{{ t(`tools.mbti.types.${result.type}.tagline`) }}"
          </p>
        </div>

        <!-- 키워드 -->
        <div class="flex flex-wrap justify-center gap-2 mb-6">
          <span
            v-for="i in 3"
            :key="i"
            class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
          >
            {{ t(`tools.mbti.types.${result.type}.keywords.${i - 1}`) }}
          </span>
        </div>

        <!-- 4축 퍼센트 -->
        <div class="space-y-4">
          <!-- E/I -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.E >= 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                E {{ result.percentages.E }}%
              </span>
              <span :class="result.percentages.I > 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                {{ result.percentages.I }}% I
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-blue-500 transition-all" :style="{ width: `${result.percentages.E}%` }"></div>
              <div class="bg-purple-500 transition-all" :style="{ width: `${result.percentages.I}%` }"></div>
            </div>
          </div>

          <!-- S/N -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.S >= 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                S {{ result.percentages.S }}%
              </span>
              <span :class="result.percentages.N > 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                {{ result.percentages.N }}% N
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-green-500 transition-all" :style="{ width: `${result.percentages.S}%` }"></div>
              <div class="bg-yellow-500 transition-all" :style="{ width: `${result.percentages.N}%` }"></div>
            </div>
          </div>

          <!-- T/F -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.T >= 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                T {{ result.percentages.T }}%
              </span>
              <span :class="result.percentages.F > 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                {{ result.percentages.F }}% F
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-teal-500 transition-all" :style="{ width: `${result.percentages.T}%` }"></div>
              <div class="bg-pink-500 transition-all" :style="{ width: `${result.percentages.F}%` }"></div>
            </div>
          </div>

          <!-- J/P -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.J >= 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                J {{ result.percentages.J }}%
              </span>
              <span :class="result.percentages.P > 50 ? 'font-bold text-primary-600' : 'text-gray-500'">
                {{ result.percentages.P }}% P
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-orange-500 transition-all" :style="{ width: `${result.percentages.J}%` }"></div>
              <div class="bg-indigo-500 transition-all" :style="{ width: `${result.percentages.P}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 신뢰도 & 상태 -->
        <div class="flex justify-center gap-4 mt-6">
          <span class="px-3 py-1 rounded-full text-sm"
                :class="{
                  'bg-green-100 text-green-700': result.reliability === 'high',
                  'bg-yellow-100 text-yellow-700': result.reliability === 'medium',
                  'bg-red-100 text-red-700': result.reliability === 'low'
                }">
            {{ t(`tools.mbti.reliability.${result.reliability}`) }}
          </span>
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
            {{ t(`tools.mbti.subTypes.${result.subType}`) }}
          </span>
        </div>
      </div>

      <!-- 상세 탭 -->
      <div class="card">
        <!-- 탭 버튼 -->
        <div class="flex overflow-x-auto gap-2 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeTab === tab
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'"
          >
            {{ t(`tools.mbti.tabs.${tab}`) }}
          </button>
        </div>

        <!-- 탭 내용 -->
        <div class="min-h-[200px]">
          <!-- 요약 -->
          <div v-if="activeTab === 'summary'">
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ t(`tools.mbti.types.${result.type}.summary`) }}
            </p>
          </div>

          <!-- 강점 -->
          <div v-else-if="activeTab === 'strengths'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💪 {{ t('tools.mbti.tabs.strengths') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 4" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-green-500">✓</span>
                {{ t(`tools.mbti.types.${result.type}.strengths.${i - 1}`) }}
              </li>
            </ul>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3 mt-6">⚠️ {{ t('tools.mbti.weaknesses') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-orange-500">!</span>
                {{ t(`tools.mbti.types.${result.type}.weaknesses.${i - 1}`) }}
              </li>
            </ul>
          </div>

          <!-- 스트레스 -->
          <div v-else-if="activeTab === 'stress'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">😰 {{ t('tools.mbti.stressSignals') }}</h4>
            <ul class="space-y-2 mb-6">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-red-500">•</span>
                {{ t(`tools.mbti.types.${result.type}.stress.${i - 1}`) }}
              </li>
            </ul>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🌿 {{ t('tools.mbti.recovery') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-green-500">→</span>
                {{ t(`tools.mbti.types.${result.type}.recovery.${i - 1}`) }}
              </li>
            </ul>
          </div>

          <!-- 관계 -->
          <div v-else-if="activeTab === 'relationship'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💕 {{ t('tools.mbti.communicationStyle') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.mbti.types.${result.type}.relationship.style`) }}
            </p>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💡 {{ t('tools.mbti.tips') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-blue-500">•</span>
                {{ t(`tools.mbti.types.${result.type}.relationship.tips.${i - 1}`) }}
              </li>
            </ul>
          </div>

          <!-- 일/협업 -->
          <div v-else-if="activeTab === 'work'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💼 {{ t('tools.mbti.workStyle') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.mbti.types.${result.type}.work.style`) }}
            </p>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🤝 {{ t('tools.mbti.collaboration') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-purple-500">•</span>
                {{ t(`tools.mbti.types.${result.type}.work.tips.${i - 1}`) }}
              </li>
            </ul>
          </div>

          <!-- 성장 -->
          <div v-else-if="activeTab === 'growth'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🌱 {{ t('tools.mbti.growthTips') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 4" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-primary-500">{{ i }}.</span>
                {{ t(`tools.mbti.types.${result.type}.growth.${i - 1}`) }}
              </li>
            </ul>
            <div class="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p class="text-sm font-medium text-primary-700 dark:text-primary-300">
                💡 {{ t('tools.mbti.todayAction') }}
              </p>
              <p class="text-primary-600 dark:text-primary-400 mt-1">
                {{ t(`tools.mbti.types.${result.type}.todayAction`) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 비교 모드 -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
          🔍 {{ t('tools.mbti.compare.title') }}
        </h3>
        <div class="flex gap-2">
          <select
            v-model="compareType"
            class="input flex-1"
          >
            <option value="">{{ t('tools.mbti.compare.selectType') }}</option>
            <option v-for="type in mbtiTypes" :key="type" :value="type">
              {{ type }} - {{ t(`tools.mbti.types.${type}.name`) }}
            </option>
          </select>
        </div>

        <div v-if="compatibility !== null" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-600 dark:text-gray-400">{{ t('tools.mbti.compare.compatibility') }}</span>
            <span class="text-2xl font-bold" :class="{
              'text-green-500': compatibility >= 70,
              'text-yellow-500': compatibility >= 50 && compatibility < 70,
              'text-red-500': compatibility < 50
            }">{{ compatibility }}%</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              class="h-full transition-all"
              :class="{
                'bg-green-500': compatibility >= 70,
                'bg-yellow-500': compatibility >= 50 && compatibility < 70,
                'bg-red-500': compatibility < 50
              }"
              :style="{ width: `${compatibility}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 버튼 그룹 -->
      <div class="flex gap-3">
        <button @click="share" class="btn btn-primary flex-1 relative">
          <span v-if="shareStatus === 'success'" class="text-green-200">{{ t('common.copied') }}</span>
          <span v-else-if="shareStatus === 'error'" class="text-red-200">{{ safeT('common.shareFailed', '공유 실패') }}</span>
          <span v-else>{{ t('tools.mbti.share') }}</span>
        </button>
        <button @click="resetTest" class="btn btn-secondary flex-1">
          {{ t('tools.mbti.retake') }}
        </button>
      </div>

      <!-- 면책 조항 및 개인정보 안내 -->
      <div class="text-xs text-center text-gray-400 dark:text-gray-500 space-y-1">
        <p>{{ t('tools.mbti.disclaimer') }}</p>
        <p>{{ safeT('tools.mbti.privacyNotice', '결과는 브라우저에만 저장되며, 서버로 전송되지 않습니다.') }}</p>
      </div>
    </div>

  </div>
</template>
