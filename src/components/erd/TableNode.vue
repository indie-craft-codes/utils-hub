<script setup>
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
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
        :class="{ 'primary-key': column.isPrimaryKey }"
      >
        <div class="column-info">
          <span class="column-icons">{{ column.icons }}</span>
          <span class="column-name">{{ column.name }}</span>
        </div>
        <div class="column-type">{{ column.type }}</div>
      </div>
    </div>

    <!-- Vue Flow Handles (연결점) -->
    <Handle type="target" :position="Position.Left" class="handle" />
    <Handle type="source" :position="Position.Right" class="handle" />
    <Handle type="target" :position="Position.Top" class="handle" />
    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.table-node {
  min-width: 250px;
  background: white;
  border: 2px solid #6366f1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  font-size: 13px;
}

.dark .table-node {
  background: #1f2937;
  border-color: #818cf8;
}

.table-header {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 12px;
  font-weight: 600;
}

.table-name {
  font-size: 15px;
  font-weight: 700;
}

.physical-name {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: 400;
}

.table-body {
  padding: 0;
}

.column-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s;
}

.dark .column-row {
  border-bottom-color: #374151;
}

.column-row:hover {
  background-color: #f3f4f6;
}

.dark .column-row:hover {
  background-color: #374151;
}

.column-row:last-child {
  border-bottom: none;
}

.column-row.primary-key {
  background-color: #eef2ff;
  font-weight: 600;
}

.dark .column-row.primary-key {
  background-color: #312e81;
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
  background: #6366f1;
  border: 2px solid white;
}

.dark .handle {
  border-color: #1f2937;
}
</style>
