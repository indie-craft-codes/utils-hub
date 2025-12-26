<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const birthDate = ref('')
const baseDate = ref('')
const showAdvanced = ref(false)
const includeTime = ref(false)
const leapYearOption = ref('march1') // 'march1' or 'feb28'

onMounted(() => {
  // 오늘 날짜를 기준일 기본값으로 설정
  const today = new Date()
  baseDate.value = formatDateInput(today)
})

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 만 나이 계산 로직
const result = computed(() => {
  if (!birthDate.value || !baseDate.value) return null

  const birth = new Date(birthDate.value)
  const base = new Date(baseDate.value)

  // 미래 날짜 체크
  if (birth > base) {
    return {
      error: true,
      message: t('tools.koreanAge.errors.futureDate')
    }
  }

  // 윤년 2/29 출생자 처리
  let birthMonth = birth.getMonth()
  let birthDay = birth.getDate()

  const isLeapYearBirth = birthMonth === 1 && birthDay === 29
  if (isLeapYearBirth) {
    if (leapYearOption.value === 'march1') {
      birthMonth = 2
      birthDay = 1
    } else {
      birthMonth = 1
      birthDay = 28
    }
  }

  // 만 나이 계산
  let age = base.getFullYear() - birth.getFullYear()
  const baseMonth = base.getMonth()
  const baseDay = base.getDate()

  const birthdayPassed = (baseMonth > birthMonth) ||
                        (baseMonth === birthMonth && baseDay >= birthDay)

  if (!birthdayPassed) {
    age = age - 1
  }

  // 다음 생일까지 남은 일수
  const nextBirthday = new Date(base.getFullYear(), birthMonth, birthDay)
  if (birthdayPassed && !(baseMonth === birthMonth && baseDay === birthDay)) {
    nextBirthday.setFullYear(base.getFullYear() + 1)
  }

  const daysUntilBirthday = Math.ceil((nextBirthday - base) / (1000 * 60 * 60 * 24))

  // 생후 정보
  const diffTime = base - birth
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const totalWeeks = Math.floor(totalDays / 7)
  const totalMonths = Math.floor(totalDays / 30.44) // 평균 월 일수

  const isBirthdayToday = baseMonth === birthMonth && baseDay === birthDay

  return {
    error: false,
    age,
    birthdayPassed,
    isBirthdayToday,
    daysUntilBirthday,
    birthDisplayDate: `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, '0')}-${String(birth.getDate()).padStart(2, '0')}`,
    baseDisplayDate: `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`,
    totalDays,
    totalWeeks,
    totalMonths,
    birthYear: birth.getFullYear(),
    baseYear: base.getFullYear(),
    yearDiff: base.getFullYear() - birth.getFullYear(),
    isLeapYearBirth
  }
})

