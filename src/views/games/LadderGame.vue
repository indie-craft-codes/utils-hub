<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import html2canvas from 'html2canvas'
import GIF from 'gif.js'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const ladderContainer = ref(null)
const isSaving = ref(false)

const participants = ref(['', '', '', ''])
const results = ref(['', '', '', ''])
const ladderRows = ref(6)
const bridges = ref([])
const gamePhase = ref('input') // 'input' | 'ready' | 'running'
const animatingIndex = ref(-1)
const animationProgress = ref(0)
const revealedResults = ref([]) // { participantIndex, path, endCol }

const colors = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
]

const getColor = (index) => colors[index % colors.length]

const addColumn = () => {
  if (participants.value.length < 10) {
    participants.value.push('')
    results.value.push('')
  }
}

const removeColumn = () => {
  if (participants.value.length > 2) {
    participants.value.pop()
    results.value.pop()
  }
}

const canStart = computed(() => {
  const validParticipants = participants.value.filter(p => p.trim()).length
  const validResults = results.value.filter(r => r.trim()).length
  return validParticipants >= 2 && validResults >= 2
})

const generateBridges = () => {
  const cols = participants.value.length - 1
  const newBridges = []

  for (let row = 0; row < ladderRows.value; row++) {
    newBridges[row] = []
    for (let col = 0; col < cols; col++) {
      if (col > 0 && newBridges[row][col - 1]) {
        newBridges[row][col] = false
      } else {
        newBridges[row][col] = Math.random() < 0.4
      }
    }
  }

  bridges.value = newBridges
}

const tracePath = (startCol) => {
  const path = []
  let col = startCol

  path.push({ x: getColX(col), y: 0 })

  for (let row = 0; row < ladderRows.value; row++) {
    const rowY = (row + 1) * (280 / (ladderRows.value + 1))

    // 세로 이동 (가로선 위치까지)
    path.push({ x: getColX(col), y: rowY })

    // 가로선 체크
    if (col > 0 && bridges.value[row][col - 1]) {
      // 왼쪽으로 이동
      path.push({ x: getColX(col - 1), y: rowY })
      col = col - 1
    } else if (col < participants.value.length - 1 && bridges.value[row][col]) {
      // 오른쪽으로 이동
      path.push({ x: getColX(col + 1), y: rowY })
      col = col + 1
    }
  }

  path.push({ x: getColX(col), y: 280 })

  return { path, endCol: col }
}

const getPathLength = (path) => {
  let length = 0
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    length += Math.sqrt(dx * dx + dy * dy)
  }
  return length
}

const pathToSvgD = (path) => {
  if (path.length === 0) return ''
  let d = `M ${path[0].x} ${path[0].y}`
  for (let i = 1; i < path.length; i++) {
    d += ` L ${path[i].x} ${path[i].y}`
  }
  return d
}

const getPointAtProgress = (path, progress) => {
  if (path.length === 0) return { x: 0, y: 0 }
  if (progress <= 0) return path[0]
  if (progress >= 1) return path[path.length - 1]

  const totalLength = getPathLength(path)
  const targetLength = totalLength * progress

  let currentLength = 0
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    const segmentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength + segmentLength >= targetLength) {
      const t = (targetLength - currentLength) / segmentLength
      return {
        x: path[i - 1].x + dx * t,
        y: path[i - 1].y + dy * t
      }
    }
    currentLength += segmentLength
  }

  return path[path.length - 1]
}

const startGame = () => {
  if (!canStart.value) return
  generateBridges()
  gamePhase.value = 'ready'
  revealedResults.value = []
  animatingIndex.value = -1
  animationProgress.value = 0
}

