<template>
  <div class="flex h-full flex-col overflow-hidden">
    <header class="flex items-center gap-3 px-5 py-4 df-border-b df-surface shrink-0">
      <router-link to="/agents" class="text-[#8A8A8F] hover:text-[#E6E6E6] df-transition">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </router-link>
      <span class="text-[#8A8A8F]/50 text-xs">·</span>
      <h1 class="truncate text-[15px] font-semibold text-[#E6E6E6]">
        {{ agent?.hostname || "Agent Details" }}
      </h1>
      <span
        v-if="agent"
        :class="[
          'rounded px-2 py-0.5 text-[10px] font-medium',
          agent.isOnline ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-white/5 text-[#8A8A8F]'
        ]"
      >
        {{ agent.isOnline ? "Online" : "Offline" }}
      </span>
      <div class="ml-auto flex items-center gap-2">
        <select
          v-model="selectedRange"
          class="rounded border border-white/10 bg-[#151518] px-2.5 py-1.5 text-[12px] text-[#E6E6E6] focus:outline-none focus:border-[#4ADE80]/40"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <DfButton variant="ghost" size="sm" @click="refresh" :loading="loading">
          Refresh
        </DfButton>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5">
      <div v-if="loading && !agent" class="flex items-center justify-center py-16 text-[#8A8A8F]">
        Loading agent details...
      </div>

      <div v-else-if="!agent" class="flex items-center justify-center py-16 text-[#8A8A8F]">
        Agent not found.
      </div>

      <template v-else>
        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.35fr]">
          <div class="rounded-xl border border-white/8 bg-[#111114] p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.22em] text-[#8A8A8F]">Latest Health</p>
                <h2 class="mt-2 text-[22px] font-semibold text-[#F5F5F5]">{{ agent.hostname }}</h2>
                <p class="mt-1 text-[12px] text-[#8A8A8F]">{{ [agent.os, agent.arch].filter(Boolean).join(" / ") }}</p>
              </div>
              <span class="font-mono text-[11px] text-[#8A8A8F]">
                {{ formatRelative(agent.lastSeen) }}
              </span>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-white/8 bg-black/20 px-3 py-3">
                <p class="text-[11px] text-[#8A8A8F]">CPU</p>
                <p class="mt-1 font-mono text-[20px] text-[#60A5FA]">{{ formatPercent(agent.latestHealth?.cpuUsage) }}</p>
              </div>
              <div class="rounded-lg border border-white/8 bg-black/20 px-3 py-3">
                <p class="text-[11px] text-[#8A8A8F]">Memory</p>
                <p class="mt-1 font-mono text-[20px] text-[#F59E0B]">{{ formatPercent(agent.latestHealth?.memUsage) }}</p>
              </div>
              <div class="rounded-lg border border-white/8 bg-black/20 px-3 py-3">
                <p class="text-[11px] text-[#8A8A8F]">Disk</p>
                <p class="mt-1 font-mono text-[20px] text-[#4ADE80]">{{ formatPercent(agent.latestHealth?.diskUsage) }}</p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-2 text-[11px] text-[#8A8A8F]">
              <div class="rounded-md border border-white/6 bg-black/20 px-3 py-2">
                <p>Last heartbeat</p>
                <p class="mt-1 font-mono text-[#E6E6E6]">{{ formatDateTime(agent.latestHealth?.timestamp || agent.lastSeen) }}</p>
              </div>
              <div class="rounded-md border border-white/6 bg-black/20 px-3 py-2">
                <p>Total memory</p>
                <p class="mt-1 font-mono text-[#E6E6E6]">{{ formatBytes(agent.totalmem) }}</p>
              </div>
              <div class="rounded-md border border-white/6 bg-black/20 px-3 py-2">
                <p>Executions</p>
                <p class="mt-1 font-mono text-[#E6E6E6]">{{ agent.totalExecutions ?? 0 }}</p>
              </div>
              <div class="rounded-md border border-white/6 bg-black/20 px-3 py-2">
                <p>Agent ID</p>
                <p class="mt-1 truncate font-mono text-[#E6E6E6]">{{ agent.id }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-white/8 bg-[#111114] p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.22em] text-[#8A8A8F]">Heartbeat Timeline</p>
                <h2 class="mt-2 text-[16px] font-semibold text-[#F5F5F5]">{{ rangeLabel }}</h2>
              </div>
              <span class="font-mono text-[11px] text-[#8A8A8F]">{{ history.length }} points</span>
            </div>

            <div v-if="history.length === 0" class="flex h-[320px] items-center justify-center text-center text-[12px] text-[#8A8A8F]">
              No heartbeat samples found in this time range.
            </div>

            <div v-else class="mt-5">
              <svg viewBox="0 0 760 320" class="h-[320px] w-full overflow-visible">
                <g>
                  <line v-for="tick in yTicks" :key="tick" :x1="56" :x2="736" :y1="scaleY(tick)" :y2="scaleY(tick)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
                  <text
                    v-for="tick in yTicks"
                    :key="`label-${tick}`"
                    x="10"
                    :y="scaleY(tick) + 4"
                    fill="#8A8A8F"
                    font-size="11"
                    font-family="monospace"
                  >
                    {{ tick }}%
                  </text>
                </g>

                <polyline
                  :points="buildLinePoints('cpuUsage')"
                  fill="none"
                  stroke="#60A5FA"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  :points="buildLinePoints('memUsage')"
                  fill="none"
                  stroke="#F59E0B"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  :points="buildLinePoints('diskUsage')"
                  fill="none"
                  stroke="#4ADE80"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <g v-for="(point, index) in chartPoints" :key="point.id">
                  <circle :cx="point.x" :cy="scaleY(point.cpuUsage)" r="3" fill="#60A5FA" />
                  <circle :cx="point.x" :cy="scaleY(point.memUsage)" r="3" fill="#F59E0B" />
                  <circle v-if="point.diskUsage !== null" :cx="point.x" :cy="scaleY(point.diskUsage)" r="3" fill="#4ADE80" />
                  <text
                    v-if="shouldShowTick(index)"
                    :x="point.x"
                    y="304"
                    text-anchor="middle"
                    fill="#8A8A8F"
                    font-size="10"
                    font-family="monospace"
                  >
                    {{ formatAxisLabel(point.timestamp) }}
                  </text>
                </g>
              </svg>

              <div class="mt-4 flex flex-wrap gap-3 text-[11px] text-[#8A8A8F]">
                <span class="inline-flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-[#60A5FA]" />CPU</span>
                <span class="inline-flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />Memory</span>
                <span class="inline-flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />Disk</span>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-5 rounded-xl border border-white/8 bg-[#111114]">
          <div class="border-b border-white/8 px-4 py-4">
            <h3 class="text-[13px] font-semibold text-[#E6E6E6]">Recent Heartbeats</h3>
            <p class="mt-1 text-[11px] text-[#8A8A8F]">Newest samples first.</p>
          </div>
          <div v-if="history.length === 0" class="px-4 py-8 text-center text-[12px] text-[#8A8A8F]">
            No heartbeat samples in the selected range.
          </div>
          <div v-else class="px-2 py-2">
            <div
              v-for="point in recentHistory"
              :key="point.id"
              class="mb-2 grid gap-3 rounded-lg border border-transparent px-3 py-3 md:grid-cols-[1.1fr_110px_110px_110px]"
            >
              <div class="min-w-0">
                <p class="font-mono text-[12px] text-[#E6E6E6]">{{ formatDateTime(point.timestamp) }}</p>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">{{ formatRelative(point.timestamp) }}</p>
              </div>
              <div class="font-mono text-[12px] text-[#60A5FA]">{{ formatPercent(point.cpuUsage) }}</div>
              <div class="font-mono text-[12px] text-[#F59E0B]">{{ formatPercent(point.memUsage) }}</div>
              <div class="font-mono text-[12px] text-[#4ADE80]">{{ formatPercent(point.diskUsage) }}</div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { format, formatDistanceToNow } from "date-fns";
import { useAgentsStore } from "@/stores/agents";
import DfButton from "@/components/ui/DfButton.vue";

const route = useRoute();
const agentsStore = useAgentsStore();

const agent = ref<any>(null);
const history = ref<any[]>([]);
const loading = ref(false);
const selectedRange = ref("24h");
const yTicks = [0, 25, 50, 75, 100];

const chartPoints = computed(() => {
  if (history.value.length === 0) return [];
  const startX = 56;
  const endX = 736;
  const width = endX - startX;
  const count = history.value.length;

  return history.value.map((point, index) => ({
    ...point,
    diskUsage: point.diskUsage ?? null,
    x: count === 1 ? startX + width / 2 : startX + (index / (count - 1)) * width,
  }));
});

const rangeLabel = computed(() => {
  if (selectedRange.value === "7d") return "Performance over the last 7 days";
  if (selectedRange.value === "30d") return "Performance over the last 30 days";
  return "Performance over the last 24 hours";
});

const recentHistory = computed(() => [...history.value].slice(-10).reverse());

const scaleY = (value: number) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return 24 + ((100 - clamped) / 100) * 240;
};

const buildLinePoints = (key: "cpuUsage" | "memUsage" | "diskUsage") =>
  chartPoints.value
    .filter((point) => point[key] !== null && point[key] !== undefined)
    .map((point) => `${point.x},${scaleY(Number(point[key]))}`)
    .join(" ");

const shouldShowTick = (index: number) => {
  const maxTicks = 6;
  if (chartPoints.value.length <= maxTicks) return true;
  const stride = Math.ceil(chartPoints.value.length / maxTicks);
  return index % stride === 0 || index === chartPoints.value.length - 1;
};

const formatRelative = (date: any) => {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
};

const formatDateTime = (date: any) => {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy HH:mm");
  } catch {
    return "—";
  }
};

const formatAxisLabel = (date: string) => {
  try {
    return selectedRange.value === "24h"
      ? format(new Date(date), "HH:mm")
      : format(new Date(date), "MMM d");
  } catch {
    return "";
  }
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)}%`;
};

const formatBytes = (value: string | number | undefined) => {
  if (value === undefined || value === null) return "—";
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = bytes;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current.toFixed(current >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const refresh = async () => {
  loading.value = true;
  try {
    const agentId = route.params.id as string;
    const [detail, healthHistory] = await Promise.all([
      agentsStore.getAgent(agentId),
      agentsStore.getAgentHealthHistory(agentId, selectedRange.value),
    ]);
    agent.value = detail;
    history.value = healthHistory;
  } finally {
    loading.value = false;
  }
};

watch(selectedRange, () => {
  refresh();
});

watch(
  () => route.params.id,
  () => {
    refresh();
  }
);

onMounted(() => {
  refresh();
});
</script>
