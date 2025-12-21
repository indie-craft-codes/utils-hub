<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

// 안전한 번역 함수 (fallback 지원)
const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}

// 상태
const currentStep = ref('intro') // intro, test, result
const shareStatus = ref('') // '', 'success', 'error'
const testMode = ref('standard') // standard(24), precision(40)
const currentQuestion = ref(0)
const answers = ref([])
const result = ref(null)
const showHistory = ref(false)
const testHistory = ref([])
const compareMode = ref(false)
const compareResult = ref(null)
const friendCode = ref('')
const myCode = ref('')

const STORAGE_KEY = 'utils-hub-teto-egen'
const HISTORY_KEY = 'utils-hub-teto-egen-history'

// 문항 데이터 (축별 구분)
// TETO/EGEN 축 (주축): 갈등 해결 성향
// Direct/Indirect 축 (보조1): 직접성
// Cold/Warm 축 (보조2): 온도감
const questions = {
  // TETO/EGEN 문항 (정방향: TETO, 역방향: EGEN)
  TE: [
    { id: 'te1', direction: 'T' },
    { id: 'te2', direction: 'E' },
    { id: 'te3', direction: 'T' },
    { id: 'te4', direction: 'E' },
    { id: 'te5', direction: 'T' },
    { id: 'te6', direction: 'E' },
    { id: 'te7', direction: 'T' },
    { id: 'te8', direction: 'E' },
    { id: 'te9', direction: 'T' },
    { id: 'te10', direction: 'E' },
    { id: 'te11', direction: 'T' },
    { id: 'te12', direction: 'E' },
    // 정밀 모드 추가
    { id: 'te13', direction: 'T', precision: true },
    { id: 'te14', direction: 'E', precision: true },
    { id: 'te15', direction: 'T', precision: true },
    { id: 'te16', direction: 'E', precision: true },
    { id: 'te17', direction: 'T', precision: true },
    { id: 'te18', direction: 'E', precision: true },
    { id: 'te19', direction: 'T', precision: true },
    { id: 'te20', direction: 'E', precision: true }
  ],
  // Direct/Indirect 문항
  DI: [
    { id: 'di1', direction: 'D' },
    { id: 'di2', direction: 'I' },
    { id: 'di3', direction: 'D' },
    { id: 'di4', direction: 'I' },
    { id: 'di5', direction: 'D' },
    { id: 'di6', direction: 'I' },
    // 정밀 모드 추가
    { id: 'di7', direction: 'D', precision: true },
    { id: 'di8', direction: 'I', precision: true },
    { id: 'di9', direction: 'D', precision: true },
    { id: 'di10', direction: 'I', precision: true }
  ],
  // Cold/Warm 문항
  CW: [
    { id: 'cw1', direction: 'C' },
    { id: 'cw2', direction: 'W' },
    { id: 'cw3', direction: 'C' },
    { id: 'cw4', direction: 'W' },
    { id: 'cw5', direction: 'C' },
    { id: 'cw6', direction: 'W' },
    // 정밀 모드 추가
    { id: 'cw7', direction: 'C', precision: true },
    { id: 'cw8', direction: 'W', precision: true },
    { id: 'cw9', direction: 'C', precision: true },
    { id: 'cw10', direction: 'W', precision: true }
  ]
}

// 8가지 타입 정의
const typeDefinitions = {
  // TETO 타입 (갈등 직면형)
  'TETO-DC': { main: 'TETO', direct: true, warm: false, name: 'leader' },      // 리더형
  'TETO-DW': { main: 'TETO', direct: true, warm: true, name: 'strategy' },     // 전략형
  'TETO-IC': { main: 'TETO', direct: false, warm: false, name: 'coolhead' },   // 쿨헤드형
  'TETO-IW': { main: 'TETO', direct: false, warm: true, name: 'driver' },      // 추진형
  // EGEN 타입 (관계 우선형)
  'EGEN-DC': { main: 'EGEN', direct: true, warm: false, name: 'care' },        // 케어형
  'EGEN-DW': { main: 'EGEN', direct: true, warm: true, name: 'buffer' },       // 완충형
  'EGEN-IC': { main: 'EGEN', direct: false, warm: false, name: 'empathy' },    // 공감형
  'EGEN-IW': { main: 'EGEN', direct: false, warm: true, name: 'balance' }      // 균형형
}