const animatePath = (index, path, endCol) => {
  return new Promise((resolve) => {
    animatingIndex.value = index
    animationProgress.value = 0

    const duration = 1500 // 1.5초
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // easeOutCubic for smooth deceleration
      animationProgress.value = 1 - Math.pow(1 - progress, 3)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 애니메이션 완료
        revealedResults.value.push({
          participantIndex: index,
          path,
          endCol,
          color: getColor(index)
        })
        animatingIndex.value = -1
        animationProgress.value = 0
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
}

const currentAnimatingPath = computed(() => {
  if (animatingIndex.value < 0) return null
  const { path } = tracePath(animatingIndex.value)
  return path
})

const currentPosition = computed(() => {
  if (!currentAnimatingPath.value) return null
  return getPointAtProgress(currentAnimatingPath.value, animationProgress.value)
})

const currentPathD = computed(() => {
  if (!currentAnimatingPath.value) return ''
  const path = currentAnimatingPath.value
  const pos = currentPosition.value

  // 현재 위치까지의 경로만 그리기
  const totalLength = getPathLength(path)
  const targetLength = totalLength * animationProgress.value

  let currentLength = 0
  const visiblePath = [path[0]]

  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    const segmentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength + segmentLength <= targetLength) {
      visiblePath.push(path[i])
      currentLength += segmentLength
    } else {
      visiblePath.push(pos)
      break
    }
  }

  return pathToSvgD(visiblePath)
})

const onClickParticipant = async (index) => {
  if (gamePhase.value !== 'ready') return
  if (revealedResults.value.some(r => r.participantIndex === index)) return
  if (!participants.value[index]?.trim()) return

  gamePhase.value = 'running'
  const { path, endCol } = tracePath(index)
  await animatePath(index, path, endCol)
  gamePhase.value = 'ready'
}

const onClickResult = async (index) => {
  if (gamePhase.value !== 'ready') return
  if (revealedResults.value.some(r => r.endCol === index)) return
  if (!results.value[index]?.trim()) return

  // 결과에서 역추적하여 참가자 찾기
  for (let pIdx = 0; pIdx < participants.value.length; pIdx++) {
    if (!participants.value[pIdx]?.trim()) continue
    if (revealedResults.value.some(r => r.participantIndex === pIdx)) continue

    const { endCol } = tracePath(pIdx)
    if (endCol === index) {
      await onClickParticipant(pIdx)
      break
    }
  }
}

