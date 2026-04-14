<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route  = useRoute();
const router = useRouter();
const auth   = useAuthStore();

const nav = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { label: "Jobs",      path: "/jobs",      icon: "jobs"      },
  { label: "Agents",    path: "/agents",    icon: "agents"    },
  { label: "Settings",  path: "/profile",   icon: "settings"  },
];

const isActive = (path: string) => route.path.startsWith(path);

const logout = async () => {
  await auth.logout();
  router.push("/auth");
};
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-40 flex flex-col w-[52px] df-surface df-border-r shrink-0">
    <!-- Brand icon -->
    <div class="flex items-center justify-center h-12 df-border-b shrink-0">
      <div class="w-6 h-6 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 5h14M2 9h10M2 13h12" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Nav items -->
    <nav class="flex flex-col items-center gap-1 pt-2 flex-1">
      <router-link
        v-for="item in nav"
        :key="item.path"
        :to="item.path"
        :title="item.label"
        :class="[
          'w-9 h-9 flex items-center justify-center rounded df-transition relative group',
          isActive(item.path)
            ? 'bg-[#4ADE80]/10 text-[#4ADE80]'
            : 'text-[#8A8A8F] hover:text-[#E6E6E6] hover:bg-white/5',
        ]"
      >
        <!-- Active indicator bar -->
        <span
          v-if="isActive(item.path)"
          class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#4ADE80]"
        />
        <svg v-if="item.icon === 'dashboard'" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2.5 7.5 7.5 3l5 4.5v4a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M6 12V9h3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Jobs icon -->
        <svg v-else-if="item.icon === 'jobs'" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="1" y="2" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M4 6h7M4 9h4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <!-- Agents icon -->
        <svg v-else-if="item.icon === 'agents'" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M2 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <!-- Settings icon -->
        <svg v-else-if="item.icon === 'settings'" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.4 3.4l.7.7M10.9 10.9l.7.7M3.4 11.6l.7-.7M10.9 4.1l.7-.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <!-- Tooltip -->
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded text-[11px] bg-[#151518] text-[#E6E6E6] df-border opacity-0 group-hover:opacity-100 df-transition whitespace-nowrap z-50">
          {{ item.label }}
        </span>
      </router-link>
    </nav>

    <!-- Logout at bottom -->
    <div class="flex items-center justify-center h-12 df-border-t shrink-0">
      <button
        @click="logout"
        title="Logout"
        class="w-9 h-9 flex items-center justify-center rounded text-[#8A8A8F] hover:text-[#EF4444] hover:bg-[#EF4444]/10 df-transition group relative"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M9 10l3-2.5L9 5M12 7.5H5M5 2H3a1 1 0 00-1 1v9a1 1 0 001 1h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded text-[11px] bg-[#151518] text-[#E6E6E6] df-border opacity-0 group-hover:opacity-100 df-transition whitespace-nowrap z-50">
          Logout
        </span>
      </button>
    </div>
  </aside>
</template>
