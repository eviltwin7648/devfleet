<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Top bar -->
    <header class="flex items-center gap-3 px-5 h-12 df-border-b df-surface shrink-0">
      <router-link to="/dashboard" class="text-[#8A8A8F] hover:text-[#E6E6E6] df-transition">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </router-link>
      <span class="text-[#8A8A8F]/50 text-xs">·</span>
      <h1 class="text-[13px] font-semibold text-[#E6E6E6] truncate">
        {{ execution?.job?.title || "Job Detail" }}
      </h1>
      <StatusBadge v-if="execution?.status" :status="execution.status" class="ml-1 shrink-0" />
      <div class="ml-auto flex items-center gap-2">
        <DfButton
          v-if="canReRun"
          variant="primary"
          size="sm"
          :loading="reRunning"
          @click="handleReRun"
        >
          <svg v-if="!reRunning" width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M9.5 4A4.5 4.5 0 1 0 9.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M9.5 1.5V4h-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ reRunning ? "Queuing…" : "Run Again" }}
        </DfButton>

        <!-- One-time job: single cancel button -->
        <DfButton
          v-if="canCancelExecution && !isRecurringJob"
          variant="danger"
          size="sm"
          :loading="cancelling"
          @click="cancelJobExecution"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Cancel
        </DfButton>

        <!-- Recurring job: two-button group -->
        <template v-if="isRecurringJob && !isJobStopped">
          <DfButton
            v-if="canCancelExecution"
            variant="danger"
            size="sm"
            :loading="cancelling"
            @click="cancelJobExecution"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Cancel Execution
          </DfButton>
          <DfButton
            variant="danger"
            size="sm"
            :loading="stopping"
            @click="stopRecurringJob"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Stop Job
          </DfButton>
        </template>
        
        <!-- Indicator for stopped recurring job -->
        <div v-if="isRecurringJob && isJobStopped" class="flex items-center gap-2 px-3 py-1 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded text-[#FF453A] text-[11px] font-medium">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1" fill="currentColor"/>
          </svg>
          RECURRING STOPPED
        </div>
        <DfButton variant="ghost" size="sm" @click="downloadLogs">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v6M3 5l2.5 2.5L8 5M1.5 9.5h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Logs
        </DfButton>
      </div>
    </header>

    <!-- Main split layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- LEFT: Execution history list -->
      <aside class="w-52 shrink-0 flex flex-col df-border-r overflow-hidden df-surface">
        <div class="flex items-center gap-2 px-3 h-9 df-border-b shrink-0">
          <span class="text-[11px] font-medium text-[#8A8A8F] uppercase tracking-wider">Executions</span>
          <span class="ml-auto font-mono text-[10px] text-[#8A8A8F]/60">{{ executions.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="loadingHistory"
            class="flex items-center justify-center py-8"
          >
            <svg class="df-spin w-4 h-4 text-[#8A8A8F]/40" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
          <button
            v-for="exec in executions"
            :key="exec.id"
            @click="switchExecution(exec.id)"
            :class="[
              'w-full text-left px-3 py-2.5 df-border-b df-row-hover df-transition relative',
              exec.id === activeExecutionId ? 'bg-[#4ADE80]/5' : '',
            ]"
          >
            <!-- Active sidebar bar -->
            <span
              v-if="exec.id === activeExecutionId"
              class="absolute inset-y-0 left-0 w-0.5 bg-[#4ADE80] rounded-r"
            />
            <div class="flex items-center gap-2">
              <StatusBadge :status="exec.status" />
            </div>
            <div class="mt-1 font-mono text-[10px] text-[#8A8A8F]">
              #{{ exec.attempt }} · {{ formatRelative(exec.scheduledAt || exec.createdAt) }}
            </div>
            <div v-if="exec.startedAt && exec.finishedAt" class="mt-0.5 font-mono text-[10px] text-[#8A8A8F]/60">
              {{ calcDuration(exec.startedAt, exec.finishedAt) }}
            </div>
          </button>
          <div v-if="!loadingHistory && executions.length === 0" class="px-3 py-6 text-[11px] text-[#8A8A8F]/50 text-center">
            No executions
          </div>
        </div>
      </aside>

      <!-- RIGHT: Execution detail -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Loading state -->
        <div v-if="!execution" class="flex items-center justify-center h-full gap-2 text-[#8A8A8F]">
          <svg class="df-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span class="text-[12px] font-mono">Loading execution…</span>
        </div>

        <template v-else>
          <!-- Tabs -->
          <DfTabs
            :tabs="['Logs', 'Metadata', 'Script']"
            v-model="activeTab"
          />

          <!-- Tab: Logs -->
          <div v-if="activeTab === 'Logs'" class="flex flex-col flex-1 overflow-hidden df-fade-in">
            <!-- Log toolbar -->
            <div class="flex items-center gap-2 px-3 h-9 df-border-b df-surface2 shrink-0">
              <!-- Level filter dots -->
              <button
                v-for="lvl in ['', 'STDOUT', 'STDERR', 'SYSTEM']"
                :key="lvl"
                @click="logLevel = lvl"
                :class="[
                  'px-2 py-px rounded text-[10px] font-mono df-transition',
                  logLevel === lvl ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'text-[#8A8A8F] hover:text-[#E6E6E6]',
                ]"
              >{{ lvl || "ALL" }}</button>
              <!-- Log search -->
              <div class="relative ml-2">
                <input
                  v-model="logSearch"
                  type="text"
                  placeholder="Search logs…"
                  class="pl-6 pr-2 py-1 text-[11px] bg-[#111113] df-border rounded text-[#E6E6E6] placeholder:text-[#8A8A8F]/50 focus:outline-none focus:border-[#4ADE80]/40 w-40 font-mono"
                />
                <svg class="absolute left-2 top-1/2 -translate-y-1/2 text-[#8A8A8F]/60" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="4.5" cy="4.5" r="3" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M7 7l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="ml-auto flex items-center gap-2">
                <span class="font-mono text-[10px] text-[#8A8A8F]/60">{{ filteredLogs.length }} lines</span>
                <button
                  @click="autoScroll = !autoScroll"
                  :class="[
                    'px-2 py-px rounded text-[10px] font-mono df-transition df-border',
                    autoScroll ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'text-[#8A8A8F] hover:text-[#E6E6E6]',
                  ]"
                >
                  {{ autoScroll ? "Auto ↓" : "Manual" }}
                </button>
              </div>
            </div>

            <!-- Virtualized log body -->
            <div
              ref="logContainerRef"
              class="flex-1 overflow-y-auto px-3 py-2"
              style="background: #0B0B0C;"
              @scroll="onLogScroll"
            >
              <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
                <div :style="{ transform: `translateY(${offsetY}px)` }">
                  <LogLine
                    v-for="(log, idx) in visibleLogs"
                    :key="startIndex + idx"
                    :timestamp="formatTime(log.createdAt || log.timestamp)"
                    :level="log.type"
                    :message="log.content"
                  />
                </div>
              </div>
              <!-- Empty / streaming cursor -->
              <div v-if="filteredLogs.length === 0" class="font-mono text-[11px] text-[#8A8A8F]/40 italic pt-1">
                No logs yet…
                <span v-if="isRunning" class="text-[#4ADE80] df-cursor">▋</span>
              </div>
            </div>
          </div>

          <!-- Tab: Metadata -->
          <div v-if="activeTab === 'Metadata'" class="flex-1 overflow-y-auto p-4 df-fade-in">
            <div class="grid grid-cols-2 gap-px rounded overflow-hidden df-border">
              <div v-for="row in metaRows" :key="row.label" class="contents">
                <div class="px-4 py-3 df-surface2 text-[11px] text-[#8A8A8F] uppercase tracking-wider font-medium">{{ row.label }}</div>
                <div class="px-4 py-3 df-surface text-[12px] font-mono text-[#E6E6E6] break-all">{{ row.value }}</div>
              </div>
            </div>
          </div>

          <!-- Tab: Script -->
          <div v-if="activeTab === 'Script'" class="flex-1 overflow-y-auto p-4 df-fade-in">
            <pre class="font-mono text-[12px] text-[#E6E6E6]/80 whitespace-pre-wrap break-all p-4 rounded df-surface2 df-border"><span class="text-[#4ADE80] select-none">$ </span>{{ execution?.job?.script || "—" }}</pre>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, onMounted, onUnmounted, watch, nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useJobsStore } from "@/stores/jobs";
