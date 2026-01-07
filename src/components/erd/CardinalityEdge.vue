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

// 카디널리티 텍스트 위치 계산
const sourceCardinalityPos = computed(() => {
  const offsetX = props.sourcePosition === 'right' ? 20 : props.sourcePosition === 'left' ? -20 : 0
  const offsetY = props.sourcePosition === 'bottom' ? 20 : props.sourcePosition === 'top' ? -20 : 0
  return {
    x: props.sourceX + offsetX,
    y: props.sourceY + offsetY
  }
})

const targetCardinalityPos = computed(() => {
  const offsetX = props.targetPosition === 'right' ? 20 : props.targetPosition === 'left' ? -20 : 0
  const offsetY = props.targetPosition === 'bottom' ? 20 : props.targetPosition === 'top' ? -20 : 0
  return {
    x: props.targetX + offsetX,
    y: props.targetY + offsetY
  }
})

// 라벨 중앙 위치 계산
const labelPos = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2
  }
})
</script>

<template>
  <BaseEdge :id="id" :style="style" :path="path" :marker-end="markerEnd" />

  <EdgeLabelRenderer>
    <!-- Source 카디널리티 -->
    <div
      v-if="data?.cardinality?.source"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${sourceCardinalityPos.x}px, ${sourceCardinalityPos.y}px)`,
        pointerEvents: 'none',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#ffffff',
        padding: '2px 6px',
        borderRadius: '3px',
        border: '1px solid #e5e7eb'
      }"
      class="nodrag nopan"
    >
      {{ data.cardinality.source }}
    </div>

    <!-- Target 카디널리티 -->
    <div
      v-if="data?.cardinality?.target"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${targetCardinalityPos.x}px, ${targetCardinalityPos.y}px)`,
        pointerEvents: 'none',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#ffffff',
        padding: '2px 6px',
        borderRadius: '3px',
        border: '1px solid #e5e7eb'
      }"
      class="nodrag nopan"
    >
      {{ data.cardinality.target }}
    </div>

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
