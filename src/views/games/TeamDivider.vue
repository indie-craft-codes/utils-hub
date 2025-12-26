<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdBanner from '../../components/AdBanner.vue'
import { trackToolUsage } from '../../utils/analytics'

const { t } = useI18n()

const membersText = ref('')
const teamCount = ref(2)
const teams = ref([])

const teamColors = [
  'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
  'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700',
  'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700',
]

const divideTeams = () => {
  const members = membersText.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m)

  if (members.length < teamCount.value) {
    alert(t('tools.teamDivider.memberError'))
    return
  }

  // 셔플
  const shuffled = [...members]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 팀 배정
  const result = Array.from({ length: teamCount.value }, () => [])
  shuffled.forEach((member, idx) => {
    result[idx % teamCount.value].push(member)
  })

  teams.value = result

  trackToolUsage('team_divide', {
    member_count: members.length,
    team_count: teamCount.value
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
        {{ t('tools.teamDivider.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ t('tools.teamDivider.description') }}
      </p>
    </div>

    <div class="card space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('tools.teamDivider.members') }}
        </label>
        <textarea
          v-model="membersText"
          class="textarea h-32"
          :placeholder="t('tools.teamDivider.placeholder')"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('tools.teamDivider.teamCount') }}
        </label>
        <input v-model.number="teamCount" type="number" min="2" max="10" class="input w-24" />
      </div>

      <button @click="divideTeams" class="btn btn-primary w-full">
        {{ t('tools.teamDivider.divide') }}
      </button>

      <div v-if="teams.length > 0" class="grid grid-cols-2 gap-4">
        <div
          v-for="(team, idx) in teams"
          :key="idx"
          class="p-4 rounded-lg border-2"
          :class="teamColors[idx % teamColors.length]"
        >
          <h3 class="font-bold text-gray-900 dark:text-white mb-2">
            {{ t('tools.teamDivider.team') }} {{ idx + 1 }}
          </h3>
          <ul class="space-y-1">
            <li
              v-for="(member, mIdx) in team"
              :key="mIdx"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              {{ member }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Ad Banner -->
    <AdBanner adSlot="2345678901" adFormat="horizontal" :fullWidth="true" />
  </div>
</template>
