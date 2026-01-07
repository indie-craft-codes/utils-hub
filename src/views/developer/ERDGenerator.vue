<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueFlow, getSmoothStepPath, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import TableNode from '../../components/erd/TableNode.vue'
import AdBanner from '../../components/AdBanner.vue'
import { parseMultipleDDL } from '../../utils/ddl/mysqlParser'
import { convertToFlowElements, toggleLogicalPhysical, saveNodePositions, restoreNodePositions, updateEdgePositions, updateEdgeLabels } from '../../utils/erd/erdConverter'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

// 로컬스토리지 키
const STORAGE_KEY = 'erd-saved-ddls'

// 상태
const ddlInput = ref('')
const ddlList = ref([])
const tables = ref([])
const nodes = ref([])
const edges = ref([])
const error = ref('')
const useLogicalNames = ref(false)
const vendor = ref('mysql')
const showMiniMap = ref(true)
const savedDDLs = ref([]) // 로컬스토리지에 저장된 DDL 목록
const isDownloading = ref(false) // 이미지 다운로드 중 여부

// VueFlow 인스턴스 ref
const vueFlowRef = ref(null)

// 커스텀 노드 타입
const nodeTypes = {
  custom: TableNode
}

// 로컬스토리지에서 저장된 DDL 불러오기
const loadSavedDDLs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      savedDDLs.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('저장된 DDL 로드 실패:', e)
  }
}

// DDL을 로컬스토리지에 저장
const saveDDLToStorage = (name, ddl) => {
  try {
    const newSave = {
      id: Date.now(),
      name: name || `ERD ${new Date().toLocaleString()}`,
      ddl,
      createdAt: new Date().toISOString()
    }

    savedDDLs.value = [newSave, ...savedDDLs.value]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDDLs.value))

    return true
  } catch (e) {
    console.error('DDL 저장 실패:', e)
    error.value = 'DDL 저장에 실패했습니다.'
    return false
  }
}

// 저장된 DDL 불러오기
const loadDDLFromStorage = (savedDDL) => {
  ddlInput.value = savedDDL.ddl
  addDDL()
}

// 저장된 DDL 삭제
const deleteSavedDDL = (id) => {
  savedDDLs.value = savedDDLs.value.filter(d => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDDLs.value))
}

// 현재 DDL 저장
const saveCurrentDDL = () => {
  const name = prompt('ERD 이름을 입력하세요:', `ERD ${new Date().toLocaleString()}`)
  if (!name) return

  // 모든 DDL을 합쳐서 저장
  const allDDL = ddlList.value.map(d => d.ddl).join('\n\n')

  if (!allDDL) {
    error.value = '저장할 DDL이 없습니다.'
    return
  }

  if (saveDDLToStorage(name, allDDL)) {
    alert('ERD가 저장되었습니다.')
  }
}

// 컴포넌트 마운트 시 저장된 DDL 불러오기
loadSavedDDLs()

// DDL 추가
const addDDL = () => {
  if (!ddlInput.value.trim()) {
    error.value = t('tools.erd.emptyDDL')
    return
  }

  try {
    const result = parseMultipleDDL(ddlInput.value)

    if (result.errors.length > 0) {
      error.value = t('tools.erd.parseError') + ':\n' +
        result.errors.map(e => `- ${e.error}`).join('\n')
    }

    if (result.tables.length === 0) {
      error.value = t('tools.erd.noTables')
      return
    }

    // 기존 테이블과 병합 (중복 제거)
    const existingNames = new Set(tables.value.map(t => t.name))
    const newTables = result.tables.filter(t => !existingNames.has(t.name))

    tables.value = [...tables.value, ...newTables]
    ddlList.value.push({
      id: Date.now(),
      ddl: ddlInput.value,
      tables: newTables.map(t => t.name)
    })

    // ERD 생성
    generateERD()

    // 입력 초기화
    ddlInput.value = ''
    error.value = ''

    trackToolUsage('erd_add_ddl', { tableCount: newTables.length })
  } catch (e) {
    error.value = e.message
  }
}

