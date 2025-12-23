<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { categories, findCategoryByRoute } from '@/data/categories'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const hoveredCategory = ref(null)
const popupPosition = ref({ top: 0 })
const isPopupHovered = ref(false)
const leaveTimer = ref(null)

// 현재 활성화된 카테고리 및 도구 찾기
const activeItem = computed(() => {
  return findCategoryByRoute(route.path)
})

function handleCategoryHover(category, event) {
  // 기존 타이머 취소
  if (leaveTimer.value) {
    clearTimeout(leaveTimer.value)
    leaveTimer.value = null
  }

  hoveredCategory.value = category
  const rect = event.currentTarget.getBoundingClientRect()
  popupPosition.value = { top: rect.top }
}

function handleCategoryLeave() {
  // 기존 타이머 취소
  if (leaveTimer.value) {
    clearTimeout(leaveTimer.value)
  }

  // 팝업으로 마우스가 이동할 수 있도록 딜레이 (200ms로 증가)
  leaveTimer.value = setTimeout(() => {
    if (!isPopupHovered.value) {
      hoveredCategory.value = null
    }
    leaveTimer.value = null
  }, 200)
}

function handlePopupEnter() {
  // 타이머 취소
  if (leaveTimer.value) {
    clearTimeout(leaveTimer.value)
    leaveTimer.value = null
  }
  isPopupHovered.value = true
}

function handlePopupLeave() {
  isPopupHovered.value = false
  hoveredCategory.value = null
}

function goToHome() {
  router.push('/')
}

function goToTool(toolRoute) {
  router.push(toolRoute)
  hoveredCategory.value = null
  isPopupHovered.value = false
}

function isCategoryActive(category) {
  return activeItem.value?.category?.id === category.id
}

function isToolActive(tool) {
  return activeItem.value?.tool?.id === tool.id
}
</script>

<template>
  <div class="hidden lg:flex flex-col w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-screen z-40">
    <!-- 홈 버튼 -->
    <button
      @click="goToHome"
      :class="[
        'flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 transition-colors',
        route.path === '/'
          ? 'bg-primary-500 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      ]"
      :title="t('common.home')"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>

    <!-- 카테고리 아이콘들 -->
    <div class="flex-1 overflow-y-auto">
      <button
        v-for="category in categories"
        :key="category.id"
        @mouseenter="(e) => handleCategoryHover(category, e)"
        @mouseleave="handleCategoryLeave"
        :class="[
          'flex items-center justify-center w-full h-16 transition-colors relative',
          isCategoryActive(category)
            ? 'bg-primary-500 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        ]"
        :title="t(`categories.${category.id}`)"
      >
        <div v-html="category.icon"></div>
      </button>
    </div>

    <!-- 호버 팝업 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="hoveredCategory"
          @mouseenter="handlePopupEnter"
          @mouseleave="handlePopupLeave"
          :style="{ top: `${popupPosition.top}px` }"
          class="fixed left-16 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 z-50"
        >
          <!-- 카테고리 헤더 -->
          <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <div
                :class="[hoveredCategory.color, 'p-1.5 rounded-lg text-white']"
                v-html="hoveredCategory.icon"
              ></div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ t(`categories.${hoveredCategory.id}`) }}
              </h3>
            </div>
          </div>

          <!-- 도구 목록 -->
          <div class="py-1">
            <button
              v-for="tool in hoveredCategory.tools"
              :key="tool.id"
              @click="goToTool(tool.route)"
              :class="[
                'w-full px-4 py-2 flex items-center gap-3 transition-colors text-left',
                isToolActive(tool)
                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              <span class="text-xl">{{ tool.icon }}</span>
              <span class="font-medium">{{ t(`tools.${tool.id}.title`) }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
