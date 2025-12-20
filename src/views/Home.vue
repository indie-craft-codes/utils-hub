<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const categories = [
  {
    id: 'games',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    color: 'bg-pink-500',
    tools: [
      { id: 'ladder', route: '/games/ladder', icon: '🪜' },
      { id: 'numberPicker', route: '/games/number', icon: '🎲' },
      { id: 'teamDivider', route: '/games/team', icon: '👥' }
    ]
  },
  {
    id: 'developer',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>`,
    color: 'bg-blue-500',
    tools: [
      { id: 'json', route: '/developer/json', icon: '{ }' },
      { id: 'uuid', route: '/developer/uuid', icon: '🔑' },
      { id: 'timestamp', route: '/developer/timestamp', icon: '⏱️' },
      { id: 'password', route: '/developer/password', icon: '🔒' }
    ]
  },
  {
    id: 'converter',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>`,
    color: 'bg-green-500',
    tools: [
      { id: 'converter', route: '/converter/image', icon: '🖼️' },
      { id: 'qrcode', route: '/converter/qrcode', icon: '📱' },
      { id: 'metadata', route: '/converter/metadata', icon: '🔍' }
    ]
  },
  {
    id: 'text',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
    color: 'bg-purple-500',
    tools: [
      { id: 'text', route: '/text/tools', icon: 'Aa' }
    ]
  },
  {
    id: 'calculator',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>`,
    color: 'bg-orange-500',
    tools: [
      { id: 'dday', route: '/calculator/dday', icon: '📅' },
      { id: 'unit', route: '/calculator/unit', icon: '📐' }
    ]
  }
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {{ t('common.title') }}
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        All-in-one utility tools for everyday use
      </p>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="category in categories" :key="category.id" class="space-y-3">
        <!-- Category Header -->
        <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div :class="[category.color, 'p-1.5 rounded-lg text-white']" v-html="category.icon"></div>
          <h2 class="font-semibold text-gray-900 dark:text-white">
            {{ t(`categories.${category.id}`) }}
          </h2>
        </div>

        <!-- Tools List -->
        <div class="space-y-2">
          <router-link
            v-for="tool in category.tools"
            :key="tool.id"
            :to="tool.route"
            class="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-md transition-all group"
          >
            <span class="text-xl">{{ tool.icon }}</span>
            <div class="min-w-0">
              <p class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ t(`tools.${tool.id}.title`) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ t(`tools.${tool.id}.description`) }}
              </p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
