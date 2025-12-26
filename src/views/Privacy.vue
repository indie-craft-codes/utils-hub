<script setup>
import { useI18n } from 'vue-i18n'
import AdBanner from '../components/AdBanner.vue'

const { t, te } = useI18n()

const safeT = (key, fallback = '') => {
  return te(key) ? t(key) : fallback
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
      {{ safeT('privacy.title', '개인정보처리방침') }}
    </h1>

    <div class="prose dark:prose-invert max-w-none space-y-8">
      <!-- 개요 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.overview.title', '개요') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.overview.content', 'Utils Hub(이하 "본 사이트")는 사용자의 개인정보를 소중히 여기며, 관련 법령을 준수합니다.') }}
        </p>
      </section>

      <!-- 수집하는 정보 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.collection.title', '수집하는 정보') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.collection.content', '본 사이트는 개인정보를 직접 수집하지 않습니다. 모든 데이터는 사용자의 브라우저(localStorage)에만 저장되며, 서버로 전송되지 않습니다.') }}
        </p>
      </section>

      <!-- 광고 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.advertising.title', '광고') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ safeT('privacy.advertising.content', '본 사이트는 Google AdSense를 사용하여 광고를 게재합니다. Google은 쿠키를 사용하여 사용자의 관심사에 기반한 광고를 표시할 수 있습니다.') }}
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.advertising.optout', '사용자는 Google 광고 설정에서 맞춤 광고를 비활성화할 수 있습니다:') }}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Google 광고 설정
          </a>
        </p>
      </section>

      <!-- 쿠키 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.cookies.title', '쿠키 및 로컬 저장소') }}
        </h2>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>{{ safeT('privacy.cookies.localStorage', '테스트 결과, 설정 등은 브라우저의 localStorage에 저장됩니다.') }}</li>
          <li>{{ safeT('privacy.cookies.adsense', 'Google AdSense는 광고 목적으로 쿠키를 사용할 수 있습니다.') }}</li>
          <li>{{ safeT('privacy.cookies.clear', '브라우저 설정에서 언제든지 쿠키와 저장된 데이터를 삭제할 수 있습니다.') }}</li>
        </ul>
      </section>

      <!-- 제3자 서비스 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.thirdParty.title', '제3자 서비스') }}
        </h2>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>
            <strong>Google AdSense:</strong>
            {{ safeT('privacy.thirdParty.adsense', '광고 게재') }}
            (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">개인정보처리방침</a>)
          </li>
        </ul>
      </section>

      <!-- 데이터 보관 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.retention.title', '데이터 보관') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.retention.content', 'localStorage에 저장된 데이터는 30일 후 자동으로 삭제되거나, 사용자가 직접 삭제할 수 있습니다.') }}
        </p>
      </section>

      <!-- 문의 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.contact.title', '문의') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.contact.content', '개인정보 관련 문의사항은 GitHub Issues를 통해 연락해 주세요.') }}
        </p>
      </section>

      <!-- 변경사항 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('privacy.changes.title', '방침 변경') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('privacy.changes.content', '본 개인정보처리방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지에 게시됩니다.') }}
        </p>
      </section>

      <!-- 시행일 -->
      <section class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-500">
          {{ safeT('privacy.effectiveDate', '시행일: 2024년 12월 21일') }}
        </p>
      </section>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="7890123456" adFormat="auto" :fullWidth="true" />
  </div>
</template>
