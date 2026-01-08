<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import html2canvas from 'html2canvas'
import { trackToolUsage } from '../../utils/analytics'
import ToolGuide from '../../components/common/ToolGuide.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// === 상수 ===
const STORAGE_KEY = 'utils-hub-roulette'
const HISTORY_KEY = 'utils-hub-roulette-history'
const FAVORITES_KEY = 'utils-hub-roulette-favorites'

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
]

const PRESETS = {
  lunch: ['김치찌개', '된장찌개', '비빔밥', '삼겹살', '치킨', '피자', '햄버거', '초밥', '라면', '떡볶이', '샐러드', '파스타'],
  penalty: ['노래 부르기', '개인기 하기', '청소하기', '커피 사기', '춤추기', '몸개그', '애교 부리기', '삑삑이 달기', '10분 안기', '조용히 있기'],
  chores: ['설거지', '청소기', '걸레질', '정리정돈', '분리수거', '화장실 청소', '침구 정리', '환기하기'],
  movies: ['액션', '코미디', '로맨스', '공포', 'SF', '판타지', '드라마', '스릴러', '애니메이션', '다큐멘터리'],
  routine: ['운동하기', '독서하기', '청소하기', '명상하기', '산책하기', '스트레칭']
}

// === 상태 ===
const rouletteRef = ref(null)
const wheelRef = ref(null)

// 항목 관리
const items = ref([
  { id: 1, name: '김치찌개', weight: 1, active: true, excludeCount: 0 },
  { id: 2, name: '피자', weight: 1, active: true, excludeCount: 0 },
  { id: 3, name: '샐러드', weight: 1, active: true, excludeCount: 0 },
  { id: 4, name: '햄버거', weight: 1, active: true, excludeCount: 0 },
  { id: 5, name: '초밥', weight: 1, active: true, excludeCount: 0 },
  { id: 6, name: '파스타', weight: 1, active: true, excludeCount: 0 }
])
const nextId = ref(7)

// 입력 모드
const inputMode = ref('single') // 'single' | 'multi' | 'preset'
const singleInput = ref('')
const multiInput = ref('')
const selectedPreset = ref('')

// 옵션
const showOptions = ref(false)
const showAdvanced = ref(false)

// 기본 옵션
const animationEnabled = ref(true)
const soundEnabled = ref(false)
const spinDuration = ref(4500) // ms

// 고급 옵션: 중복/제외 규칙
const duplicateMode = ref('allow') // 'allow' | 'exclude_once' | 'cooldown'
const cooldownRounds = ref(3)

// 고급 옵션: 가중치
const weightMode = ref('equal') // 'equal' | 'weighted'

// 고급 옵션: 공정성 모드
const fairnessMode = ref(false)
const manualSeed = ref('')
const currentSeed = ref('')

// 회전 상태
const isSpinning = ref(false)
const currentRotation = ref(0)
const targetRotation = ref(0)

// 결과
const showResult = ref(false)
const resultItem = ref(null)
const resultSeed = ref('')
const resultSnapshot = ref(null)

// 히스토리
const history = ref([])

// 즐겨찾기
const favorites = ref([])
const currentRouletteName = ref('')
const showSaveModal = ref(false)
const showLoadModal = ref(false)

// 공유
const showShareModal = ref(false)
const shareUrl = ref('')
const shareType = ref('roulette') // 'roulette' | 'result'

// 드래그
const draggedIndex = ref(null)

// === 계산된 속성 ===
const activeItems = computed(() => items.value.filter(item => item.active))

const totalWeight = computed(() =>
  activeItems.value.reduce((sum, item) => sum + item.weight, 0)
)

const itemProbabilities = computed(() => {
  if (weightMode.value === 'equal') {
    const prob = 100 / activeItems.value.length
    return activeItems.value.map(item => ({
      ...item,
      probability: prob
    }))
  }
  return activeItems.value.map(item => ({
    ...item,
    probability: (item.weight / totalWeight.value) * 100
  }))
})

const canSpin = computed(() =>
  activeItems.value.length >= 2 && !isSpinning.value
)

