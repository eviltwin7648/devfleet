<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "@/components/layout/Sidebar.vue";
import Toaster from "@/components/ui/toast/Toaster.vue";

const route = useRoute();
// Auth page doesn't get the sidebar layout
const isAuthPage = computed(() => route.path === "/auth" || route.path === "/");
</script>

<template>
  <div id="app-root" class="flex h-full w-full overflow-hidden" style="background: #0B0B0C;">
    <!-- Layout with sidebar -->
    <template v-if="!isAuthPage">
      <Sidebar />
      <main class="flex-1 overflow-y-auto" style="margin-left: 52px;">
        <router-view />
      </main>
    </template>
    <!-- Auth – no sidebar -->
    <template v-else>
      <router-view />
    </template>
    <Toaster />
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
#app-root {
  min-height: 100vh;
}
</style>
