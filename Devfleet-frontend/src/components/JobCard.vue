<template>
  <router-link
    :to="`/jobs/${execution.id}`"
    class="block bg-card border border-border rounded-xl p-5 transition-all duration-200 card-glow group cursor-pointer hover:border-primary/30"
    style="transition: border-color 0.2s, box-shadow 0.2s"
  >
    <!-- Top row: title + status badge -->
    <div class="flex items-start justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h3
          class="font-semibold text-foreground text-base leading-tight truncate"
        >
          {{ execution.job?.title || "—" }}
        </h3>
        <p class="text-muted-foreground text-xs mt-1 line-clamp-2">
          {{ execution.job?.description || "No description provided" }}
        </p>
      </div>
      <span
        :class="[
          'text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 border flex items-center gap-1.5',
          statusClasses[execution.status] ||
            'bg-secondary text-muted-foreground border-border',
        ]"
      >
        <span
          class="inline-block w-1.5 h-1.5 rounded-full"
          :class="statusDotClasses[execution.status] || 'bg-muted-foreground'"
        />
        {{ statusLabel }}
      </span>
    </div>

    <!-- Meta rows -->
    <div class="space-y-2 mb-4">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="w-16 shrink-0">Agent</span>
        <span
          class="font-mono bg-secondary px-2 py-0.5 rounded text-foreground/70 truncate"
        >
          {{ execution.agent?.hostname || execution.agentId || "—" }}
          <span v-if="execution.agent?.os" class="text-muted-foreground/60">
            · {{ execution.agent.os }}</span
          >
        </span>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="w-16 shrink-0">Scheduled</span>
        <span>{{ formatDate(execution.scheduledAt) }}</span>
      </div>
      <div
        v-if="execution.finishedAt"
        class="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <span class="w-16 shrink-0">Duration</span>
        <span class="font-mono">{{ duration }}</span>
      </div>
      <div
        v-if="execution.job?.repeatCron"
        class="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <span class="w-16 shrink-0">Cron</span>
        <span class="font-mono">{{ execution.job.repeatCron }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between pt-3.5 border-t border-border"
    >
      <div class="flex items-center gap-2">
        <span
          v-if="execution.exitCode !== null && execution.exitCode !== undefined"
          :class="[
            'font-mono text-xs px-2 py-0.5 rounded',
            execution.exitCode === 0
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-red-400',
          ]"
        >
          exit {{ execution.exitCode }}
        </span>
        <span class="text-xs text-muted-foreground font-mono">
          #{{ execution.attempt }}
        </span>
      </div>

      <span
        class="text-xs font-medium text-primary group-hover:text-primary/80 transition-colors flex items-center gap-1"
      >
        View Details
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6h7M6.5 3l3 3-3 3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{ execution: any }>();

// API returns uppercase: SUCCESS, FAILED, RUNNING, PENDING
const statusClasses: Record<string, string> = {
  RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SUCCESS: "bg-primary/10 text-primary border-primary/20",
  FAILED: "bg-destructive/10 text-red-400 border-destructive/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DISPATCHED: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  READY: "bg-secondary text-muted-foreground border-border",
};

const statusDotClasses: Record<string, string> = {
  RUNNING: "bg-blue-400 pulse-glow",
  SUCCESS: "bg-primary",
  FAILED: "bg-red-400",
  PENDING: "bg-yellow-400 pulse-glow",
  DISPATCHED: "bg-blue-300 pulse-glow",
  READY: "bg-muted-foreground pulse-glow",
};

// e.g. "SUCCESS" → "Success"
const statusLabel = computed(() => {
  const s = props.execution?.status || "";
  return s.charAt(0) + s.slice(1).toLowerCase();
});

// Duration from startedAt → finishedAt
const duration = computed(() => {
  const { startedAt, finishedAt } = props.execution || {};
  if (!startedAt || !finishedAt) return null;
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
});

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
</script>
