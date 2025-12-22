<script setup>
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}

const features = [
  { icon: '🎲', key: 'games' },
  { icon: '👨‍💻', key: 'developer' },
  { icon: '🔄', key: 'converter' },
  { icon: '📝', key: 'text' },
  { icon: '🔢', key: 'calculator' }
]
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
      {{ safeT('about.title', 'Utils Hub 소개') }}
    </h1>

    <div class="prose dark:prose-invert max-w-none space-y-8">
      <!-- 서비스 소개 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('about.intro.title', '서비스 소개') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('about.intro.content', 'Utils Hub는 일상과 개발에 필요한 다양한 온라인 유틸리티 도구를 무료로 제공하는 웹 서비스입니다. 복잡한 설치 없이 브라우저에서 바로 사용할 수 있습니다.') }}
        </p>
      </section>

      <!-- 주요 특징 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('about.features.title', '주요 특징') }}
        </h2>
        <div class="grid gap-4 mt-4">
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-2xl">🔒</span>
            <div>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT('about.features.privacy.title', '개인정보 보호') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ safeT('about.features.privacy.content', '모든 데이터 처리는 브라우저에서 이루어지며, 서버로 전송되지 않습니다.') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-2xl">⚡</span>
            <div>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT('about.features.fast.title', '빠른 속도') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ safeT('about.features.fast.content', '최신 웹 기술을 활용하여 빠르고 반응성 있는 사용자 경험을 제공합니다.') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-2xl">🌐</span>
            <div>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT('about.features.language.title', '다국어 지원') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ safeT('about.features.language.content', '한국어와 영어를 지원하며, 더 많은 언어를 추가할 예정입니다.') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-2xl">🌙</span>
            <div>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT('about.features.theme.title', '다크 모드') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ safeT('about.features.theme.content', '라이트 모드와 다크 모드를 지원하여 편안한 사용 환경을 제공합니다.') }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span class="text-2xl">📱</span>
            <div>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT('about.features.responsive.title', '반응형 디자인') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ safeT('about.features.responsive.content', 'PC, 태블릿, 모바일 등 모든 기기에서 최적화된 화면을 제공합니다.') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 제공 도구 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('about.tools.title', '제공 도구') }}
        </h2>
        <div class="grid gap-4 mt-4 sm:grid-cols-2">
          <div v-for="feature in features" :key="feature.key" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">{{ feature.icon }}</span>
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                {{ safeT(`about.tools.${feature.key}.title`, feature.key) }}
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ safeT(`about.tools.${feature.key}.content`, '') }}
            </p>
          </div>
        </div>
      </section>

      <!-- 오픈 소스 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('about.opensource.title', '오픈 소스') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ safeT('about.opensource.content', 'Utils Hub는 오픈 소스 프로젝트입니다. GitHub에서 소스 코드를 확인하고 기여할 수 있습니다.') }}
        </p>
        <a
          href="https://github.com/indie-craft-codes/utils-hub"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
          {{ safeT('about.opensource.link', 'GitHub에서 보기') }}
        </a>
      </section>
    </div>
  </div>
</template>
