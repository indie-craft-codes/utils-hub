<script setup>
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'

const props = defineProps({
  id: String,
  sourceX: Number,
  sourceY: Number,
  targetX: Number,
  targetY: Number,
  sourcePosition: String,
  targetPosition: String,
  data: Object,
  markerEnd: String,
  style: Object,
  label: String,
  labelStyle: Object,
  labelBgStyle: Object,
  labelBgPadding: Array
})

// 경로 계산
const path = computed(() => {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition
  })
  return edgePath
})

// 라벨 중앙 위치 계산
const labelPos = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2
  }
})

// 카디널리티에 따른 마커 ID 계산
const markerStartId = computed(() => {
  const cardinality = props.data?.cardinality?.source
  if (cardinality === '1') return 'url(#erd-one-start)'
  if (cardinality === 'N') return 'url(#erd-many-start)'
  return ''
})

const markerEndId = computed(() => {
  const cardinality = props.data?.cardinality?.target
  if (cardinality === '1') return 'url(#erd-one-end)'
  if (cardinality === 'N') return 'url(#erd-many-end)'
  return ''
})
</script>

<template>
  <!-- SVG 마커 정의 (Crow's Foot Notation) -->
  <svg style="position: absolute; width: 0; height: 0;">
    <defs>
      <!-- One (1) - 두 개의 수직선 || (source용) -->
      <marker
        id="erd-one-start"
        viewBox="0 0 20 20"
        refX="10"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto-start-reverse"
      >
        <line x1="10" y1="4" x2="10" y2="16" stroke="#6b7280" stroke-width="1.5" />
        <line x1="7" y1="4" x2="7" y2="16" stroke="#6b7280" stroke-width="1.5" />
      </marker>

      <!-- One (1) - 두 개의 수직선 || (target용) -->
      <marker
        id="erd-one-end"
        viewBox="0 0 20 20"
        refX="10"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <line x1="10" y1="4" x2="10" y2="16" stroke="#6b7280" stroke-width="1.5" />
        <line x1="13" y1="4" x2="13" y2="16" stroke="#6b7280" stroke-width="1.5" />
      </marker>

      <!-- Many (N) - 까마귀 발 ⟨ (source용) -->
      <marker
        id="erd-many-start"
        viewBox="0 0 20 20"
        refX="10"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto-start-reverse"
      >
        <!-- 중앙 수직선 -->
        <line x1="10" y1="4" x2="10" y2="16" stroke="#6b7280" stroke-width="1.5" />
        <!-- 위쪽 대각선 -->
        <line x1="10" y1="4" x2="4" y2="4" stroke="#6b7280" stroke-width="1.5" />
        <!-- 아래쪽 대각선 -->
        <line x1="10" y1="16" x2="4" y2="16" stroke="#6b7280" stroke-width="1.5" />
      </marker>

      <!-- Many (N) - 까마귀 발 ⟩ (target용) -->
      <marker
        id="erd-many-end"
        viewBox="0 0 20 20"
        refX="10"
        refY="10"
        markerWidth="20"
        markerHeight="20"
        orient="auto"
      >
        <!-- 중앙 수직선 -->
        <line x1="10" y1="4" x2="10" y2="16" stroke="#6b7280" stroke-width="1.5" />
        <!-- 위쪽 대각선 -->
        <line x1="10" y1="4" x2="16" y2="4" stroke="#6b7280" stroke-width="1.5" />
        <!-- 아래쪽 대각선 -->
        <line x1="10" y1="16" x2="16" y2="16" stroke="#6b7280" stroke-width="1.5" />
      </marker>
    </defs>
  </svg>

  <!-- 엣지 렌더링 -->
  <BaseEdge
    :id="id"
    :style="style"
    :path="path"
    :marker-start="markerStartId"
    :marker-end="markerEndId"
  />

  <EdgeLabelRenderer>
    <!-- FK 컬럼명 라벨 -->
    <div
      v-if="label"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
        pointerEvents: 'all',
        ...labelStyle,
        backgroundColor: labelBgStyle?.fill || '#ffffff',
        padding: `${labelBgPadding?.[0] || 6}px ${labelBgPadding?.[1] || 3}px`,
        borderRadius: `${labelBgStyle?.rx || 2}px`,
        opacity: labelBgStyle?.fillOpacity || 0.95,
        fontSize: '11px',
        fontWeight: '500'
      }"
      class="nodrag nopan"
    >
      {{ label }}
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.nodrag {
  user-select: none;
}
</style>
