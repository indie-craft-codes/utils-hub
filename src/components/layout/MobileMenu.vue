<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { categories, findCategoryByRoute } from '@/data/categories'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:isOpen'])

const expandedCategories = ref(new Set())

// 현재 활성화된 카테고리 및 도구 찾기
const activeItem = computed(() => {
  return findCategoryByRoute(route.path)
})

// 메뉴가 열릴 때 현재 카테고리를 자동으로 펼침
function initExpandedCategories() {
  if (activeItem.value?.category) {
    expandedCategories.value.add(activeItem.value.category.id)
  }
}

// isOpen이 true가 되면 현재 카테고리 펼침
function handleOpen() {
  if (props.isOpen) {
    initExpandedCategories()
  }
}

// 프롭 변경 감지
import { watch } from 'vue'
watch(() => props.isOpen, handleOpen)

function toggleCategory(categoryId) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

function isCategoryExpanded(categoryId) {
  return expandedCategories.value.has(categoryId)
}

function closeMenu() {
  emit('update:isOpen', false)
}

function goToHome() {
  router.push('/')
  closeMenu()
}

function goToTool(toolRoute) {
  router.push(toolRoute)
  closeMenu()
}

function isCategoryActive(category) {
  return activeItem.value?.category?.id === category.id
}

function isToolActive(tool) {
  return activeItem.value?.tool?.id === tool.id
}
</script>

<template>
  <!-- 오버레이 배경 -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
      @click="closeMenu"
    ></div>
  </Transition>

  <!-- 메뉴 슬라이드 -->
  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed top-0 left-0 w-full h-full bg-white dark:bg-gray-900 z-50 overflow-y-auto lg:hidden"
    >
      <!-- 헤더 -->
      <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between z-10">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ t('navigation.menu') }}
        </h2>
        <button
          @click="closeMenu"
          class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 메뉴 내용 -->
      <div class="p-4">
        <!-- 홈 버튼 -->
        <button
          @click="goToHome"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors',
            route.path === '/'
              ? 'bg-primary-500 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="font-medium">{{ t('common.home') }}</span>
        </button>

        <!-- 카테고리 아코디언 -->
        <div class="space-y-2">
          <div
            v-for="category in categories"
            :key="category.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <!-- 카테고리 헤더 -->
            <button
              @click="toggleCategory(category.id)"
              :class="[
                'w-full flex items-center justify-between px-4 py-3 transition-colors',
                isCategoryActive(category)
                  ? 'bg-primary-50 dark:bg-primary-900'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[category.color, 'p-1.5 rounded-lg text-white']"
                  v-html="category.icon"
                ></div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ t(`categories.${category.id}`) }}
                </span>
              </div>
              <svg
                :class="[
                  'w-5 h-5 transition-transform text-gray-500',
                  isCategoryExpanded(category.id) ? 'rotate-180' : ''
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- 도구 목록 -->
            <Transition name="expand">
              <div
                v-if="isCategoryExpanded(category.id)"
                class="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
              >
                <button
                  v-for="tool in category.tools"
                  :key="tool.id"
                  @click="goToTool(tool.route)"
                  :class="[
                    'w-full flex items-center gap-3 px-6 py-3 transition-colors text-left',
                    isToolActive(tool)
                      ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                >
                  <span class="text-xl">{{ tool.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{{ t(`tools.${tool.id}.title`) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ t(`tools.${tool.id}.description`) }}
                    </p>
                  </div>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 페이드 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* 아코디언 확장 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
