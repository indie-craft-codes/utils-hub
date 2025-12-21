<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  adSlot: { type: String, required: true },
  adFormat: { type: String, default: 'auto' },
  fullWidth: { type: Boolean, default: true }
})

const route = useRoute()
const adKey = ref(0)
const adLoaded = ref(false)

const loadAd = () => {
  try {
    if (window.adsbygoogle) {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      adLoaded.value = true
    }
  } catch (e) {
    // 광고 로드 실패 시 무시 (이미 로드된 경우 등)
  }
}

onMounted(() => {
  loadAd()
})

// 라우트 변경 시 광고 새로고침
watch(() => route.fullPath, () => {
  adKey.value++
  adLoaded.value = false
  setTimeout(loadAd, 100)
})
</script>

<template>
  <div class="ad-container my-4" :key="adKey">
    <ins
      class="adsbygoogle"
      style="display: block"
      data-ad-client="ca-pub-4977445987108311"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullWidth"
    ></ins>
  </div>
</template>

<style scoped>
.ad-container {
  min-height: 90px;
  text-align: center;
  overflow: hidden;
}

/* 광고가 없을 때 빈 공간 최소화 */
.ad-container:empty {
  min-height: 0;
}
</style>