const showAllResults = async () => {
  if (gamePhase.value !== 'ready') return

  for (let i = 0; i < participants.value.length; i++) {
    if (!participants.value[i]?.trim()) continue
    if (revealedResults.value.some(r => r.participantIndex === i)) continue

    gamePhase.value = 'running'
    const { path, endCol } = tracePath(i)
    await animatePath(i, path, endCol)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  gamePhase.value = 'ready'
}

const reset = () => {
  gamePhase.value = 'input'
  bridges.value = []
  animatingIndex.value = -1
  animationProgress.value = 0
  revealedResults.value = []
}

// SVG viewBox 기준 (500px)
const getColX = (colIndex) => {
  const totalWidth = 500
  const padding = participants.value.length <= 4 ? 50 :
                  participants.value.length <= 6 ? 35 : 20
  const usableWidth = totalWidth - padding * 2
  const gap = usableWidth / (participants.value.length - 1)
  return padding + colIndex * gap
}

// 퍼센트 기준 (입력 박스용)
const getColPercent = (colIndex) => {
  const padding = participants.value.length <= 4 ? 10 :
                  participants.value.length <= 6 ? 7 : 4
  const usableWidth = 100 - padding * 2
  const gap = usableWidth / (participants.value.length - 1)
  return padding + colIndex * gap
}

const isRevealed = (participantIndex) => {
  return revealedResults.value.some(r => r.participantIndex === participantIndex)
}

const getRevealedByParticipant = (participantIndex) => {
  return revealedResults.value.find(r => r.participantIndex === participantIndex)
}

const getRevealedByResult = (resultIndex) => {
  return revealedResults.value.find(r => r.endCol === resultIndex)
}

// === PNG 저장 기능 ===
const savePng = async () => {
  if (!ladderContainer.value || isSaving.value) return
  isSaving.value = true

  try {
    const canvas = await html2canvas(ladderContainer.value, {
      backgroundColor: '#ffffff',
      scale: 2
    })
    const link = document.createElement('a')
    link.download = 'ladder-result.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('PNG save failed:', e)
  } finally {
    isSaving.value = false
  }
}

// === GIF 저장 기능 (분리됨 - 삭제 가능) ===
const saveGif = async () => {
  if (!ladderContainer.value || isSaving.value) return
  if (revealedResults.value.length === 0) return

  isSaving.value = true

  try {
    // 임시로 결과와 애니메이션 상태 저장
    const savedRevealed = [...revealedResults.value]
    const originalPhase = gamePhase.value

    // GIF 생성기 초기화
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: ladderContainer.value.offsetWidth * 2,
      height: ladderContainer.value.offsetHeight * 2,
      workerScript: '/gif.worker.js'
    })

    // 각 경로별로 프레임 캡처
    revealedResults.value = []
    gamePhase.value = 'ready'

    // 초기 프레임
    let canvas = await html2canvas(ladderContainer.value, { backgroundColor: '#ffffff', scale: 2 })
    gif.addFrame(canvas, { delay: 500 })

    // 각 결과 순차적으로 추가하며 프레임 캡처
    for (const revealed of savedRevealed) {
      revealedResults.value.push(revealed)
      await new Promise(resolve => setTimeout(resolve, 50))
      canvas = await html2canvas(ladderContainer.value, { backgroundColor: '#ffffff', scale: 2 })
      gif.addFrame(canvas, { delay: 800 })
    }

    // 마지막 프레임 유지
    gif.addFrame(canvas, { delay: 2000 })

    // GIF 렌더링
    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'ladder-result.gif'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      isSaving.value = false
    })

    gif.render()

    // 상태 복원
    revealedResults.value = savedRevealed
    gamePhase.value = originalPhase
  } catch (e) {
    console.error('GIF save failed:', e)
    isSaving.value = false
  }
}
// === GIF 저장 기능 끝 ===
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.ladder.title') }}
      </h1>
    </div>

    <!-- Ladder Container -->
    <div ref="ladderContainer" class="card">
      <!-- 안내 문구 -->
      <div class="text-center mb-4">
        <span class="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
          <template v-if="gamePhase === 'input'">
            {{ t('tools.ladder.inputGuide') }}
          </template>
          <template v-else>
            {{ t('tools.ladder.clickGuide') }}
          </template>
        </span>
      </div>

      <!-- 참가자 수 조절 (입력 모드에서만) -->
      <div v-if="gamePhase === 'input'" class="flex justify-center gap-2 mb-4">
        <button @click="removeColumn" :disabled="participants.length <= 2" class="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50">
          - {{ t('tools.ladder.decrease') }}
        </button>
        <span class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
          {{ participants.length }}{{ t('tools.ladder.people') }}
        </span>
        <button @click="addColumn" :disabled="participants.length >= 10" class="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50">
          + {{ t('tools.ladder.increase') }}
        </button>
      </div>

      <!-- 사다리 영역 -->
      <div class="relative w-full">
        <!-- 상단 입력 (참가자) -->
        <div class="relative h-8 mb-2">
          <template v-for="(_, index) in participants" :key="'p-' + index">
            <div
              class="absolute flex flex-col items-center"
              :style="{ left: `${getColPercent(index)}%`, transform: 'translateX(-50%)', width: '60px' }"
            >
              <input
                v-if="gamePhase === 'input'"
                v-model="participants[index]"
                type="text"
                class="w-full px-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                style="height: 28px; line-height: 28px;"
                :placeholder="String(index + 1)"
              />
              <button
                v-else
                @click="onClickParticipant(index)"
                :disabled="gamePhase === 'running' || isRevealed(index) || !participants[index]?.trim()"
                class="w-full px-1 text-center text-sm border-2 rounded font-medium transition-all truncate"
                style="height: 28px; line-height: 24px;"
                :style="isRevealed(index) ? {
                  borderColor: getRevealedByParticipant(index)?.color,
                  backgroundColor: getRevealedByParticipant(index)?.color + '20',
                  color: getRevealedByParticipant(index)?.color
                } : {}"
                :class="!isRevealed(index) && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ participants[index] || index + 1 }}
              </button>
            </div>
          </template>
        </div>

        <!-- SVG 사다리 -->
        <svg width="100%" height="280" viewBox="0 0 500 280" preserveAspectRatio="none">
          <!-- 세로선 -->
          <line
            v-for="(_, colIndex) in participants"
            :key="'vline-' + colIndex"
            :x1="getColX(colIndex)"
            :y1="0"
            :x2="getColX(colIndex)"
            :y2="280"
            stroke="currentColor"
            class="text-gray-800 dark:text-gray-300"
            stroke-width="2"
          />

          <!-- 가로선 (게임 시작 후에만 표시) -->
          <template v-if="gamePhase !== 'input'">
            <template v-for="(row, rowIndex) in bridges" :key="'row-' + rowIndex">
              <line
                v-for="(hasBridge, colIndex) in row"
                v-show="hasBridge"
                :key="'bridge-' + rowIndex + '-' + colIndex"
                :x1="getColX(colIndex)"
                :y1="(rowIndex + 1) * (280 / (ladderRows + 1))"
                :x2="getColX(colIndex + 1)"
                :y2="(rowIndex + 1) * (280 / (ladderRows + 1))"
                stroke="currentColor"
                class="text-gray-800 dark:text-gray-300"
                stroke-width="2"
              />
            </template>
          </template>

          <!-- 공개된 경로들 -->
          <path
            v-for="(revealed, rIdx) in revealedResults"
            :key="'revealed-' + rIdx"
            :d="pathToSvgD(revealed.path)"
            fill="none"
            :stroke="revealed.color"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 현재 애니메이션 경로 -->
          <path
            v-if="currentPathD"
            :d="currentPathD"
            fill="none"
            :stroke="getColor(animatingIndex)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 현재 위치 표시 (공) -->
          <circle
            v-if="currentPosition"
            :cx="currentPosition.x"
            :cy="currentPosition.y"
            r="8"
            :fill="getColor(animatingIndex)"
          >
            <animate
              attributeName="r"
              values="8;10;8"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <!-- 하단 입력 (결과) -->
        <div class="relative h-8 mt-2">
          <template v-for="(_, index) in results" :key="'r-' + index">
            <div
              class="absolute flex flex-col items-center"
              :style="{ left: `${getColPercent(index)}%`, transform: 'translateX(-50%)', width: '60px' }"
            >
              <input
                v-if="gamePhase === 'input'"
                v-model="results[index]"
                type="text"
                class="w-full px-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                style="height: 28px; line-height: 28px;"
                :placeholder="String(index + 1)"
              />
              <button
                v-else
                @click="onClickResult(index)"
                :disabled="gamePhase === 'running' || getRevealedByResult(index) || !results[index]?.trim()"
                class="w-full px-1 text-center text-sm border-2 rounded font-medium transition-all truncate"
                style="height: 28px; line-height: 24px;"
                :style="getRevealedByResult(index) ? {
                  borderColor: getRevealedByResult(index)?.color,
                  backgroundColor: getRevealedByResult(index)?.color + '20',
                  color: getRevealedByResult(index)?.color
                } : {}"
                :class="!getRevealedByResult(index) && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ results[index] || index + 1 }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- 버튼들 -->
      <div class="flex justify-center gap-4 mt-6">
        <template v-if="gamePhase === 'input'">
          <button
            @click="startGame"
            :disabled="!canStart"
            class="btn btn-primary px-6 disabled:opacity-50"
          >
            {{ t('tools.ladder.start') }}
          </button>
        </template>
        <template v-else>
          <button @click="reset" :disabled="gamePhase === 'running'" class="btn btn-secondary px-6 disabled:opacity-50">
            {{ t('tools.ladder.back') }}
          </button>
          <button
            @click="showAllResults"
            :disabled="gamePhase === 'running'"
            class="btn btn-primary px-6 disabled:opacity-50"
          >
            {{ t('tools.ladder.showAll') }}
          </button>
        </template>
      </div>

      <!-- 결과 요약 -->
      <div v-if="revealedResults.length > 0" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div class="space-y-2">
          <div
            v-for="(revealed, idx) in revealedResults"
            :key="'result-' + idx"
            class="flex items-center justify-center gap-3 text-sm"
          >
            <span class="font-medium" :style="{ color: revealed.color }">
              {{ participants[revealed.participantIndex] }}
            </span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span class="font-medium" :style="{ color: revealed.color }">
              {{ results[revealed.endCol] }}
            </span>
          </div>
        </div>

        <!-- 저장 버튼 -->
        <div class="flex justify-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="savePng"
            :disabled="isSaving"
            class="btn btn-secondary text-sm py-2 px-4 disabled:opacity-50"
          >
            {{ isSaving ? t('tools.ladder.saving') : t('tools.ladder.savePng') }}
          </button>
          <!-- GIF 저장 버튼 (분리됨 - 삭제 가능) -->
          <button
            @click="saveGif"
            :disabled="isSaving"
            class="btn btn-secondary text-sm py-2 px-4 disabled:opacity-50"
          >
            {{ isSaving ? t('tools.ladder.saving') : t('tools.ladder.saveGif') }}
          </button>
          <!-- GIF 저장 버튼 끝 -->
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="2345678901" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
