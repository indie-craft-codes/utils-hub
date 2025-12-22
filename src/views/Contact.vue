<script setup>
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
      {{ safeT('contact.title', '연락처') }}
    </h1>

    <div class="prose dark:prose-invert max-w-none space-y-8">
      <!-- 연락 방법 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('contact.methods.title', '연락 방법') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ safeT('contact.methods.content', 'Utils Hub에 대한 문의, 제안, 버그 신고는 아래 방법을 통해 연락해 주세요.') }}
        </p>
      </section>

      <!-- GitHub Issues -->
      <section class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {{ safeT('contact.github.title', 'GitHub Issues') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ safeT('contact.github.content', '기능 요청, 버그 신고, 개선 제안은 GitHub Issues를 통해 받고 있습니다.') }}
        </p>
        <a
          href="https://github.com/indie-craft-codes/utils-hub/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
          {{ safeT('contact.github.button', 'GitHub Issues 열기') }}
        </a>
      </section>

      <!-- 문의 유형 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('contact.types.title', '문의 유형') }}
        </h2>
        <div class="grid gap-4 mt-4">
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {{ safeT('contact.types.bug.title', '버그 신고') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ safeT('contact.types.bug.content', '서비스 이용 중 발견한 오류나 문제점을 알려주세요.') }}
            </p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {{ safeT('contact.types.feature.title', '기능 요청') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ safeT('contact.types.feature.content', '새로운 도구나 기능에 대한 아이디어를 공유해 주세요.') }}
            </p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {{ safeT('contact.types.feedback.title', '피드백') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ safeT('contact.types.feedback.content', '서비스 개선을 위한 의견이나 제안을 보내주세요.') }}
            </p>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-2">
              {{ safeT('contact.types.privacy.title', '개인정보 관련') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ safeT('contact.types.privacy.content', '개인정보 처리에 관한 문의는 별도로 연락해 주세요.') }}
            </p>
          </div>
        </div>
      </section>

      <!-- 응답 안내 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('contact.response.title', '응답 안내') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('contact.response.content', '문의하신 내용은 순차적으로 확인하여 답변드리고 있습니다. 답변까지 시간이 소요될 수 있는 점 양해 부탁드립니다.') }}
        </p>
      </section>
    </div>
  </div>
</template>