// SVG 섹션 계산
const sections = computed(() => {
  const activeList = activeItems.value
  if (activeList.length === 0) return []

  const total = weightMode.value === 'equal'
    ? activeList.length
    : totalWeight.value

  let currentAngle = 0
  return activeList.map((item, index) => {
    const portion = weightMode.value === 'equal'
      ? 1 / activeList.length
      : item.weight / total
    const angle = portion * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    return {
      ...item,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
      color: COLORS[index % COLORS.length]
    }
  })
})

// === 메서드 ===

// 항목 관리
const addItem = (name) => {
  if (!name.trim()) return
  items.value.push({
    id: nextId.value++,
    name: name.trim(),
    weight: 1,
    active: true,
    excludeCount: 0
  })
}

const addSingleItem = () => {
  addItem(singleInput.value)
  singleInput.value = ''
}

const addMultiItems = () => {
  const names = multiInput.value.split('\n').filter(n => n.trim())
  names.forEach(name => addItem(name))
  multiInput.value = ''
}

const applyPreset = () => {
  if (!selectedPreset.value || !PRESETS[selectedPreset.value]) return
  items.value = PRESETS[selectedPreset.value].map((name, i) => ({
    id: nextId.value + i,
    name,
    weight: 1,
    active: true,
    excludeCount: 0
  }))
  nextId.value += PRESETS[selectedPreset.value].length
  selectedPreset.value = ''
}

const removeItem = (id) => {
  items.value = items.value.filter(item => item.id !== id)
}

const toggleItem = (id) => {
  const item = items.value.find(i => i.id === id)
  if (item) item.active = !item.active
}

const updateItemWeight = (id, weight) => {
  const item = items.value.find(i => i.id === id)
  if (item) item.weight = Math.max(1, Math.min(100, weight))
}

const clearDuplicates = () => {
  const seen = new Set()
  items.value = items.value.filter(item => {
    if (seen.has(item.name)) return false
    seen.add(item.name)
    return true
  })
}

// 드래그 앤 드롭
const onDragStart = (index) => {
  draggedIndex.value = index
}

const onDragOver = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return

  const draggedItem = items.value[draggedIndex.value]
  items.value.splice(draggedIndex.value, 1)
  items.value.splice(index, 0, draggedItem)
  draggedIndex.value = index
}

const onDragEnd = () => {
  draggedIndex.value = null
}

// 시드 생성
const generateSeed = () => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0].toString(36)
}

// 시드 기반 랜덤
const seededRandom = (seed) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// 결과 선택
const selectResult = (random) => {
  const activeList = activeItems.value

  if (weightMode.value === 'equal') {
    const index = Math.floor(random * activeList.length)
    return activeList[index]
  }

  // 가중치 기반 선택
  let cumulative = 0
  const target = random * totalWeight.value

  for (const item of activeList) {
    cumulative += item.weight
    if (target <= cumulative) return item
  }

  return activeList[activeList.length - 1]
}

// 회전 애니메이션
const spin = async () => {
  if (!canSpin.value) return

  // Analytics 추적
  trackToolUsage('roulette_spin', {
    item_count: activeItems.value.length,
    weight_mode: weightMode.value,
    fairness_mode: fairnessMode.value
  })

  isSpinning.value = true
  showResult.value = false

  // 시드 결정
  const seed = fairnessMode.value && manualSeed.value
    ? manualSeed.value
    : generateSeed()
  currentSeed.value = seed

  // 결과 계산
  const random = fairnessMode.value
    ? seededRandom(seed)()
    : Math.random()

  const selected = selectResult(random)
  resultItem.value = selected
  resultSeed.value = seed
  resultSnapshot.value = {
    items: JSON.parse(JSON.stringify(activeItems.value)),
    weightMode: weightMode.value,
    duplicateMode: duplicateMode.value,
    timestamp: Date.now()
  }

  // 목표 각도 계산 (선택된 항목이 포인터 위치에 오도록)
  const section = sections.value.find(s => s.id === selected.id)
  const targetAngle = 90 - section.midAngle // 포인터가 오른쪽(90도)에 있음

  // 현재 회전 각도를 정규화 (0~360 범위로)
  const currentNormalized = currentRotation.value % 360
  const targetNormalized = ((targetAngle % 360) + 360) % 360

  // 현재 위치에서 목표 위치까지의 각도 차이 계산
  let angleDiff = targetNormalized - currentNormalized
  if (angleDiff < 0) {
    angleDiff += 360 // 항상 시계방향으로 회전
  }

  const fullRotations = 5 + Math.floor(Math.random() * 3) // 5~7바퀴
  const newTarget = currentRotation.value + fullRotations * 360 + angleDiff

  targetRotation.value = newTarget

  // 애니메이션
  if (animationEnabled.value) {
    const startRotation = currentRotation.value
    const duration = spinDuration.value
    const startTime = performance.now()

    const animate = (time) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 이징: 처음 빠름 → 끝에서 천천히
      const eased = 1 - Math.pow(1 - progress, 4)

      currentRotation.value = startRotation + (newTarget - startRotation) * eased

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        currentRotation.value = newTarget
        onSpinComplete()
      }
    }

    requestAnimationFrame(animate)
  } else {
    currentRotation.value = newTarget
    onSpinComplete()
  }

  // 사운드
  if (soundEnabled.value) {
    playClickSound()
  }
}