// ERD 생성
const generateERD = () => {
  if (tables.value.length === 0) {
    error.value = t('tools.erd.noTables')
    return
  }

  const elements = convertToFlowElements(tables.value, useLogicalNames.value)

  // 저장된 위치 복원
  nodes.value = restoreNodePositions(elements.nodes)
  edges.value = elements.edges

  // 자동 정렬 및 엣지 재계산
  nextTick(() => {
    if (vueFlowRef.value) {
      vueFlowRef.value.fitView({ padding: 0.2, duration: 500 })

      // 노드가 렌더링되고 dimensions가 설정된 후 엣지 재계산
      setTimeout(() => {
        // 엣지를 완전히 비우고 재생성 (Vue Flow 강제 갱신)
        edges.value = []

        nextTick(() => {
          const updatedEdges = updateEdgePositions(nodes.value, elements.edges)
          edges.value = updatedEdges
        })
      }, 100)
    }
  })

  trackToolUsage('erd_generate', { tableCount: tables.value.length })
}

// DDL 삭제
const removeDDL = (id) => {
  const ddl = ddlList.value.find(d => d.id === id)
  if (!ddl) return

  // 해당 DDL의 테이블 제거
  tables.value = tables.value.filter(t => !ddl.tables.includes(t.name))
  ddlList.value = ddlList.value.filter(d => d.id !== id)

  // ERD 재생성
  if (tables.value.length > 0) {
    generateERD()
  } else {
    nodes.value = []
    edges.value = []
  }
}

// 논리/물리 모델 토글
watch(useLogicalNames, (newValue) => {
  if (nodes.value.length > 0) {
    // 실제 렌더링된 노드 크기를 DOM에서 직접 읽어오기
    const actualWidths = new Map()
    const actualHeights = new Map()
    const originalPositions = new Map() // 원래 위치 저장

    nodes.value.forEach(node => {
      // 원래 위치 저장 (토글 전)
      originalPositions.set(node.id, { x: node.position.x, y: node.position.y })

      // Vue Flow가 렌더링한 실제 DOM 요소 찾기
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
      if (nodeElement) {
        const width = nodeElement.offsetWidth || node.dimensions?.width
        const height = nodeElement.offsetHeight || node.dimensions?.height
        if (width) {
          actualWidths.set(node.id, width)
        }
        if (height) {
          actualHeights.set(node.id, height)
        }
      }
    })

    // 노드를 비우고 재생성 (Vue Flow 강제 갱신)
    // 중앙 위치를 유지하면서 텍스트만 변경
    const updatedNodes = toggleLogicalPhysical(nodes.value, tables.value, newValue, actualWidths, actualHeights)

    // 엣지 레이블 업데이트 (논리명/물리명)
    const updatedEdges = updateEdgeLabels(edges.value, tables.value, newValue)

    nodes.value = []
    edges.value = []

    nextTick(() => {
      nodes.value = updatedNodes

      // 2-pass: 실제 렌더링된 후 다시 크기를 읽어서 정확한 중앙 정렬
      nextTick(() => {
        setTimeout(() => {
          const newActualWidths = new Map()
          const newActualHeights = new Map()

          nodes.value.forEach(node => {
            const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
            if (nodeElement) {
              const width = nodeElement.offsetWidth
              const height = nodeElement.offsetHeight
              if (width) newActualWidths.set(node.id, width)
              if (height) newActualHeights.set(node.id, height)
            }
          })

          // 실제 렌더링된 크기와 비교하여 재조정
          const recenteredNodes = nodes.value.map(node => {
            const oldWidth = actualWidths.get(node.id)
            const oldHeight = actualHeights.get(node.id)
            const newWidth = newActualWidths.get(node.id)
            const newHeight = newActualHeights.get(node.id)
            const originalPos = originalPositions.get(node.id)

            if (!oldWidth || !oldHeight || !newWidth || !newHeight || !originalPos) {
              return node
            }

            // 기존 중앙점 (토글 전 - 원래 위치 사용)
            const oldCenterX = originalPos.x + oldWidth / 2
            const oldCenterY = originalPos.y + oldHeight / 2

            // 새 position (실제 렌더링된 크기 기준)
            const recenteredX = oldCenterX - newWidth / 2
            const recenteredY = oldCenterY - newHeight / 2

            console.log(`\n🔧 [${node.id}] 2차 조정`)
            console.log(`  원래 position: (${originalPos.x.toFixed(1)}, ${originalPos.y.toFixed(1)})`)
            console.log(`  원래 크기: ${oldWidth}px × ${oldHeight}px`)
            console.log(`  원래 중앙점: (${oldCenterX.toFixed(1)}, ${oldCenterY.toFixed(1)})`)
            console.log(`  실제 새 크기: ${newWidth}px × ${newHeight}px (DOM 재측정)`)
            console.log(`  최종 position: (${recenteredX.toFixed(1)}, ${recenteredY.toFixed(1)})`)
            console.log(`  최종 중앙점: (${(recenteredX + newWidth / 2).toFixed(1)}, ${(recenteredY + newHeight / 2).toFixed(1)})`)

            return {
              ...node,
              position: {
                x: recenteredX,
                y: recenteredY
              }
            }
          })

          nodes.value = recenteredNodes

          // 엣지 레이블 업데이트하여 복원
          edges.value = updatedEdges
        }, 50)
      })
    })
  }
})

