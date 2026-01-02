<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import TableNode from '../../components/erd/TableNode.vue'
import AdBanner from '../../components/AdBanner.vue'
import { parseMultipleDDL } from '../../utils/ddl/mysqlParser'
import { convertToFlowElements, toggleLogicalPhysical, saveNodePositions, restoreNodePositions } from '../../utils/erd/erdConverter'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

// Vue Flow setup
const { onNodesChange, onEdgesChange, onNodeDragStop, fitView } = useVueFlow()

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

// 커스텀 노드 타입
const nodeTypes = {
  custom: TableNode
}

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

  // 자동 정렬
  setTimeout(() => {
    fitView({ padding: 0.2, duration: 500 })
  }, 100)

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
    nodes.value = toggleLogicalPhysical(nodes.value, tables.value, newValue)
  }
})

// 노드 드래그 종료 시 위치 저장
onNodeDragStop(() => {
  saveNodePositions(nodes.value)
})

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

// ERD 이미지로 다운로드 (추후 구현)
const downloadImage = () => {
  // TODO: html2canvas 또는 Vue Flow의 toObject() 사용
  alert('이미지 다운로드 기능은 추후 추가 예정입니다.')
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
        <button @click="clearAll" class="btn btn-secondary">
          {{ t('common.clear') }}
        </button>
        <button @click="downloadImage" :disabled="nodes.length === 0" class="btn btn-secondary disabled:opacity-50">
          {{ t('tools.erd.downloadImage') }}
        </button>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
          {{ error }}
        </p>
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
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        class="erd-canvas"
        :default-edge-options="{ type: 'smoothstep' }"
      >
        <Background pattern-color="#aaa" :gap="16" />
        <Controls />
        <MiniMap v-if="showMiniMap" />
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