const onSpinComplete = () => {
  isSpinning.value = false
  showResult.value = true

  // 히스토리에 추가
  history.value.unshift({
    id: Date.now(),
    item: resultItem.value.name,
    seed: fairnessMode.value ? resultSeed.value : null,
    timestamp: Date.now(),
    weightMode: weightMode.value,
    duplicateMode: duplicateMode.value
  })

  // 최대 50개 유지
  if (history.value.length > 50) {
    history.value = history.value.slice(0, 50)
  }

  // 중복 규칙 적용
  if (duplicateMode.value === 'exclude_once') {
    const item = items.value.find(i => i.id === resultItem.value.id)
    if (item) item.active = false
  } else if (duplicateMode.value === 'cooldown') {
    // 쿨다운 카운트 증가
    const item = items.value.find(i => i.id === resultItem.value.id)
    if (item) item.excludeCount = cooldownRounds.value

    // 다른 항목 쿨다운 감소
    items.value.forEach(item => {
      if (item.id !== resultItem.value.id && item.excludeCount > 0) {
        item.excludeCount--
        if (item.excludeCount === 0) item.active = true
      }
    })

    if (item && item.excludeCount > 0) item.active = false
  }

  saveToLocalStorage()
}

const playClickSound = () => {
  // Web Audio API를 사용한 간단한 클릭 사운드
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    // 오디오 지원 안됨
  }
}

// 결과 액션
const spinAgain = () => {
  showResult.value = false
  spin()
}

const excludeAndSpin = () => {
  const item = items.value.find(i => i.id === resultItem.value.id)
  if (item) item.active = false
  showResult.value = false
  if (activeItems.value.length >= 2) {
    spin()
  }
}

const resetExclusions = () => {
  items.value.forEach(item => {
    item.active = true
    item.excludeCount = 0
  })
}

// 저장/불러오기
const saveToLocalStorage = () => {
  const data = {
    items: items.value,
    nextId: nextId.value,
    options: {
      animationEnabled: animationEnabled.value,
      soundEnabled: soundEnabled.value,
      spinDuration: spinDuration.value,
      duplicateMode: duplicateMode.value,
      cooldownRounds: cooldownRounds.value,
      weightMode: weightMode.value,
      fairnessMode: fairnessMode.value
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}

const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      items.value = parsed.items || items.value
      nextId.value = parsed.nextId || nextId.value

      if (parsed.options) {
        animationEnabled.value = parsed.options.animationEnabled ?? true
        soundEnabled.value = parsed.options.soundEnabled ?? false
        spinDuration.value = parsed.options.spinDuration ?? 4500
        duplicateMode.value = parsed.options.duplicateMode ?? 'allow'
        cooldownRounds.value = parsed.options.cooldownRounds ?? 3
        weightMode.value = parsed.options.weightMode ?? 'equal'
        fairnessMode.value = parsed.options.fairnessMode ?? false
      }
    }

    const historyData = localStorage.getItem(HISTORY_KEY)
    if (historyData) {
      history.value = JSON.parse(historyData)
    }

    const favData = localStorage.getItem(FAVORITES_KEY)
    if (favData) {
      favorites.value = JSON.parse(favData)
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
  }
}