// 현재 모드에 맞는 문항 리스트
const questionList = computed(() => {
  const allQuestions = []
  const axes = ['TE', 'DI', 'CW']

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
    T: 0, E: 0,  // TETO/EGEN
    D: 0, I: 0,  // Direct/Indirect
    C: 0, W: 0   // Cold/Warm
  }

  const counts = {
    TE: 0, DI: 0, CW: 0
  }

  answers.value.forEach(answer => {
    if (!answer) return

    const { question, value } = answer
    const { axis, direction } = question

    counts[axis]++

    const opposites = { T: 'E', E: 'T', D: 'I', I: 'D', C: 'W', W: 'C' }

    scores[direction] += value
    scores[opposites[direction]] += (6 - value)
  })

  // 퍼센트 계산
  const calcPercent = (a, b) => {
    const total = scores[a] + scores[b]
    if (total === 0) return 50
    return Math.round((scores[a] / total) * 100)
  }

  const percentages = {
    T: calcPercent('T', 'E'),
    E: calcPercent('E', 'T'),
    D: calcPercent('D', 'I'),
    I: calcPercent('I', 'D'),
    C: calcPercent('C', 'W'),
    W: calcPercent('W', 'C')
  }

  // 타입 결정
  const mainType = percentages.T >= 50 ? 'TETO' : 'EGEN'
  const directType = percentages.D >= 50 ? 'D' : 'I'
  const tempType = percentages.C >= 50 ? 'C' : 'W'
  const typeCode = `${mainType}-${directType}${tempType}`

  // 신뢰도 계산
  const borderlineCount = [
    Math.abs(percentages.T - 50) < 6,
    Math.abs(percentages.D - 50) < 6,
    Math.abs(percentages.C - 50) < 6
  ].filter(Boolean).length

  let reliability = 'high'
  if (borderlineCount >= 2) reliability = 'low'
  else if (borderlineCount >= 1) reliability = 'medium'

  // 고유 코드 생성 (공유용)
  const shareCode = generateShareCode(percentages)

  result.value = {
    typeCode,
    typeName: typeDefinitions[typeCode].name,
    mainType,
    directType: percentages.D >= 50 ? 'direct' : 'indirect',
    tempType: percentages.C >= 50 ? 'cold' : 'warm',
    percentages,
    reliability,
    mode: testMode.value,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    shareCode
  }

  myCode.value = shareCode

  // 저장
  saveResult()
  currentStep.value = 'result'
}

// 공유 코드 생성
const generateShareCode = (percentages) => {
  const t = Math.round(percentages.T / 5).toString(16)
  const d = Math.round(percentages.D / 5).toString(16)
  const c = Math.round(percentages.C / 5).toString(16)
  const rand = Math.random().toString(36).substring(2, 6)
  return `${t}${d}${c}${rand}`.toUpperCase()
}

// 공유 코드 파싱
const parseShareCode = (code) => {
  if (!code || code.length < 7) return null
  try {
    const t = parseInt(code[0], 16) * 5
    const d = parseInt(code[1], 16) * 5
    const c = parseInt(code[2], 16) * 5

    const mainType = t >= 50 ? 'TETO' : 'EGEN'
    const directType = d >= 50 ? 'D' : 'I'
    const tempType = c >= 50 ? 'C' : 'W'
    const typeCode = `${mainType}-${directType}${tempType}`

    return {
      typeCode,
      typeName: typeDefinitions[typeCode]?.name || 'unknown',
      percentages: { T: t, E: 100 - t, D: d, I: 100 - d, C: c, W: 100 - c }
    }
  } catch (e) {
    return null
  }
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

// 히스토리 로드 (30일 이전 자동 삭제)
const EXPIRY_DAYS = 30
const loadHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const now = Date.now()
      const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000
      // 30일 이내 결과만 유지
      testHistory.value = parsed.filter(item => {
        return item.timestamp && (now - item.timestamp) < expiryMs
      })
      // 만료된 항목이 있었다면 저장
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
  compareMode.value = false
  compareResult.value = null
  friendCode.value = ''
}

