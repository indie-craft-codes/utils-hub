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
      { id: 'roulette', route: '/games/roulette', icon: '🎡' },
      { id: 'ladder', route: '/games/ladder', icon: '🪜' },
      { id: 'numberPicker', route: '/games/number', icon: '🎲' },
      { id: 'teamDivider', route: '/games/team', icon: '👥' },
      { id: 'fortune', route: '/games/fortune', icon: '🔮' },
      { id: 'mbti', route: '/games/mbti', icon: '🧠' },
      { id: 'tetoEgen', route: '/games/teto-egen', icon: '🎭' }
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
      { id: 'jwt', route: '/developer/jwt', icon: '🔐' },
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
      { id: 'unit', route: '/calculator/unit', icon: '📐' },
      { id: 'koreanAge', route: '/calculator/korean-age', icon: '👶' }
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
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
        {{ t('home.subtitle', '일상과 개발에 필요한 다양한 온라인 유틸리티 도구') }}
      </p>
      <p class="text-base text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
        {{ t('home.description', 'Utils Hub는 복잡한 설치 없이 브라우저에서 바로 사용할 수 있는 무료 온라인 도구 모음입니다. 모든 데이터는 브라우저에서 처리되어 서버로 전송되지 않으므로 개인정보가 보호됩니다.') }}
      </p>
    </div>

    <!-- Features Section -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      <div class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl mb-2">🔒</div>
        <h3 class="font-medium text-gray-900 dark:text-white text-sm">{{ t('home.features.privacy', '개인정보 보호') }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('home.features.privacyDesc', '서버 전송 없음') }}</p>
      </div>
      <div class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl mb-2">⚡</div>
        <h3 class="font-medium text-gray-900 dark:text-white text-sm">{{ t('home.features.fast', '빠른 속도') }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('home.features.fastDesc', '설치 없이 즉시 사용') }}</p>
      </div>
      <div class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl mb-2">🌐</div>
        <h3 class="font-medium text-gray-900 dark:text-white text-sm">{{ t('home.features.language', '다국어 지원') }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('home.features.languageDesc', '한국어, 영어') }}</p>
      </div>
      <div class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl mb-2">📱</div>
        <h3 class="font-medium text-gray-900 dark:text-white text-sm">{{ t('home.features.responsive', '반응형') }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('home.features.responsiveDesc', '모든 기기 지원') }}</p>
      </div>
    </div>

    <!-- Tools Section Title -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('home.toolsTitle', '제공 도구') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('home.toolsDescription', '아래 도구들을 클릭하여 바로 사용해 보세요') }}
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

    <!-- How to Use Section -->
    <div class="mt-16 mb-12">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        {{ t('home.howToUse.title', '사용 방법') }}
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.howToUse.step1.title', '도구 선택') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.howToUse.step1.description', '위 목록에서 필요한 도구를 클릭하세요.') }}</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.howToUse.step2.title', '데이터 입력') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.howToUse.step2.description', '필요한 정보를 입력하거나 파일을 업로드하세요.') }}</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.howToUse.step3.title', '결과 확인') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.howToUse.step3.description', '즉시 결과를 확인하고 다운로드하거나 복사하세요.') }}</p>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        {{ t('home.faq.title', '자주 묻는 질문') }}
      </h2>
      <div class="space-y-4 max-w-3xl mx-auto">
        <div class="bg-white dark:bg-gray-700 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.faq.q1.question', 'Q. 무료로 사용할 수 있나요?') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.faq.q1.answer', 'A. 네, 모든 도구는 무료로 제공됩니다. 회원가입 없이 바로 사용할 수 있습니다.') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-700 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.faq.q2.question', 'Q. 내 데이터는 안전한가요?') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.faq.q2.answer', 'A. 네, 모든 데이터 처리는 브라우저에서 이루어지며 서버로 전송되지 않습니다. 개인정보가 완전히 보호됩니다.') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-700 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.faq.q3.question', 'Q. 모바일에서도 사용할 수 있나요?') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.faq.q3.answer', 'A. 네, 반응형 디자인으로 스마트폰, 태블릿, PC 등 모든 기기에서 사용할 수 있습니다.') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-700 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ t('home.faq.q4.question', 'Q. 새로운 도구를 요청할 수 있나요?') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('home.faq.q4.answer', 'A. 네, GitHub Issues를 통해 새로운 도구나 기능을 요청하실 수 있습니다.') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