import { jobAPI } from "@/api/apis";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import DfButton    from "@/components/ui/DfButton.vue";
import DfTabs      from "@/components/ui/DfTabs.vue";
import LogLine     from "@/components/ui/LogLine.vue";

// ─────────────── Route / Store ───────────────
const route     = useRoute();
const router    = useRouter();
const jobsStore = useJobsStore();

// ─────────────── Execution state ───────────────
const execution        = ref<any>(null);
const executions       = ref<any[]>([]);
const loadingHistory   = ref(false);
const activeExecutionId = ref(route.params.id as string);
const reRunning  = ref(false);
const cancelling = ref(false);
const stopping   = ref(false);
let sse: any = null;

// ─────────────── UI state ───────────────
const activeTab    = ref("Logs");
const logLevel     = ref("");
const logSearch    = ref("");
const autoScroll   = ref(true);
const logContainerRef = ref<HTMLElement | null>(null);

// ─────────────── Log buffer ───────────────
// Logs kept in a flat reactive array, buffered before append
const allLogs      = ref<any[]>([]);
const MAX_LOGS     = 5000;
let   logBuffer: any[] = [];
let   flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushLogs = () => {
  if (logBuffer.length === 0) return;
  const toAdd = logBuffer.splice(0);
  allLogs.value.push(...toAdd);
  // Memory control: keep last 5k
  if (allLogs.value.length > MAX_LOGS) {
    allLogs.value = allLogs.value.slice(-MAX_LOGS);
  }
  if (autoScroll.value) scrollToBottom();
  flushTimer = null;
};

