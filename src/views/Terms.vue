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
      {{ safeT('terms.title', '이용약관') }}
    </h1>

    <div class="prose dark:prose-invert max-w-none space-y-8">
      <!-- 서비스 소개 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.introduction.title', '서비스 소개') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('terms.introduction.content', 'Utils Hub(이하 "본 서비스")는 다양한 온라인 유틸리티 도구를 무료로 제공하는 웹 서비스입니다. 본 이용약관은 서비스 이용에 관한 기본적인 사항을 규정합니다.') }}
        </p>
      </section>

      <!-- 이용 조건 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.conditions.title', '이용 조건') }}
        </h2>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>{{ safeT('terms.conditions.item1', '본 서비스는 누구나 무료로 이용할 수 있습니다.') }}</li>
          <li>{{ safeT('terms.conditions.item2', '서비스 이용 시 관련 법령 및 본 약관을 준수해야 합니다.') }}</li>
          <li>{{ safeT('terms.conditions.item3', '타인의 권리를 침해하거나 불법적인 목적으로 사용할 수 없습니다.') }}</li>
        </ul>
      </section>

      <!-- 서비스 내용 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.services.title', '제공 서비스') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ safeT('terms.services.content', '본 서비스는 다음과 같은 유틸리티 도구를 제공합니다:') }}
        </p>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>{{ safeT('terms.services.item1', '게임/랜덤 도구: 사다리타기, 룰렛, 숫자 뽑기, 팀 나누기 등') }}</li>
          <li>{{ safeT('terms.services.item2', '개발자 도구: JSON 파서, UUID 생성기, 타임스탬프 변환기 등') }}</li>
          <li>{{ safeT('terms.services.item3', '변환 도구: 이미지 변환, QR코드 생성, 메타데이터 추출 등') }}</li>
          <li>{{ safeT('terms.services.item4', '텍스트 도구: 인코딩/디코딩, 해시 생성, 문자열 변환 등') }}</li>
          <li>{{ safeT('terms.services.item5', '계산기: D-day 계산기, 단위 변환기 등') }}</li>
        </ul>
      </section>

      <!-- 데이터 처리 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.data.title', '데이터 처리') }}
        </h2>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>{{ safeT('terms.data.item1', '모든 데이터 처리는 사용자의 브라우저에서 이루어지며, 서버로 전송되지 않습니다.') }}</li>
          <li>{{ safeT('terms.data.item2', '일부 기능은 브라우저의 localStorage를 사용하여 데이터를 저장합니다.') }}</li>
          <li>{{ safeT('terms.data.item3', '저장된 데이터는 사용자가 직접 삭제하거나 브라우저 설정에서 삭제할 수 있습니다.') }}</li>
        </ul>
      </section>

      <!-- 광고 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.advertising.title', '광고') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('terms.advertising.content', '본 서비스는 Google AdSense를 통해 광고를 게재합니다. 광고는 서비스 운영 및 유지를 위한 목적으로 사용됩니다.') }}
        </p>
      </section>

      <!-- 면책조항 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.disclaimer.title', '면책조항') }}
        </h2>
        <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li>{{ safeT('terms.disclaimer.item1', '본 서비스는 "있는 그대로" 제공되며, 특정 목적에 대한 적합성을 보장하지 않습니다.') }}</li>
          <li>{{ safeT('terms.disclaimer.item2', '서비스 이용으로 인해 발생하는 직접적, 간접적 손해에 대해 책임지지 않습니다.') }}</li>
          <li>{{ safeT('terms.disclaimer.item3', '서비스의 정확성, 완전성, 신뢰성에 대해 보증하지 않습니다.') }}</li>
          <li>{{ safeT('terms.disclaimer.item4', '예고 없이 서비스를 변경, 중단할 수 있습니다.') }}</li>
        </ul>
      </section>

      <!-- 지적재산권 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.intellectual.title', '지적재산권') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('terms.intellectual.content', '본 서비스의 디자인, 로고, 소프트웨어 등 지적재산권은 Utils Hub에 있습니다. 무단 복제, 배포, 수정은 금지됩니다.') }}
        </p>
      </section>

      <!-- 약관 변경 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.changes.title', '약관 변경') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('terms.changes.content', '본 이용약관은 필요에 따라 변경될 수 있으며, 변경 시 본 페이지에 게시됩니다. 변경된 약관은 게시 즉시 효력이 발생합니다.') }}
        </p>
      </section>

      <!-- 문의 -->
      <section>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ safeT('terms.contact.title', '문의') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ safeT('terms.contact.content', '이용약관에 관한 문의사항은 GitHub Issues를 통해 연락해 주세요.') }}
        </p>
      </section>

      <!-- 시행일 -->
      <section class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-500">
          {{ safeT('terms.effectiveDate', '시행일: 2024년 12월 22일') }}
        </p>
      </section>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="7890123456" adFormat="auto" :fullWidth="true" />
  </div>
</template>