// 즐겨찾기
const saveToFavorites = () => {
  if (!currentRouletteName.value.trim()) return

  favorites.value.push({
    id: Date.now(),
    name: currentRouletteName.value.trim(),
    items: JSON.parse(JSON.stringify(items.value)),
    options: {
      weightMode: weightMode.value,
      duplicateMode: duplicateMode.value,
      cooldownRounds: cooldownRounds.value
    },
    createdAt: Date.now()
  })

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
  currentRouletteName.value = ''
  showSaveModal.value = false
}

const loadFromFavorite = (fav) => {
  items.value = JSON.parse(JSON.stringify(fav.items))
  nextId.value = Math.max(...fav.items.map(i => i.id)) + 1

  if (fav.options) {
    weightMode.value = fav.options.weightMode || 'equal'
    duplicateMode.value = fav.options.duplicateMode || 'allow'
    cooldownRounds.value = fav.options.cooldownRounds || 3
  }

  showLoadModal.value = false
  history.value = []
}

const deleteFavorite = (id) => {
  favorites.value = favorites.value.filter(f => f.id !== id)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
}

// 공유
const generateShareUrl = (type) => {
  const baseUrl = window.location.origin + window.location.pathname

  if (type === 'roulette') {
    const data = {
      items: items.value.map(i => ({ name: i.name, weight: i.weight })),
      weightMode: weightMode.value
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    shareUrl.value = `${baseUrl}?share=${encoded}`
  } else {
    const data = {
      result: resultItem.value?.name,
      seed: fairnessMode.value ? resultSeed.value : null,
      snapshot: resultSnapshot.value
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    shareUrl.value = `${baseUrl}?result=${encoded}`
  }

  shareType.value = type
  showShareModal.value = true
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const loadFromShareUrl = () => {
  const params = new URLSearchParams(window.location.search)

  const shareData = params.get('share')
  if (shareData) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(shareData)))
      items.value = decoded.items.map((item, i) => ({
        id: i + 1,
        name: item.name,
        weight: item.weight || 1,
        active: true,
        excludeCount: 0
      }))
      nextId.value = items.value.length + 1
      weightMode.value = decoded.weightMode || 'equal'

      // URL에서 파라미터 제거
      router.replace({ query: {} })
    } catch (e) {
      console.error('Failed to load share data:', e)
    }
  }
}

// 이미지 저장
const saveAsImage = async () => {
  if (!rouletteRef.value) return

  try {
    const canvas = await html2canvas(rouletteRef.value, {
      backgroundColor: '#ffffff',
      scale: 2
    })

    const link = document.createElement('a')
    link.download = 'roulette-result.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('Failed to save image:', e)
  }
}

// SVG 경로 생성
const getSectionPath = (section, radius = 150, cx = 160, cy = 160) => {
  const startRad = (section.startAngle - 90) * Math.PI / 180
  const endRad = (section.endAngle - 90) * Math.PI / 180

  const x1 = cx + radius * Math.cos(startRad)
  const y1 = cy + radius * Math.sin(startRad)
  const x2 = cx + radius * Math.cos(endRad)
  const y2 = cy + radius * Math.sin(endRad)

  const largeArc = section.endAngle - section.startAngle > 180 ? 1 : 0

  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const getTextPosition = (section, radius = 100, cx = 160, cy = 160) => {
  const midRad = (section.midAngle - 90) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(midRad),
    y: cy + radius * Math.sin(midRad),
    rotation: section.midAngle
  }
}

const truncateText = (text, maxLength = 8) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}

// 라이프사이클
onMounted(() => {
  loadFromLocalStorage()
  loadFromShareUrl()
})