const queueLog = (log: any) => {
  logBuffer.push(log);
  if (!flushTimer) flushTimer = setTimeout(flushLogs, 100); // 100ms batch window
};

const scrollToBottom = () => {
  nextTick(() => {
    const el = logContainerRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
};

// ─────────────── Virtualization ───────────────
const LINE_H   = 18; // px per log line
const OVERSCAN = 10;

const scrollTop  = ref(0);
const clientH    = ref(600);

const filteredLogs = computed(() => {
  let logs = allLogs.value;
  if (logLevel.value) logs = logs.filter(l => l.type === logLevel.value);
  if (logSearch.value) {
    const q = logSearch.value.toLowerCase();
    logs = logs.filter(l => l.content?.toLowerCase().includes(q));
  }
  return logs;
});

const totalHeight = computed(() => filteredLogs.value.length * LINE_H);

const startIndex = computed(() => {
  const s = Math.max(0, Math.floor(scrollTop.value / LINE_H) - OVERSCAN);
  return s;
});

const visibleCount = computed(() => {
  return Math.ceil(clientH.value / LINE_H) + OVERSCAN * 2;
});

const visibleLogs = computed(() =>
  filteredLogs.value.slice(startIndex.value, startIndex.value + visibleCount.value)
);

const offsetY = computed(() => startIndex.value * LINE_H);

const onLogScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  clientH.value  = el.clientHeight;
  scrollTop.value = el.scrollTop;
  // Disable autoscroll if user scrolled up
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
  if (!atBottom) autoScroll.value = false;
};

// ─────────────── Computed ───────────────
const isRunning = computed(() =>
  ["RUNNING", "DISPATCHED", "READY"].includes(execution.value?.status)
);

// True when this job definition is (still) recurring
const isRecurringJob = computed(() => execution.value?.job?.isRecurring === true);
const isJobStopped    = computed(() => execution.value?.job?.state === "CANCELLED");

// Can cancel the current execution (only while it is active)
const canCancelExecution = computed(() => {
  const status = execution.value?.status;
  if (!status || status === "CANCELLED") return false;
  return isRunning.value;
});

// Legacy alias kept for safety (used nowhere else after refactor)
const canCancel = computed(() => canCancelExecution.value);


const canReRun = computed(() => {
  const status = execution.value?.status;
  const state  = execution.value?.job?.state;
  if (status === "CANCELLED" || state === "CANCELLED") return false;
  return ["SUCCESS", "FAILED", "CANCELLED", "TIMEOUT"].includes(status);
});

const metaRows = computed(() => {
  const e = execution.value;
  if (!e) return [];
  return [
    { label: "Execution ID", value: e.id },
    { label: "Job ID",       value: e.jobId || e.job?.id || "—" },
    { label: "Status",       value: e.status },
    { label: "Attempt",      value: `#${e.attempt}` },
    { label: "Agent",        value: e.agent?.hostname || e.agentId || "—" },
    { label: "OS",           value: e.agent?.os || "—" },
    { label: "Scheduled",    value: e.scheduledAt ? new Date(e.scheduledAt).toLocaleString() : "—" },
    { label: "Started",      value: e.startedAt   ? new Date(e.startedAt).toLocaleString()   : "—" },
    { label: "Finished",     value: e.finishedAt  ? new Date(e.finishedAt).toLocaleString()  : "—" },
    { label: "Duration",     value: calcDuration(e.startedAt, e.finishedAt) },
    { label: "Exit Code",    value: e.exitCode !== null && e.exitCode !== undefined ? String(e.exitCode) : "—" },
    { label: "Max Retries",  value: e.job?.maxRetries !== undefined ? String(e.job.maxRetries) : "—" },
    { label: "Schedule",     value: e.job?.repeatCron || (e.job?.isRecurring ? "Recurring" : "One-time") },
  ];
});

// ─────────────── Helpers ───────────────
const formatRelative = (date: any) => {
  if (!date) return "—";
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return "—"; }
};

