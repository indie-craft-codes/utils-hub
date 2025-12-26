<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'

const { t } = useI18n()

const password = ref('')
const length = ref(16)
const useUppercase = ref(true)
const useLowercase = ref(true)
const useNumbers = ref(true)
const useSymbols = ref(true)
const copied = ref(false)

const charSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

const generate = () => {
  let chars = ''
  if (useUppercase.value) chars += charSets.uppercase
  if (useLowercase.value) chars += charSets.lowercase
  if (useNumbers.value) chars += charSets.numbers
  if (useSymbols.value) chars += charSets.symbols

  if (chars.length === 0) {
    password.value = ''
    return
  }

  let result = ''
  const array = new Uint32Array(length.value)
  crypto.getRandomValues(array)

  for (let i = 0; i < length.value; i++) {
    result += chars[array[i] % chars.length]
  }

  password.value = result
}

const strength = computed(() => {
  if (!password.value) return null

  let score = 0
  const len = password.value.length

  // Length score
  if (len >= 8) score += 1
  if (len >= 12) score += 1
  if (len >= 16) score += 1

  // Complexity score
  if (/[a-z]/.test(password.value)) score += 1
  if (/[A-Z]/.test(password.value)) score += 1
  if (/[0-9]/.test(password.value)) score += 1
  if (/[^a-zA-Z0-9]/.test(password.value)) score += 1

  if (score <= 3) return { level: 'weak', color: 'text-red-500', bg: 'bg-red-500', width: 25 }
  if (score <= 5) return { level: 'medium', color: 'text-yellow-500', bg: 'bg-yellow-500', width: 50 }
  if (score <= 6) return { level: 'strong', color: 'text-green-500', bg: 'bg-green-500', width: 75 }
  return { level: 'veryStrong', color: 'text-emerald-500', bg: 'bg-emerald-500', width: 100 }
})

const copy = async () => {
  if (!password.value) return
  try {
    await navigator.clipboard.writeText(password.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

// 초기 생성
generate()
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
        {{ t('tools.password.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.password.description') }}
      </p>
    </div>

    <div class="card space-y-6">
      <!-- 비밀번호 출력 -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div class="flex items-center gap-3">
          <code class="flex-1 font-mono text-lg text-gray-900 dark:text-white break-all">
            {{ password || '---' }}
          </code>
          <button
            @click="copy"
            class="btn btn-secondary py-2 px-4 shrink-0"
          >
            {{ copied ? t('common.copied') : t('common.copy') }}
          </button>
        </div>

        <!-- 강도 표시 -->
        <div v-if="strength" class="mt-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-500 dark:text-gray-400">{{ t('tools.password.strength') }}</span>
            <span :class="strength.color" class="font-medium">
              {{ t(`tools.password.${strength.level}`) }}
            </span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              :class="strength.bg"
              class="h-full transition-all duration-300"
              :style="{ width: `${strength.width}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 길이 설정 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('tools.password.length') }}: {{ length }}
        </label>
        <div class="flex items-center gap-4">
          <input
            v-model.number="length"
            type="range"
            min="4"
            max="64"
            class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <input
            v-model.number="length"
            type="number"
            min="4"
            max="64"
            class="input w-20 text-center"
          />
        </div>
      </div>

      <!-- 옵션 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ t('tools.password.options') }}
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
            <input v-model="useUppercase" type="checkbox" class="w-4 h-4 rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.password.uppercase') }}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
            <input v-model="useLowercase" type="checkbox" class="w-4 h-4 rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.password.lowercase') }}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
            <input v-model="useNumbers" type="checkbox" class="w-4 h-4 rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.password.numbers') }}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
            <input v-model="useSymbols" type="checkbox" class="w-4 h-4 rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tools.password.symbols') }}</span>
          </label>
        </div>
      </div>

      <!-- 생성 버튼 -->
      <button @click="generate" class="btn btn-primary w-full">
        {{ t('tools.password.generate') }}
      </button>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="3456789012" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
