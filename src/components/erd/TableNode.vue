<script setup>
import { Handle, Position } from '@vue-flow/core'
import { inject, ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

// ERDGenerator에서 제공하는 설정
const showColumnDetails = inject('showColumnDetails', ref(true))
</script>

<template>
  <div class="table-node">
    <!-- 테이블 헤더 -->
    <div class="table-header">
      <div class="table-name">{{ data.label }}</div>
      <div v-if="data.physicalName !== data.label" class="physical-name">
        {{ data.physicalName }}
      </div>
    </div>

    <!-- 컬럼 목록 -->
    <div class="table-body">
      <div
        v-for="(column, index) in data.columns"
        :key="index"
        class="column-row"
        :class="{
          'primary-key': column.isPrimaryKey,
          'separator-top': index > 0 && (data.columns[index - 1].isPrimaryKey || data.columns[index - 1].isForeignKey) && !column.isPrimaryKey && !column.isForeignKey
        }"
      >
        <div class="column-info">
          <span v-if="showColumnDetails.value" class="column-icons">{{ column.icons }}</span>
          <span class="column-name">{{ column.name }}</span>
        </div>
        <div v-if="showColumnDetails.value" class="column-type">{{ column.type }}</div>
      </div>
    </div>

    <!-- Vue Flow Handles (연결점) - 모든 방향에서 source/target 가능 -->
    <Handle id="left" type="source" :position="Position.Left" class="handle" />
    <Handle id="left-target" type="target" :position="Position.Left" class="handle handle-hidden" />
    <Handle id="right" type="source" :position="Position.Right" class="handle" />
    <Handle id="right-target" type="target" :position="Position.Right" class="handle handle-hidden" />
    <Handle id="top" type="source" :position="Position.Top" class="handle" />
    <Handle id="top-target" type="target" :position="Position.Top" class="handle handle-hidden" />
    <Handle id="bottom" type="source" :position="Position.Bottom" class="handle" />
    <Handle id="bottom-target" type="target" :position="Position.Bottom" class="handle handle-hidden" />
  </div>
</template>

<style scoped>
.table-node {
  min-width: 200px;
  background: white;
  border: 1px solid #4b5563;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  font-size: 12px;
}

.dark .table-node {
  background: #1f2937;
  border-color: #6b7280;
}

.table-header {
  background: #f3f4f6;
  color: #1f2937;
  padding: 8px 12px;
  font-weight: 600;
  border-bottom: 1px solid #4b5563;
}

.dark .table-header {
  background: #374151;
  color: #f3f4f6;
  border-bottom-color: #6b7280;
}

.table-name {
  font-size: 14px;
  font-weight: 700;
}

.physical-name {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
  font-weight: 400;
}

.table-body {
  padding: 0;
}

.column-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s;
}

.dark .column-row {
  border-bottom-color: #4b5563;
}

.column-row:hover {
  background-color: #f9fafb;
}

.dark .column-row:hover {
  background-color: #374151;
}

.column-row:last-child {
  border-bottom: none;
}

.column-row.primary-key {
  background-color: #f9fafb;
  font-weight: 600;
}

.dark .column-row.primary-key {
  background-color: #374151;
}

.column-row.separator-top {
  border-top: 2px solid #4b5563 !important;
}

.dark .column-row.separator-top {
  border-top-color: #6b7280 !important;
}

.column-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.column-icons {
  font-size: 11px;
  min-width: 20px;
}

.column-name {
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .column-name {
  color: #e5e7eb;
}

.column-type {
  color: #6b7280;
  font-size: 11px;
  margin-left: 8px;
  white-space: nowrap;
}

.dark .column-type {
  color: #9ca3af;
}

.handle {
  width: 8px;
  height: 8px;
  background: #6b7280;
  border: 2px solid white;
}

.dark .handle {
  background: #9ca3af;
  border-color: #1f2937;
}

.handle-hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