const formatTime = (date: any) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", { hour12: false });
};

const calcDuration = (start: any, end: any) => {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// ─────────────── SSE ───────────────
const closeSSE = () => { sse?.close(); sse = null; };

const startSSE = (execId: string) => {
  closeSSE();
  sse = jobAPI.streamLogs(execId, (data: any) => {
    if (Array.isArray(data)) {
      // Full log snapshot – replace
      allLogs.value = data;
    } else if (data?.logs && Array.isArray(data.logs)) {
      data.logs.forEach((l: any) => queueLog(l));
    } else if (data?.content) {
      queueLog(data);
    }
  });
};

// ─────────────── Load execution ───────────────
const loadExecution = async (execId: string) => {
  closeSSE();
  execution.value = null;
  allLogs.value   = [];

  const data = await jobsStore.getJob(execId);
  if (data) {
    execution.value = data;
    // Seed with existing logs
    if (Array.isArray(data.logs)) allLogs.value = data.logs;
  }
  startSSE(execId);
};

const loadHistory = async (jobDefinitionId: string) => {
  loadingHistory.value = true;
  executions.value = await jobsStore.getJobExecutions(jobDefinitionId) || [];
  loadingHistory.value = false;
};

// ─────────────── Actions ───────────────
const switchExecution = async (execId: string) => {
  if (execId === activeExecutionId.value) return;
  activeExecutionId.value = execId;
  router.replace({ params: { id: execId } });
  await loadExecution(execId);
};

const handleReRun = async () => {
  if (reRunning.value || !execution.value) return;
  reRunning.value = true;
  try {
    const newExec = await jobsStore.reRunJob(activeExecutionId.value);
    if (newExec?.id) router.push(`/jobs/${newExec.id}`);
  } finally {
    reRunning.value = false;
  }
};

const cancelJobExecution = async () => {
  if (cancelling.value || !activeExecutionId.value) return;
  cancelling.value = true;
  try {
    const success = await jobsStore.cancelJob(activeExecutionId.value);
    if (success) {
      if (execution.value) execution.value.status = "CANCELLED";
      closeSSE();
    }
  } finally {
    cancelling.value = false;
  }
};

const stopRecurringJob = async () => {
  if (stopping.value || !activeExecutionId.value) return;
  stopping.value = true;
  try {
    const success = await jobsStore.stopJob(activeExecutionId.value);
    if (success) {
      if (execution.value) {
        execution.value.status = "CANCELLED";
        if (execution.value.job) {
          execution.value.job.state = "CANCELLED";
        }
      }
      closeSSE();
    }
  } finally {
    stopping.value = false;
  }
};

// Keep legacy cancelJob pointed at cancelJobExecution for any other callers
const cancelJob = cancelJobExecution;


const downloadLogs = () => {
  const text = allLogs.value
    .map(l => `[${formatTime(l.createdAt || l.timestamp)}] ${l.type}: ${l.content}`)
    .join("\n");
  const a = document.createElement("a");
  a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
  a.download = `execution-${activeExecutionId.value}-logs.txt`;
  a.click();
};

// ─────────────── Lifecycle ───────────────
onMounted(async () => {
  const execId = route.params.id as string;
  activeExecutionId.value = execId;
  await loadExecution(execId);
  if (execution.value?.jobId) {
    await loadHistory(execution.value.jobId);
  }
  // Measure container
  if (logContainerRef.value) clientH.value = logContainerRef.value.clientHeight;
});

onUnmounted(() => {
  closeSSE();
  if (flushTimer) clearTimeout(flushTimer);
});

// External route changes (browser back/forward)
watch(() => route.params.id, async (newId) => {
  if (newId && newId !== activeExecutionId.value) {
    activeExecutionId.value = newId as string;
    await loadExecution(newId as string);
  }
});
</script>