// 노드 드래그 종료 시 위치 저장 및 엣지 재계산
const handleNodeDragStop = () => {
  saveNodePositions(nodes.value)

  // 현재 엣지 백업
  const currentEdges = [...edges.value]

  // 엣지를 완전히 비우고 재생성 (Vue Flow 강제 갱신)
  edges.value = []

  // nextTick을 사용하여 노드 위치가 완전히 업데이트된 후 엣지 재계산
  nextTick(() => {
    const updatedEdges = updateEdgePositions(nodes.value, currentEdges)
    edges.value = updatedEdges
  })
}

// 파일 업로드
const handleFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    ddlInput.value = e.target?.result
  }
  reader.readAsText(file)
}

// 전체 초기화
const clearAll = () => {
  ddlInput.value = ''
  ddlList.value = []
  tables.value = []
  nodes.value = []
  edges.value = []
  error.value = ''
}

// 전체 보기 (모든 노드를 화면에 맞춤)
const fitToView = () => {
  if (vueFlowRef.value) {
    vueFlowRef.value.fitView({ padding: 0.1, duration: 300 })
  }
}

// 줌 아웃 (50%로 축소)
const zoomOut = () => {
  if (vueFlowRef.value) {
    vueFlowRef.value.zoomTo(0.5, { duration: 300 })
  }
}

// 유틸 함수
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const raf = () => new Promise((r) => requestAnimationFrame(r))

// DOM/폰트/레이아웃이 안정될 때까지 기다리기
const waitForRenderStable = async (extraDelayMs = 500) => {
  console.log('🕐 렌더링 안정화 시작...')

  await nextTick()
  console.log('✅ nextTick 완료')

  await raf()
  await raf()          // 2프레임 정도 더 기다리기
  console.log('✅ 2프레임 렌더링 완료')

  if (document.fonts?.ready) {
    await document.fonts.ready
    console.log('✅ 폰트 로딩 완료')
  }

  await wait(extraDelayMs) // 마지막으로 짧게 딜레이
  console.log(`✅ 추가 ${extraDelayMs}ms 대기 완료`)
}

