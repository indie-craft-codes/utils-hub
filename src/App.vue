<script setup>
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import MobileMenu from './components/layout/MobileMenu.vue'

const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Desktop Sidebar -->
    <AppSidebar />

    <!-- Mobile Menu -->
    <MobileMenu v-model:isOpen="isMobileMenuOpen" />

    <!-- Main Layout -->
    <div class="flex flex-col min-h-screen lg:ml-16">
      <AppHeader @toggle-mobile-menu="toggleMobileMenu" />
      <main class="flex-1">
        <router-view />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
