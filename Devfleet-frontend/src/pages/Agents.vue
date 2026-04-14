<template>
  <div class="flex flex-col h-full">
    <!-- Top bar -->
    <header class="flex flex-col gap-3 px-5 py-4 df-border-b df-surface shrink-0 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <h1 class="text-[15px] font-semibold text-[#E6E6E6]">Agents</h1>
          <span class="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-[#8A8A8F]">{{ filteredAgents.length }} visible</span>
        </div>
        <p class="mt-1 text-[12px] text-[#8A8A8F]">
          Review connected runners, inspect availability, and provision new agent keys.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <DfButton variant="ghost" size="sm" @click="refreshAgents" :loading="loading">
          Refresh
        </DfButton>
        <DfButton variant="secondary" size="sm" @click="openCreateAgent">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="4.5" cy="4.5" r="3" stroke="currentColor" stroke-width="1.3"/>
          <path d="M6.5 6.5l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
          Add Agent
        </DfButton>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative max-w-sm">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8F]" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M7.5 7.5l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search agents..."
            class="w-full rounded border border-white/10 bg-[#151518] py-1.5 pl-7 pr-3 text-[12px] text-[#E6E6E6] placeholder:text-[#8A8A8F]/60 focus:outline-none focus:border-[#4ADE80]/40"
          />
        </div>
        <select
          v-model="statusFilter"
          class="rounded border border-white/10 bg-[#151518] px-2.5 py-1.5 text-[12px] text-[#8A8A8F] focus:outline-none focus:border-[#4ADE80]/40"
        >
          <option value="">All agents</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="i in 3" :key="i" class="df-surface rounded-md df-border p-4 h-28 animate-pulse">
          <div class="h-2 bg-white/10 rounded w-24 mb-3" />
          <div class="h-2 bg-white/6 rounded w-40 mb-2" />
          <div class="h-2 bg-white/6 rounded w-32" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredAgents.length === 0" class="flex flex-col items-center justify-center h-64 gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" class="text-[#8A8A8F]/30">
          <circle cx="18" cy="12" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 34c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p class="text-[13px] text-[#8A8A8F]">{{ search || statusFilter ? "No agents match the current filters" : "No agents connected" }}</p>
        <p class="text-[11px] text-[#8A8A8F]/60 text-center max-w-xs">
          {{ search || statusFilter ? "Adjust the filters or search query." : "Deploy a DevFleet agent and connect with an API key to start running jobs." }}
        </p>
        <DfButton variant="primary" size="sm" @click="openCreateAgent">Generate API Key</DfButton>
      </div>

      <!-- Agent Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="agent in paginatedAgents"
          :key="agent.id"
          type="button"
          @click="router.push(`/agents/${agent.id}`)"
          class="df-surface rounded-md df-border p-4 df-fade-in df-transition text-left hover:border-white/10"
        >
          <!-- Header row -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span
                  :class="['w-1.5 h-1.5 rounded-full shrink-0', agent.isOnline ? 'bg-[#4ADE80] df-dot-pulse' : 'bg-[#8A8A8F]/40']"
                />
                <p class="text-[13px] font-medium text-[#E6E6E6] truncate">{{ agent.hostname }}</p>
              </div>
              <p class="mt-0.5 text-[11px] font-mono text-[#8A8A8F]">{{ [agent.os, agent.arch].filter(Boolean).join(' / ') }}</p>
            </div>
            <span
              :class="[
                'text-[10px] px-2 py-px rounded font-medium shrink-0',
                agent.isOnline ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-white/5 text-[#8A8A8F]',
              ]"
            >{{ agent.isOnline ? "Online" : "Offline" }}</span>
          </div>

          <!-- Metrics -->
            <div class="space-y-2 mt-3">
            <div v-if="agent.latestHealth" class="grid grid-cols-3 gap-2">
              <div class="rounded-md bg-white/[0.03] px-2 py-2">
                <p class="text-[9px] uppercase tracking-[0.16em] text-[#8A8A8F]">CPU</p>
                <p class="mt-1 font-mono text-[11px] text-[#60A5FA]">{{ formatPercent(agent.latestHealth.cpuUsage) }}</p>
              </div>
              <div class="rounded-md bg-white/[0.03] px-2 py-2">
                <p class="text-[9px] uppercase tracking-[0.16em] text-[#8A8A8F]">MEM</p>
                <p class="mt-1 font-mono text-[11px] text-[#F59E0B]">{{ formatPercent(agent.latestHealth.memUsage) }}</p>
              </div>
              <div class="rounded-md bg-white/[0.03] px-2 py-2">
                <p class="text-[9px] uppercase tracking-[0.16em] text-[#8A8A8F]">DISK</p>
                <p class="mt-1 font-mono text-[11px] text-[#4ADE80]">{{ formatPercent(agent.latestHealth.diskUsage) }}</p>
              </div>
            </div>

            <!-- Concurrency bar -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-[#8A8A8F]">Concurrency</span>
                <span class="font-mono text-[10px] text-[#E6E6E6]">{{ agent.concurrency }}</span>
              </div>
              <div class="h-0.5 bg-white/6 rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#4ADE80] rounded-full"
                  :style="{ width: `${Math.min(100, ((agent.concurrency ?? 1) / 16) * 100)}%` }"
                />
              </div>
            </div>
            <!-- Last seen -->
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-[#8A8A8F]">Last seen</span>
              <span class="font-mono text-[10px] text-[#8A8A8F]">{{ formatRelative(agent.lastSeen) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-[#8A8A8F]">Heartbeat</span>
              <span class="font-mono text-[10px] text-[#8A8A8F]">{{ formatRelative(agent.latestHealth?.timestamp) }}</span>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="agent.tags?.length" class="flex flex-wrap gap-1 mt-3 pt-3 df-border-t">
            <span
              v-for="tag in agent.tags"
              :key="tag"
              class="text-[10px] px-1.5 py-px rounded bg-[#4ADE80]/10 text-[#4ADE80] font-medium"
            >{{ tag }}</span>
          </div>
        </button>
      </div>

      <div v-if="filteredAgents.length > 0" class="mt-4 flex flex-col gap-3 text-[11px] text-[#8A8A8F] sm:flex-row sm:items-center sm:justify-between">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <div class="flex items-center gap-2">
          <DfButton variant="ghost" size="sm" :disabled="currentPage === 1" @click="currentPage -= 1">
            Previous
          </DfButton>
          <DfButton variant="ghost" size="sm" :disabled="currentPage === totalPages" @click="currentPage += 1">
            Next
          </DfButton>
        </div>
      </div>
    </div>

    <!-- Create API Key -->
    <CreateApiKeyDialog
      v-model:open="showApiKey"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAgentsStore } from "@/stores/agents";
import { formatDistanceToNow } from "date-fns";
import DfButton from "@/components/ui/DfButton.vue";
import CreateApiKeyDialog from "@/components/CreateApiKeyDialog.vue";

const route = useRoute();
const router = useRouter();
const agentsStore = useAgentsStore();
const loading     = ref(false);
const showApiKey  = ref(false);
const search      = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = 9;

const agents = computed(() => agentsStore.agents);
const filteredAgents = computed(() => {
  let list = agents.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter((agent) =>
      agent.hostname?.toLowerCase().includes(q) ||
      agent.os?.toLowerCase().includes(q) ||
      agent.arch?.toLowerCase().includes(q) ||
      agent.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  if (statusFilter.value) {
    list = list.filter((agent) => (statusFilter.value === "online" ? agent.isOnline : !agent.isOnline));
  }
  return [...list].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    const aTime = new Date(a.lastSeen || 0).getTime();
    const bTime = new Date(b.lastSeen || 0).getTime();
    return bTime - aTime;
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredAgents.value.length / pageSize)));
const paginatedAgents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAgents.value.slice(start, start + pageSize);
});

watch([search, statusFilter], () => {
  currentPage.value = 1;
});

watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value;
});

watch(
  () => route.query.create,
  (create) => {
    showApiKey.value = create === "1";
  },
  { immediate: true }
);

watch(showApiKey, (open) => {
  if (open || route.query.create !== "1") return;
  const query = { ...route.query };
  delete query.create;
  router.replace({ path: "/agents", query });
});

const formatRelative = (date: any) => {
  if (!date) return "—";
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return "—"; }
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}%`;
};

const refreshAgents = async () => {
  loading.value = true;
  await agentsStore.fetchAgents();
  loading.value = false;
};

const openCreateAgent = () => {
  router.push({ path: "/agents", query: { ...route.query, create: "1" } });
};

onMounted(async () => {
  await refreshAgents();
});
</script>