// 공유
const share = async () => {
  if (!result.value) return

  const text = t('tools.tetoEgen.shareText', {
    type: safeT(`tools.tetoEgen.types.${result.value.typeName}.name`, result.value.typeName),
    code: result.value.shareCode
  })

  shareStatus.value = ''

  if (navigator.share) {
    try {
      await navigator.share({ text, url: window.location.href })
      shareStatus.value = 'success'
    } catch (e) {
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

// 코드 복사
const copyCode = async () => {
  if (!result.value?.shareCode) return
  try {
    await navigator.clipboard.writeText(result.value.shareCode)
    shareStatus.value = 'success'
    setTimeout(() => { shareStatus.value = '' }, 2000)
  } catch (e) {
    shareStatus.value = 'error'
    console.error('Clipboard write failed:', e)
  }
}

// 친구 비교
const compareFriend = () => {
  const parsed = parseShareCode(friendCode.value.trim())
  if (parsed) {
    compareResult.value = parsed
    compareMode.value = true
  } else {
    alert(t('tools.tetoEgen.compare.invalidCode'))
  }
}

// 궁합 계산
const compatibility = computed(() => {
  if (!result.value || !compareResult.value) return null

  const my = result.value.percentages
  const their = compareResult.value.percentages

  // 보완성 점수 계산
  // 같은 성향이면 이해도 높음, 다른 성향이면 보완성 높음
  let score = 50

  // TETO/EGEN - 같으면 소통 원활
  const teDiff = Math.abs(my.T - their.T)
  if (teDiff < 20) score += 15
  else if (teDiff < 40) score += 5

  // Direct/Indirect - 적당히 달라야 균형
  const diDiff = Math.abs(my.D - their.D)
  if (diDiff > 20 && diDiff < 50) score += 15
  else if (diDiff <= 20) score += 10

  // Cold/Warm - 보완적일수록 좋음
  const cwDiff = Math.abs(my.C - their.C)
  if (cwDiff > 30) score += 15
  else score += 5

  return Math.min(100, Math.max(0, score))
})

// 궁합 유형
const compatibilityType = computed(() => {
  if (!compatibility.value) return null
  if (compatibility.value >= 80) return 'perfect'
  if (compatibility.value >= 65) return 'good'
  if (compatibility.value >= 50) return 'normal'
  return 'challenging'
})

// 탭 관리
const activeTab = ref('summary')
const tabs = ['summary', 'conflict', 'communication', 'relationship', 'work', 'growth']

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

// MBTI 연결 카드 데이터
const mbtiConnections = {
  leader: ['ENTJ', 'ESTJ', 'INTJ'],
  strategy: ['ENTP', 'ENFJ', 'INFJ'],
  coolhead: ['ISTJ', 'ISTP', 'INTP'],
  driver: ['ESTP', 'ESFJ', 'ENFP'],
  care: ['ISFJ', 'ESFJ', 'INFJ'],
  buffer: ['ENFJ', 'ESFP', 'ENFP'],
  empathy: ['INFP', 'ISFP', 'INFJ'],
  balance: ['ISFJ', 'INFP', 'ESFP']
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
            {{ t('tools.tetoEgen.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ t('tools.tetoEgen.description') }}
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
          {{ t('tools.tetoEgen.history.title') }}
        </h3>
        <div class="flex items-center gap-2">
          <button
            v-if="testHistory.length > 0"
            @click="clearAllHistory"
            class="text-xs text-red-500 hover:text-red-700"
          >
            {{ safeT('tools.tetoEgen.history.clearAll', '전체 삭제') }}
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
            <span class="text-lg font-bold" :class="item.mainType === 'TETO' ? 'text-orange-600' : 'text-blue-600'">
              {{ t(`tools.tetoEgen.types.${item.typeName}.name`) }}
            </span>
            <div>
              <p class="text-sm text-gray-500">{{ formatDate(item.date) }}</p>
              <p class="text-xs text-gray-400">{{ item.mode === 'precision' ? '40문항' : '24문항' }}</p>
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
        <div class="text-6xl mb-6">🎭</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('tools.tetoEgen.intro.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">
          {{ t('tools.tetoEgen.intro.description') }}
        </p>

        <!-- 테토/에겐 설명 -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-2xl mb-2">🔥</div>
            <h3 class="font-semibold text-orange-700 dark:text-orange-400">TETO</h3>
            <p class="text-sm text-orange-600 dark:text-orange-300">{{ t('tools.tetoEgen.intro.tetoDesc') }}</p>
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-2xl mb-2">💙</div>
            <h3 class="font-semibold text-blue-700 dark:text-blue-400">EGEN</h3>
            <p class="text-sm text-blue-600 dark:text-blue-300">{{ t('tools.tetoEgen.intro.egenDesc') }}</p>
          </div>
        </div>

        <div class="space-y-4 max-w-md mx-auto">
          <!-- 표준 모드 -->
          <button
            @click="startTest('standard')"
            class="w-full p-4 border-2 border-primary-500 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ t('tools.tetoEgen.intro.standardMode') }}
                </p>
                <p class="text-sm text-gray-500">{{ t('tools.tetoEgen.intro.standardDesc') }}</p>
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
                  {{ t('tools.tetoEgen.intro.precisionMode') }}
                </p>
                <p class="text-sm text-gray-500">{{ t('tools.tetoEgen.intro.precisionDesc') }}</p>
              </div>
              <span class="text-2xl">🎯</span>
            </div>
          </button>
        </div>

        <p class="text-xs text-gray-400 mt-6">
          {{ t('tools.tetoEgen.disclaimer') }}
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
          {{ t(`tools.tetoEgen.questions.${currentQ.id}`) }}
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
              {{ t(`tools.tetoEgen.responses.${option.label}`) }}
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
          {{ t('tools.tetoEgen.prev') }}
        </button>
        <button
          @click="resetTest"
          class="text-gray-500 hover:text-gray-700 text-sm"
        >
          {{ t('tools.tetoEgen.cancel') }}
        </button>
      </div>
    </div>

    <!-- 결과 화면 -->
    <div v-else-if="currentStep === 'result' && result" class="space-y-6">
      <!-- 결과 카드 -->
      <div class="card text-center">
        <!-- 타입 -->
        <div class="mb-6">
          <p class="text-sm text-gray-500 mb-2">{{ t('tools.tetoEgen.result.yourType') }}</p>
          <div class="flex justify-center items-center gap-2 mb-2">
            <span class="text-3xl font-bold" :class="result.mainType === 'TETO' ? 'text-orange-600' : 'text-blue-600'">
              {{ result.mainType }}
            </span>
            <span class="text-2xl text-gray-400">·</span>
            <span class="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              {{ t(`tools.tetoEgen.types.${result.typeName}.name`) }}
            </span>
          </div>
          <p class="text-sm text-gray-500">
            {{ t(`tools.tetoEgen.directTypes.${result.directType}`) }} · {{ t(`tools.tetoEgen.tempTypes.${result.tempType}`) }}
          </p>
        </div>

        <!-- 한 줄 요약 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
          <p class="text-lg text-gray-800 dark:text-gray-200">
            "{{ t(`tools.tetoEgen.types.${result.typeName}.tagline`) }}"
          </p>
        </div>

        <!-- 키워드 -->
        <div class="flex flex-wrap justify-center gap-2 mb-6">
          <span
            v-for="i in 3"
            :key="i"
            class="px-3 py-1 rounded-full text-sm"
            :class="result.mainType === 'TETO'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'"
          >
            {{ t(`tools.tetoEgen.types.${result.typeName}.keywords.${i - 1}`) }}
          </span>
        </div>

        <!-- 3축 퍼센트 -->
        <div class="space-y-4">
          <!-- TETO/EGEN -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.T >= 50 ? 'font-bold text-orange-600' : 'text-gray-500'">
                TETO {{ result.percentages.T }}%
              </span>
              <span :class="result.percentages.E > 50 ? 'font-bold text-blue-600' : 'text-gray-500'">
                {{ result.percentages.E }}% EGEN
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-orange-500 transition-all" :style="{ width: `${result.percentages.T}%` }"></div>
              <div class="bg-blue-500 transition-all" :style="{ width: `${result.percentages.E}%` }"></div>
            </div>
          </div>

          <!-- Direct/Indirect -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.D >= 50 ? 'font-bold text-purple-600' : 'text-gray-500'">
                {{ t('tools.tetoEgen.axes.direct') }} {{ result.percentages.D }}%
              </span>
              <span :class="result.percentages.I > 50 ? 'font-bold text-purple-600' : 'text-gray-500'">
                {{ result.percentages.I }}% {{ t('tools.tetoEgen.axes.indirect') }}
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-purple-500 transition-all" :style="{ width: `${result.percentages.D}%` }"></div>
              <div class="bg-purple-300 transition-all" :style="{ width: `${result.percentages.I}%` }"></div>
            </div>
          </div>

          <!-- Cold/Warm -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span :class="result.percentages.C >= 50 ? 'font-bold text-teal-600' : 'text-gray-500'">
                {{ t('tools.tetoEgen.axes.cold') }} {{ result.percentages.C }}%
              </span>
              <span :class="result.percentages.W > 50 ? 'font-bold text-pink-600' : 'text-gray-500'">
                {{ result.percentages.W }}% {{ t('tools.tetoEgen.axes.warm') }}
              </span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div class="bg-teal-500 transition-all" :style="{ width: `${result.percentages.C}%` }"></div>
              <div class="bg-pink-400 transition-all" :style="{ width: `${result.percentages.W}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 신뢰도 -->
        <div class="flex justify-center gap-4 mt-6">
          <span class="px-3 py-1 rounded-full text-sm"
                :class="{
                  'bg-green-100 text-green-700': result.reliability === 'high',
                  'bg-yellow-100 text-yellow-700': result.reliability === 'medium',
                  'bg-red-100 text-red-700': result.reliability === 'low'
                }">
            {{ t(`tools.tetoEgen.reliability.${result.reliability}`) }}
          </span>
        </div>

        <!-- 공유 코드 -->
        <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p class="text-xs text-gray-500 mb-2">{{ t('tools.tetoEgen.share.codeLabel') }}</p>
          <div class="flex items-center justify-center gap-2">
            <code class="text-lg font-mono font-bold text-primary-600">{{ result.shareCode }}</code>
            <button @click="copyCode" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 상세 탭 -->
      <div class="card">
        <!-- 탭 버튼 -->
        <div class="flex overflow-x-auto gap-2 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4 -mx-2 px-2">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeTab === tab
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'"
          >
            {{ t(`tools.tetoEgen.tabs.${tab}`) }}
          </button>
        </div>

        <!-- 탭 내용 -->
        <div class="min-h-[200px]">
          <!-- 요약 -->
          <div v-if="activeTab === 'summary'">
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ t(`tools.tetoEgen.types.${result.typeName}.summary`) }}
            </p>
          </div>

          <!-- 갈등 상황 -->
          <div v-else-if="activeTab === 'conflict'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">⚡ {{ t('tools.tetoEgen.tabs.conflict') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.tetoEgen.types.${result.typeName}.conflict.style`) }}
            </p>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💡 {{ t('tools.tetoEgen.conflictTips') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-primary-500">{{ i }}.</span>
                {{ t(`tools.tetoEgen.types.${result.typeName}.conflict.tips.${i - 1}`) }}
              </li>
            </ul>
          </div>

          <!-- 소통 방식 -->
          <div v-else-if="activeTab === 'communication'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💬 {{ t('tools.tetoEgen.tabs.communication') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.tetoEgen.types.${result.typeName}.communication.style`) }}
            </p>
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p class="text-sm font-medium text-green-700 dark:text-green-300 mb-2">✓ {{ t('tools.tetoEgen.goodAt') }}</p>
                <ul class="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <li v-for="i in 2" :key="i">• {{ t(`tools.tetoEgen.types.${result.typeName}.communication.good.${i - 1}`) }}</li>
                </ul>
              </div>
              <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p class="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">! {{ t('tools.tetoEgen.watchOut') }}</p>
                <ul class="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                  <li v-for="i in 2" :key="i">• {{ t(`tools.tetoEgen.types.${result.typeName}.communication.watch.${i - 1}`) }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 관계 -->
          <div v-else-if="activeTab === 'relationship'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💕 {{ t('tools.tetoEgen.tabs.relationship') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.tetoEgen.types.${result.typeName}.relationship.style`) }}
            </p>
            <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <p class="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">💝 {{ t('tools.tetoEgen.idealPartner') }}</p>
              <p class="text-pink-600 dark:text-pink-400">
                {{ t(`tools.tetoEgen.types.${result.typeName}.relationship.ideal`) }}
              </p>
            </div>
          </div>

          <!-- 일/협업 -->
          <div v-else-if="activeTab === 'work'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">💼 {{ t('tools.tetoEgen.tabs.work') }}</h4>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              {{ t(`tools.tetoEgen.types.${result.typeName}.work.style`) }}
            </p>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🤝 {{ t('tools.tetoEgen.teamRole') }}</h4>
            <p class="text-gray-700 dark:text-gray-300">
              {{ t(`tools.tetoEgen.types.${result.typeName}.work.role`) }}
            </p>
          </div>

          <!-- 성장 -->
          <div v-else-if="activeTab === 'growth'">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🌱 {{ t('tools.tetoEgen.tabs.growth') }}</h4>
            <ul class="space-y-2">
              <li v-for="i in 3" :key="i" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span class="text-primary-500">{{ i }}.</span>
                {{ t(`tools.tetoEgen.types.${result.typeName}.growth.${i - 1}`) }}
              </li>
            </ul>
            <div class="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p class="text-sm font-medium text-primary-700 dark:text-primary-300">
                💡 {{ t('tools.tetoEgen.todayAction') }}
              </p>
              <p class="text-primary-600 dark:text-primary-400 mt-1">
                {{ t(`tools.tetoEgen.types.${result.typeName}.todayAction`) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- MBTI 연결 카드 -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
          🔗 {{ t('tools.tetoEgen.mbtiConnection.title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ t('tools.tetoEgen.mbtiConnection.description') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="mbti in mbtiConnections[result.typeName]"
            :key="mbti"
            class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
          >
            {{ mbti }}
          </span>
        </div>
      </div>

      <!-- 친구/커플 비교 모드 -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
          👥 {{ t('tools.tetoEgen.compare.title') }}
        </h3>

        <div v-if="!compareMode">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t('tools.tetoEgen.compare.description') }}
          </p>
          <div class="flex gap-2">
            <input
              v-model="friendCode"
              type="text"
              :placeholder="t('tools.tetoEgen.compare.placeholder')"
              class="input flex-1 font-mono uppercase"
              maxlength="10"
            />
            <button @click="compareFriend" class="btn btn-primary">
              {{ t('tools.tetoEgen.compare.button') }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- 비교 결과 -->
          <div class="flex items-center justify-between">
            <div class="text-center flex-1">
              <p class="text-sm text-gray-500 mb-1">{{ t('tools.tetoEgen.compare.me') }}</p>
              <p class="font-bold" :class="result.mainType === 'TETO' ? 'text-orange-600' : 'text-blue-600'">
                {{ t(`tools.tetoEgen.types.${result.typeName}.name`) }}
              </p>
            </div>
            <div class="text-3xl">💕</div>
            <div class="text-center flex-1">
              <p class="text-sm text-gray-500 mb-1">{{ t('tools.tetoEgen.compare.friend') }}</p>
              <p class="font-bold" :class="compareResult.typeCode.startsWith('TETO') ? 'text-orange-600' : 'text-blue-600'">
                {{ t(`tools.tetoEgen.types.${compareResult.typeName}.name`) }}
              </p>
            </div>
          </div>

          <!-- 궁합 점수 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-600 dark:text-gray-400">{{ t('tools.tetoEgen.compare.compatibility') }}</span>
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
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {{ t(`tools.tetoEgen.compare.${compatibilityType}`) }}
            </p>
          </div>

          <button
            @click="compareMode = false; compareResult = null; friendCode = ''"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            {{ t('tools.tetoEgen.compare.reset') }}
          </button>
        </div>
      </div>

      <!-- 버튼 그룹 -->
      <div class="flex gap-3">
        <button @click="share" class="btn btn-primary flex-1 relative">
          <span v-if="shareStatus === 'success'" class="text-green-200">{{ t('common.copied') }}</span>
          <span v-else-if="shareStatus === 'error'" class="text-red-200">{{ safeT('common.shareFailed', '공유 실패') }}</span>
          <span v-else>{{ t('tools.tetoEgen.share.button') }}</span>
        </button>
        <button @click="resetTest" class="btn btn-secondary flex-1">
          {{ t('tools.tetoEgen.retake') }}
        </button>
      </div>

      <!-- 면책 조항 및 개인정보 안내 -->
      <div class="text-xs text-center text-gray-400 dark:text-gray-500 space-y-1">
        <p>{{ t('tools.tetoEgen.disclaimer') }}</p>
        <p>{{ safeT('tools.tetoEgen.privacyNotice', '결과는 브라우저에만 저장되며, 서버로 전송되지 않습니다.') }}</p>
      </div>
    </div>
  </div>
</template>