// ERD 이미지로 다운로드 (DOM 픽셀 좌표계 기반 - pan/zoom 안정)
const downloadImage = async () => {
  if (!vueFlowRef.value || nodes.value.length === 0 || isDownloading.value) return

  isDownloading.value = true

  try {
    const html2canvas = (await import('html2canvas')).default

    const viewportElement = vueFlowRef.value.$el.querySelector('.vue-flow__viewport')
    if (!viewportElement) {
      error.value = 'ERD 다이어그램을 찾을 수 없습니다.'
      return
    }

    const isDark = document.documentElement.classList.contains('dark')
    const backgroundColor = isDark ? '#111827' : '#fafafa'

    // ✅ 렌더 안정화 대기
    await waitForRenderStable(500)

    const vpRect = viewportElement.getBoundingClientRect()
    const nodeEls = viewportElement.querySelectorAll('.vue-flow__node')
    if (!nodeEls.length) {
      error.value = '캡처할 노드가 없습니다.'
      return
    }

    // ✅ DOM 픽셀 기준 bounds (노드 기준)
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    nodeEls.forEach((el) => {
      const r = el.getBoundingClientRect()
      const x1 = r.left - vpRect.left
      const y1 = r.top - vpRect.top
      const x2 = r.right - vpRect.left
      const y2 = r.bottom - vpRect.top

      minX = Math.min(minX, x1)
      minY = Math.min(minY, y1)
      maxX = Math.max(maxX, x2)
      maxY = Math.max(maxY, y2)
    })

    const padding = 150  // 패딩 증가 (80 → 150)
    const capX = minX - padding
    const capY = minY - padding
    const capW = (maxX - minX) + padding * 2
    const capH = (maxY - minY) + padding * 2

    if (capW <= 0 || capH <= 0) {
      error.value = '캡처 영역 계산에 실패했습니다.'
      return
    }

    // ✅ 크기에 따라 SCALE 자동 조정 (더 넓은 범위를 작은 스케일로)
    const maxDimension = Math.max(capW, capH)
    let SCALE = 1.5  // 기본 스케일 감소 (2 → 1.5)

    // 큰 다이어그램은 더 작은 스케일 사용
    if (maxDimension > 1500) {
      SCALE = Math.min(1.5, 6000 / maxDimension)  // 최대 출력 크기 증가 (4000 → 6000)
    }
    console.log(`📏 캡처 영역: ${capW.toFixed(0)}x${capH.toFixed(0)}, SCALE: ${SCALE.toFixed(2)}`)

    // ✅ 1) 노드만 html2canvas로 캡처 (엣지는 숨김)
    const nodeCanvas = await html2canvas(viewportElement, {
      backgroundColor: 'transparent',
      scale: SCALE,
      logging: false,
      useCORS: true,
      allowTaint: false,
      x: capX,
      y: capY,
      width: capW,
      height: capH,
      onclone: (clonedDoc) => {
        // ✅ edge 숨김 (우리가 직접 그림)
        clonedDoc.querySelectorAll('.vue-flow__edge').forEach(e => (e.style.display = 'none'))

        // Controls / MiniMap 숨김
        const controls = clonedDoc.querySelector('.vue-flow__controls')
        const minimap = clonedDoc.querySelector('.vue-flow__minimap')
        if (controls) controls.style.display = 'none'
        if (minimap) minimap.style.display = 'none'
      }
    })

    // ✅ 2) 최종 캔버스 생성 + 배경
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = capW * SCALE
    finalCanvas.height = capH * SCALE
    const ctx = finalCanvas.getContext('2d')

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

    // ✅ 3) edge를 DOM 기반으로 "직접" 그리기 (끊김 방지)
    const getHandleXY = (nodeId, handleId) => {
      const el = viewportElement.querySelector(`[data-id="${nodeId}"]`)
      if (!el) return null

      const r = el.getBoundingClientRect()
      const left = r.left - vpRect.left
      const top = r.top - vpRect.top
      const right = r.right - vpRect.left
      const bottom = r.bottom - vpRect.top
      const cx = (left + right) / 2
      const cy = (top + bottom) / 2

      switch (handleId) {
        case 'left':
        case 'left-target':
          return { x: left, y: cy, pos: Position.Left }
        case 'right':
        case 'right-target':
          return { x: right, y: cy, pos: Position.Right }
        case 'top':
        case 'top-target':
          return { x: cx, y: top, pos: Position.Top }
        case 'bottom':
        case 'bottom-target':
          return { x: cx, y: bottom, pos: Position.Bottom }
        default:
          return { x: right, y: cy, pos: Position.Right }
      }
    }

    ctx.save()
    ctx.strokeStyle = isDark ? '#6b7280' : '#9ca3af'
    ctx.lineWidth = 2

    edges.value.forEach((edge) => {
      const s = getHandleXY(edge.source, edge.sourceHandle)
      const t = getHandleXY(edge.target, edge.targetHandle)
      if (!s || !t) return

      const [pathData, labelX, labelY] = getSmoothStepPath({
        sourceX: (s.x - capX) * SCALE,
        sourceY: (s.y - capY) * SCALE,
        sourcePosition: s.pos,
        targetX: (t.x - capX) * SCALE,
        targetY: (t.y - capY) * SCALE,
        targetPosition: t.pos
      })

      // 선 그리기
      ctx.stroke(new Path2D(pathData))

      // 화살표 그리기 (target 쪽)
      const arrowSize = 10
      const tx = (t.x - capX) * SCALE
      const ty = (t.y - capY) * SCALE

      ctx.fillStyle = ctx.strokeStyle
      ctx.beginPath()

      // target position에 따라 화살표 방향 결정
      switch (t.pos) {
        case Position.Left:
          ctx.moveTo(tx, ty)
          ctx.lineTo(tx + arrowSize, ty - arrowSize / 2)
          ctx.lineTo(tx + arrowSize, ty + arrowSize / 2)
          break
        case Position.Right:
          ctx.moveTo(tx, ty)
          ctx.lineTo(tx - arrowSize, ty - arrowSize / 2)
          ctx.lineTo(tx - arrowSize, ty + arrowSize / 2)
          break
        case Position.Top:
          ctx.moveTo(tx, ty)
          ctx.lineTo(tx - arrowSize / 2, ty + arrowSize)
          ctx.lineTo(tx + arrowSize / 2, ty + arrowSize)
          break
        case Position.Bottom:
          ctx.moveTo(tx, ty)
          ctx.lineTo(tx - arrowSize / 2, ty - arrowSize)
          ctx.lineTo(tx + arrowSize / 2, ty - arrowSize)
          break
      }
      ctx.closePath()
      ctx.fill()

      // FK 레이블 그리기 (엣지 중간)
      if (edge.label) {
        ctx.font = '12px sans-serif'
        ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 배경 박스
        const text = edge.label
        const metrics = ctx.measureText(text)
        const padding = 4

        ctx.fillStyle = backgroundColor
        ctx.fillRect(
          labelX - metrics.width / 2 - padding,
          labelY - 8,
          metrics.width + padding * 2,
          16
        )

        // 텍스트
        ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280'
        ctx.fillText(text, labelX, labelY)
      }
    })

    ctx.restore()

    // ✅ 4) 노드를 edge 위에 합성
    ctx.drawImage(nodeCanvas, 0, 0)

    // ✅ 5) 다운로드
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        error.value = '이미지 생성에 실패했습니다. (CORS/taint 가능)'
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `erd-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png', 1.0)

    trackToolUsage('erd_download_image')
  } catch (err) {
    console.error('이미지 다운로드 실패:', err)
    error.value = `이미지 다운로드 중 오류가 발생했습니다: ${err.message}`
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.erd.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('tools.erd.description') }}
      </p>
    </div>

    <!-- 컨트롤 패널 -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <!-- DB 벤더 선택 -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('tools.erd.vendor') }}
          </label>
          <select v-model="vendor" class="input text-sm">
            <option value="mysql">MySQL</option>
            <option value="postgres" disabled>PostgreSQL (추후 지원)</option>
            <option value="oracle" disabled>Oracle (추후 지원)</option>
          </select>
        </div>

        <!-- 논리/물리 모델 토글 -->
        <div class="flex items-center gap-2">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="useLogicalNames" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ useLogicalNames ? t('tools.erd.logicalModel') : t('tools.erd.physicalModel') }}
            </span>
          </label>
        </div>

        <!-- 미니맵 토글 -->
        <div class="flex items-center gap-2">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="showMiniMap" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tools.erd.showMiniMap') }}
            </span>
          </label>
        </div>
      </div>

      <!-- DDL 입력 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.erd.inputDDL') }}
        </label>
        <textarea
          v-model="ddlInput"
          class="textarea font-mono text-sm h-48"
          :placeholder="t('tools.erd.placeholder')"
        ></textarea>
      </div>

      <!-- 액션 버튼 -->
      <div class="flex flex-wrap gap-3">
        <button @click="addDDL" class="btn btn-primary">
          {{ t('tools.erd.addDDL') }}
        </button>
        <label class="btn btn-secondary cursor-pointer">
          <input type="file" accept=".sql,.txt" @change="handleFileUpload" class="hidden" />
          {{ t('tools.erd.uploadFile') }}
        </label>
        <button @click="saveCurrentDDL" :disabled="ddlList.length === 0" class="btn btn-secondary disabled:opacity-50">
          💾 ERD 저장
        </button>
        <button @click="clearAll" class="btn btn-secondary">
          {{ t('common.clear') }}
        </button>
        <div class="border-l border-gray-300 dark:border-gray-600 h-8"></div>
        <button @click="fitToView" :disabled="nodes.length === 0" class="btn btn-secondary disabled:opacity-50">
          🔍 전체 보기
        </button>
        <button @click="zoomOut" :disabled="nodes.length === 0" class="btn btn-secondary disabled:opacity-50">
          🔎 축소 (50%)
        </button>
        <button @click="downloadImage" :disabled="nodes.length === 0 || isDownloading" class="btn btn-secondary disabled:opacity-50">
          {{ isDownloading ? '다운로드 중...' : t('tools.erd.downloadImage') }}
        </button>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
          {{ error }}
        </p>
      </div>

      <!-- 저장된 ERD -->
      <div v-if="savedDDLs.length > 0" class="mt-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📚 저장된 ERD
        </h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="saved in savedDDLs"
            :key="saved.id"
            class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ saved.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ new Date(saved.createdAt).toLocaleString() }}
              </p>
            </div>
            <div class="flex gap-2 ml-3">
              <button
                @click="loadDDLFromStorage(saved)"
                class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                title="불러오기"
              >
                불러오기
              </button>
              <button
                @click="deleteSavedDDL(saved.id)"
                class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                title="삭제"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DDL 목록 -->
      <div v-if="ddlList.length > 0" class="mt-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.erd.ddlList') }}
        </h3>
        <div class="space-y-2">
          <div
            v-for="ddl in ddlList"
            :key="ddl.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div class="flex-1">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ ddl.tables.join(', ') }}
              </span>
            </div>
            <button
              @click="removeDDL(ddl.id)"
              class="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ERD 다이어그램 -->
    <div class="card p-0 overflow-hidden" style="height: 700px;">
      <VueFlow
        ref="vueFlowRef"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        @node-drag-stop="handleNodeDragStop"
        class="erd-canvas"
        :default-edge-options="{ type: 'smoothstep' }"
        :nodes-connectable="false"
        :edges-updatable="false"
        :connect-on-click="false"
      >
        <Background pattern-color="#aaa" :gap="16" />
        <Controls />
        <MiniMap
          v-if="showMiniMap"
          :node-stroke-width="3"
          :node-color="(node) => '#6b7280'"
          :mask-color="'rgb(240, 240, 240, 0.8)'"
          pannable
          zoomable
        />
      </VueFlow>

      <!-- 빈 상태 -->
      <div
        v-if="nodes.length === 0"
        class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none"
      >
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <p class="text-lg font-medium">{{ t('tools.erd.emptyState') }}</p>
          <p class="text-sm mt-2">{{ t('tools.erd.emptyStateDesc') }}</p>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789013" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.erd-canvas {
  background-color: #fafafa;
}

.dark .erd-canvas {
  background-color: #111827;
}

.vue-flow__controls {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.vue-flow__minimap {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
</style>