const copyResult = () => {
  if (!result.value || result.value.error) return

  const text = `${t('tools.koreanAge.result.baseDate')}: ${result.value.baseDisplayDate}
${t('tools.koreanAge.result.birthDate')}: ${result.value.birthDisplayDate}
${t('tools.koreanAge.result.koreanAge')}: ${result.value.age}${t('tools.koreanAge.result.yearsOld')}
${result.value.birthdayPassed ? t('tools.koreanAge.result.birthdayPassed') : t('tools.koreanAge.result.birthdayNotPassed')}`

  navigator.clipboard.writeText(text).then(() => {
    alert(t('common.copied'))
  })
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <router-link to="/" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('common.home') }}
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('tools.koreanAge.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.koreanAge.description') }}
      </p>
    </div>

    <!-- 입력 폼 -->
    <div class="card mb-6">
      <div class="space-y-4">
        <!-- 출생일 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.koreanAge.birthDateLabel') }}
          </label>
          <input
            v-model="birthDate"
            type="date"
            class="input w-full"
          />
        </div>

        <!-- 기준일 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tools.koreanAge.baseDateLabel') }}
          </label>
          <input
            v-model="baseDate"
            type="date"
            class="input w-full"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('tools.koreanAge.baseDateHint') }}
          </p>
        </div>

        <!-- 고급 옵션 -->
        <div>
          <button
            @click="showAdvanced = !showAdvanced"
            class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
          >
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showAdvanced }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            {{ t('tools.koreanAge.advancedOptions') }}
          </button>

          <div v-if="showAdvanced" class="mt-3 space-y-3 pl-5 border-l-2 border-gray-200 dark:border-gray-700">
            <!-- 윤년 2/29 출생자 처리 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tools.koreanAge.leapYearLabel') }}
              </label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input v-model="leapYearOption" type="radio" value="march1" class="mr-2">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ t('tools.koreanAge.leapYearMarch1') }}
                  </span>
                </label>
                <label class="flex items-center">
                  <input v-model="leapYearOption" type="radio" value="feb28" class="mr-2">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ t('tools.koreanAge.leapYearFeb28') }}
                  </span>
                </label>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('tools.koreanAge.leapYearHint') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="result?.error" class="card mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">{{ result.message }}</p>
      </div>
    </div>

    <!-- 결과 표시 -->
    <div v-if="result && !result.error" class="space-y-6">
      <!-- 메인 결과 카드 -->
      <div class="card bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ t('tools.koreanAge.result.koreanAge') }}
          </p>
          <p class="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            {{ t('tools.koreanAge.result.ageDisplay', { age: result.age }) }}
          </p>

          <!-- 생일 상태 메시지 -->
          <div v-if="result.isBirthdayToday" class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="text-green-700 dark:text-green-400 font-medium">
              🎉 {{ t('tools.koreanAge.result.birthdayToday') }}
            </p>
          </div>
          <div v-else-if="result.birthdayPassed" class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <p class="text-blue-700 dark:text-blue-400">
              ✔ {{ t('tools.koreanAge.result.birthdayPassedMessage') }}
            </p>
            <p class="text-sm text-blue-600 dark:text-blue-500 mt-1">
              {{ t('tools.koreanAge.result.daysUntilNext', { days: result.daysUntilBirthday }) }}
            </p>
          </div>
          <div v-else class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <p class="text-yellow-700 dark:text-yellow-400">
              ⚠ {{ t('tools.koreanAge.result.birthdayNotPassedMessage') }}
            </p>
            <p class="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
              {{ t('tools.koreanAge.result.daysUntilBirthday', { days: result.daysUntilBirthday }) }}
            </p>
          </div>
        </div>

        <!-- 복사 버튼 -->
        <button
          @click="copyResult"
          class="btn btn-primary w-full mt-4"
        >
          {{ t('tools.koreanAge.result.copy') }}
        </button>
      </div>

      <!-- 계산 근거 (접기/펼치기) -->
      <details class="card">
        <summary class="cursor-pointer font-semibold text-gray-900 dark:text-white mb-4 select-none">
          {{ t('tools.koreanAge.calculation.title') }}
        </summary>

        <div class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500 dark:text-gray-400">{{ t('tools.koreanAge.calculation.birthDate') }}</p>
              <p class="font-mono font-medium text-gray-900 dark:text-white">{{ result.birthDisplayDate }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">{{ t('tools.koreanAge.calculation.baseDate') }}</p>
              <p class="font-mono font-medium text-gray-900 dark:text-white">{{ result.baseDisplayDate }}</p>
            </div>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
            <p class="text-gray-700 dark:text-gray-300">
              {{ t('tools.koreanAge.calculation.step1') }}: {{ result.baseYear }} - {{ result.birthYear }} = {{ result.yearDiff }}
            </p>
            <p v-if="!result.birthdayPassed" class="text-gray-700 dark:text-gray-300">
              ❌ {{ t('tools.koreanAge.calculation.step2') }} → 1 {{ t('tools.koreanAge.calculation.subtract') }}
            </p>
            <p class="text-primary-600 dark:text-primary-400 font-medium">
              👉 {{ t('tools.koreanAge.calculation.result') }}: {{ t('tools.koreanAge.result.ageDisplay', { age: result.age }) }}
            </p>
          </div>

          <div v-if="result.isLeapYearBirth" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p class="text-blue-700 dark:text-blue-400">
              ℹ️ {{ t('tools.koreanAge.calculation.leapYearInfo') }}
              ({{ leapYearOption === 'march1' ? t('tools.koreanAge.leapYearMarch1') : t('tools.koreanAge.leapYearFeb28') }})
            </p>
          </div>
        </div>
      </details>

      <!-- 생후 정보 (접기/펼치기) -->
      <details class="card">
        <summary class="cursor-pointer font-semibold text-gray-900 dark:text-white mb-4 select-none">
          {{ t('tools.koreanAge.lifeInfo.title') }}
        </summary>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ result.totalDays.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('tools.koreanAge.lifeInfo.days') }}
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ result.totalWeeks.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('tools.koreanAge.lifeInfo.weeks') }}
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ result.totalMonths.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('tools.koreanAge.lifeInfo.months') }}
            </p>
          </div>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          {{ t('tools.koreanAge.lifeInfo.note') }}
        </p>
      </details>

      <!-- 안내 문구 -->
      <div class="card bg-gray-50 dark:bg-gray-800/50">
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>💡 {{ t('tools.koreanAge.info.important') }}</p>
          <p>📋 {{ t('tools.koreanAge.info.usage') }}</p>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="6789012345" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