watch([items, animationEnabled, soundEnabled, spinDuration, duplicateMode, cooldownRounds, weightMode, fairnessMode], () => {
  saveToLocalStorage()
}, { deep: true })
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('tools.roulette.title') }}
        </h1>
        <div class="flex gap-2">
          <button @click="showLoadModal = true" class="btn btn-secondary text-sm py-1.5 px-3">
            {{ t('tools.roulette.load') }}
          </button>
          <button @click="showSaveModal = true" class="btn btn-secondary text-sm py-1.5 px-3">
            {{ t('tools.roulette.save') }}
          </button>
          <button @click="generateShareUrl('roulette')" class="btn btn-secondary text-sm py-1.5 px-3">
            {{ t('tools.roulette.share') }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 왼쪽: 룰렛 -->
      <div class="space-y-4">
        <div ref="rouletteRef" class="card">
          <!-- 룰렛 휠 -->
          <div class="relative flex justify-center items-center">
            <!-- 포인터 -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <svg width="30" height="30" viewBox="0 0 30 30">
                <path d="M0 15 L25 5 L25 25 Z" fill="#1f2937" class="dark:fill-white" />
              </svg>
            </div>

            <!-- 휠 -->
            <svg
              ref="wheelRef"
              width="320"
              height="320"
              viewBox="0 0 320 320"
              class="drop-shadow-lg"
              :style="{ transform: `rotate(${currentRotation}deg)` }"
            >
              <!-- 섹션들 -->
              <g v-for="section in sections" :key="section.id">
                <path
                  :d="getSectionPath(section)"
                  :fill="section.color"
                  stroke="white"
                  stroke-width="2"
                  class="transition-opacity"
                  :class="{ 'opacity-50': !section.active }"
                />
                <text
                  v-if="sections.length <= 20"
                  :x="getTextPosition(section).x"
                  :y="getTextPosition(section).y"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="white"
                  font-weight="bold"
                  :font-size="sections.length > 12 ? '10' : sections.length > 8 ? '11' : '12'"
                  :transform="`rotate(${getTextPosition(section).rotation}, ${getTextPosition(section).x}, ${getTextPosition(section).y})`"
                >
                  {{ truncateText(section.name, sections.length > 10 ? 5 : 8) }}
                </text>
              </g>

              <!-- 중앙 원 -->
              <circle cx="160" cy="160" r="25" fill="white" stroke="#e5e7eb" stroke-width="2" />
              <circle cx="160" cy="160" r="8" fill="#1f2937" class="dark:fill-gray-300" />
            </svg>
          </div>

          <!-- 스핀 버튼 -->
          <div class="mt-6 flex justify-center">
            <button
              @click="spin"
              :disabled="!canSpin"
              class="btn btn-primary text-lg py-3 px-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSpinning ? t('tools.roulette.spinning') : t('tools.roulette.spin') }}
            </button>
          </div>

          <!-- 항목 수 / 확률 미리보기 -->
          <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <span>{{ t('tools.roulette.itemCount', { count: activeItems.length }) }}</span>
            <span v-if="activeItems.length < 2" class="text-red-500 ml-2">
              {{ t('tools.roulette.minItemsWarning') }}
            </span>
          </div>
        </div>

        <!-- 히스토리 -->
        <div v-if="history.length > 0" class="card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ t('tools.roulette.history') }}
            </h3>
            <button @click="history = []" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {{ t('common.clear') }}
            </button>
          </div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="h in history.slice(0, 10)"
              :key="h.id"
              class="flex items-center justify-between text-sm py-1 px-2 rounded bg-gray-50 dark:bg-gray-700/50"
            >
              <span class="font-medium">{{ h.item }}</span>
              <span class="text-gray-400 text-xs">
                {{ new Date(h.timestamp).toLocaleTimeString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 항목 관리 -->
      <div class="space-y-4">
        <!-- 옵션 토글 -->
        <button
          @click="showOptions = !showOptions"
          class="w-full flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span class="font-medium text-gray-900 dark:text-white">
            {{ t('tools.roulette.options') }}
          </span>
          <svg
            class="w-5 h-5 text-gray-500 transition-transform"
            :class="{ 'rotate-180': showOptions }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- 옵션 패널 -->
        <div v-if="showOptions" class="card space-y-4">
          <!-- 기본 옵션 -->
          <div class="space-y-3">
            <label class="flex items-center justify-between">
              <span class="text-gray-700 dark:text-gray-300">{{ t('tools.roulette.animation') }}</span>
              <input type="checkbox" v-model="animationEnabled" class="w-5 h-5 rounded text-primary-600" />
            </label>

            <label class="flex items-center justify-between">
              <span class="text-gray-700 dark:text-gray-300">{{ t('tools.roulette.sound') }}</span>
              <input type="checkbox" v-model="soundEnabled" class="w-5 h-5 rounded text-primary-600" />
            </label>

            <div class="flex items-center justify-between">
              <span class="text-gray-700 dark:text-gray-300">{{ t('tools.roulette.duration') }}</span>
              <select v-model.number="spinDuration" class="input w-32 py-1">
                <option :value="2000">2{{ t('tools.roulette.seconds') }}</option>
                <option :value="3000">3{{ t('tools.roulette.seconds') }}</option>
                <option :value="4500">4.5{{ t('tools.roulette.seconds') }}</option>
                <option :value="6000">6{{ t('tools.roulette.seconds') }}</option>
                <option :value="8000">8{{ t('tools.roulette.seconds') }}</option>
                <option :value="10000">10{{ t('tools.roulette.seconds') }}</option>
              </select>
            </div>
          </div>

          <!-- 고급 옵션 토글 -->
          <button
            @click="showAdvanced = !showAdvanced"
            class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {{ showAdvanced ? t('tools.roulette.hideAdvanced') : t('tools.roulette.showAdvanced') }}
          </button>

          <!-- 고급 옵션 -->
          <div v-if="showAdvanced" class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <!-- 중복 규칙 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tools.roulette.duplicateRule') }}
              </label>
              <select v-model="duplicateMode" class="input">
                <option value="allow">{{ t('tools.roulette.duplicateAllow') }}</option>
                <option value="exclude_once">{{ t('tools.roulette.duplicateExcludeOnce') }}</option>
                <option value="cooldown">{{ t('tools.roulette.duplicateCooldown') }}</option>
              </select>

              <div v-if="duplicateMode === 'cooldown'" class="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  v-model.number="cooldownRounds"
                  min="1"
                  max="10"
                  class="input w-20 py-1"
                />
                <span class="text-sm text-gray-500">{{ t('tools.roulette.cooldownRounds') }}</span>
              </div>
            </div>

            <!-- 가중치 모드 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tools.roulette.probabilityMode') }}
              </label>
              <select v-model="weightMode" class="input">
                <option value="equal">{{ t('tools.roulette.probabilityEqual') }}</option>
                <option value="weighted">{{ t('tools.roulette.probabilityWeighted') }}</option>
              </select>
            </div>

            <!-- 공정성 모드 -->
            <div>
              <label class="flex items-center gap-2 mb-2">
                <input type="checkbox" v-model="fairnessMode" class="w-4 h-4 rounded text-primary-600" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('tools.roulette.fairnessMode') }}
                </span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {{ t('tools.roulette.fairnessDesc') }}
              </p>

              <div v-if="fairnessMode" class="flex items-center gap-2">
                <input
                  type="text"
                  v-model="manualSeed"
                  :placeholder="t('tools.roulette.seedPlaceholder')"
                  class="input py-1 text-sm"
                />
              </div>
            </div>

            <!-- 제외 초기화 -->
            <button
              @click="resetExclusions"
              class="btn btn-secondary text-sm w-full"
            >
              {{ t('tools.roulette.resetExclusions') }}
            </button>
          </div>
        </div>

        <!-- 항목 입력 -->
        <div class="card">
          <div class="flex gap-2 mb-4">
            <button
              @click="inputMode = 'single'"
              :class="inputMode === 'single' ? 'btn-primary' : 'btn-secondary'"
              class="btn text-sm flex-1"
            >
              {{ t('tools.roulette.inputSingle') }}
            </button>
            <button
              @click="inputMode = 'multi'"
              :class="inputMode === 'multi' ? 'btn-primary' : 'btn-secondary'"
              class="btn text-sm flex-1"
            >
              {{ t('tools.roulette.inputMulti') }}
            </button>
            <button
              @click="inputMode = 'preset'"
              :class="inputMode === 'preset' ? 'btn-primary' : 'btn-secondary'"
              class="btn text-sm flex-1"
            >
              {{ t('tools.roulette.inputPreset') }}
            </button>
          </div>

          <!-- 단일 입력 -->
          <div v-if="inputMode === 'single'" class="flex gap-2">
            <input
              type="text"
              v-model="singleInput"
              @keyup.enter="addSingleItem"
              :placeholder="t('tools.roulette.itemPlaceholder')"
              class="input flex-1"
            />
            <button @click="addSingleItem" class="btn btn-primary">
              {{ t('tools.roulette.add') }}
            </button>
          </div>

          <!-- 멀티 입력 -->
          <div v-if="inputMode === 'multi'" class="space-y-2">
            <textarea
              v-model="multiInput"
              :placeholder="t('tools.roulette.multiPlaceholder')"
              rows="4"
              class="textarea"
            ></textarea>
            <button @click="addMultiItems" class="btn btn-primary w-full">
              {{ t('tools.roulette.addAll') }}
            </button>
          </div>

          <!-- 프리셋 -->
          <div v-if="inputMode === 'preset'" class="space-y-2">
            <select v-model="selectedPreset" class="input">
              <option value="">{{ t('tools.roulette.selectPreset') }}</option>
              <option value="lunch">{{ t('tools.roulette.presetLunch') }}</option>
              <option value="penalty">{{ t('tools.roulette.presetPenalty') }}</option>
              <option value="chores">{{ t('tools.roulette.presetChores') }}</option>
              <option value="movies">{{ t('tools.roulette.presetMovies') }}</option>
              <option value="routine">{{ t('tools.roulette.presetRoutine') }}</option>
            </select>
            <button
              @click="applyPreset"
              :disabled="!selectedPreset"
              class="btn btn-primary w-full disabled:opacity-50"
            >
              {{ t('tools.roulette.applyPreset') }}
            </button>
          </div>
        </div>

        <!-- 항목 리스트 -->
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ t('tools.roulette.itemList') }} ({{ items.length }})
            </h3>
            <button
              @click="clearDuplicates"
              class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {{ t('tools.roulette.clearDuplicates') }}
            </button>
          </div>

          <!-- 확률 미리보기 (가중치 모드) -->
          <div v-if="weightMode === 'weighted'" class="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ t('tools.roulette.probabilityPreview') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="item in itemProbabilities.slice(0, 8)"
                :key="item.id"
                class="text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              >
                {{ item.name }}: {{ item.probability.toFixed(1) }}%
              </span>
              <span v-if="itemProbabilities.length > 8" class="text-xs text-gray-400">
                +{{ itemProbabilities.length - 8 }}
              </span>
            </div>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto">
            <div
              v-for="(item, index) in items"
              :key="item.id"
              :draggable="true"
              @dragstart="onDragStart(index)"
              @dragover="(e) => onDragOver(e, index)"
              @dragend="onDragEnd"
              class="flex items-center gap-2 p-2 rounded-lg transition-colors cursor-move"
              :class="[
                item.active
                  ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'bg-gray-100 dark:bg-gray-800 opacity-50',
                draggedIndex === index && 'ring-2 ring-primary-500'
              ]"
            >
              <!-- 드래그 핸들 -->
              <div class="text-gray-400 cursor-grab">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
                </svg>
              </div>

              <!-- 색상 표시 -->
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: COLORS[index % COLORS.length] }"
              ></div>

              <!-- 항목명 -->
              <span class="flex-1 truncate text-gray-900 dark:text-white">
                {{ item.name }}
              </span>

              <!-- 가중치 (가중치 모드) -->
              <div v-if="weightMode === 'weighted'" class="flex items-center gap-1">
                <input
                  type="number"
                  :value="item.weight"
                  @input="updateItemWeight(item.id, parseInt($event.target.value) || 1)"
                  min="1"
                  max="100"
                  class="w-14 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
              </div>

              <!-- 쿨다운 표시 -->
              <span v-if="item.excludeCount > 0" class="text-xs text-gray-400">
                ({{ item.excludeCount }})
              </span>

              <!-- 토글 -->
              <button
                @click="toggleItem(item.id)"
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                :title="item.active ? t('tools.roulette.deactivate') : t('tools.roulette.activate')"
              >
                <svg v-if="item.active" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <svg v-else class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </button>

              <!-- 삭제 -->
              <button
                @click="removeItem(item.id)"
                class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="items.length === 0" class="text-center py-8 text-gray-500">
            {{ t('tools.roulette.noItems') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 결과 모달 -->
    <Teleport to="body">
      <div
        v-if="showResult"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showResult = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full animate-bounce-in">
          <div class="text-center">
            <div class="text-5xl mb-4">🎯</div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {{ t('tools.roulette.resultTitle') }}
            </h2>
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4 break-words">
              {{ resultItem?.name }}
            </div>

            <!-- 공정성 모드 시드 표시 -->
            <div v-if="fairnessMode && resultSeed" class="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('tools.roulette.seedLabel') }}</p>
              <code class="text-sm font-mono">{{ resultSeed }}</code>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-6">
            <button @click="showResult = false" class="btn btn-primary w-full">
              {{ t('tools.roulette.confirm') }}
            </button>
            <button @click="spinAgain" :disabled="!canSpin" class="btn btn-secondary w-full disabled:opacity-50">
              {{ t('tools.roulette.spinAgain') }}
            </button>
            <button
              @click="excludeAndSpin"
              :disabled="activeItems.length <= 2"
              class="btn btn-secondary w-full disabled:opacity-50"
            >
              {{ t('tools.roulette.excludeAndSpin') }}
            </button>
            <div class="flex gap-2">
              <button @click="generateShareUrl('result')" class="btn btn-secondary flex-1 text-sm">
                {{ t('tools.roulette.shareResult') }}
              </button>
              <button @click="saveAsImage" class="btn btn-secondary flex-1 text-sm">
                {{ t('tools.roulette.saveImage') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 저장 모달 -->
    <Teleport to="body">
      <div
        v-if="showSaveModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showSaveModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 m-4 max-w-md w-full">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {{ t('tools.roulette.saveRoulette') }}
          </h2>
          <input
            type="text"
            v-model="currentRouletteName"
            :placeholder="t('tools.roulette.rouletteName')"
            class="input mb-4"
            @keyup.enter="saveToFavorites"
          />
          <div class="flex gap-2">
            <button @click="showSaveModal = false" class="btn btn-secondary flex-1">
              {{ t('tools.roulette.cancel') }}
            </button>
            <button
              @click="saveToFavorites"
              :disabled="!currentRouletteName.trim()"
              class="btn btn-primary flex-1 disabled:opacity-50"
            >
              {{ t('tools.roulette.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 불러오기 모달 -->
    <Teleport to="body">
      <div
        v-if="showLoadModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showLoadModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 m-4 max-w-md w-full">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {{ t('tools.roulette.loadRoulette') }}
          </h2>

          <div v-if="favorites.length === 0" class="text-center py-8 text-gray-500">
            {{ t('tools.roulette.noFavorites') }}
          </div>

          <div v-else class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-for="fav in favorites"
              :key="fav.id"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <button @click="loadFromFavorite(fav)" class="flex-1 text-left">
                <p class="font-medium text-gray-900 dark:text-white">{{ fav.name }}</p>
                <p class="text-xs text-gray-500">{{ fav.items.length }} {{ t('tools.roulette.items') }}</p>
              </button>
              <button
                @click="deleteFavorite(fav.id)"
                class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <button @click="showLoadModal = false" class="btn btn-secondary w-full mt-4">
            {{ t('tools.roulette.close') }}
          </button>
        </div>
      </div>
    </Teleport>

    <!-- 공유 모달 -->
    <Teleport to="body">
      <div
        v-if="showShareModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showShareModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 m-4 max-w-md w-full">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {{ shareType === 'roulette' ? t('tools.roulette.shareRoulette') : t('tools.roulette.shareResult') }}
          </h2>

          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
            <p class="text-xs text-gray-500 mb-2">{{ t('tools.roulette.shareUrl') }}</p>
            <p class="text-sm break-all font-mono">{{ shareUrl }}</p>
          </div>

          <div class="flex gap-2">
            <button @click="showShareModal = false" class="btn btn-secondary flex-1">
              {{ t('tools.roulette.close') }}
            </button>
            <button @click="copyShareUrl" class="btn btn-primary flex-1">
              {{ t('common.copy') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ToolGuide toolKey="roulette" />
  </div>
</template>

<style scoped>
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}
</style>
