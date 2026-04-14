<template>
  <div class="flex flex-col h-full">
    <header class="flex flex-col gap-3 px-5 py-4 df-border-b df-surface shrink-0 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <h1 class="text-[15px] font-semibold text-[#E6E6E6]">Jobs</h1>
          <span class="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-[#8A8A8F]">
            {{ filteredJobs.length }} visible
          </span>
        </div>
        <p class="mt-1 text-[12px] text-[#8A8A8F]">
          Browse every job definition, review recent execution state, and launch new work.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <DfButton variant="ghost" size="sm" @click="refreshJobs" :loading="jobsStore.loading">
          Refresh
        </DfButton>
        <DfButton variant="primary" size="sm" @click="openCreateJob">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          New Job
        </DfButton>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5">
      <section class="rounded-xl border border-white/8 bg-[#111114]">
        <div class="flex flex-col gap-3 border-b border-white/8 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-[13px] font-semibold text-[#E6E6E6]">All Job Definitions</h2>
            <p class="mt-1 text-[11px] text-[#8A8A8F]">Latest execution status for each job.</p>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8F]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M7.5 7.5l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <input
                v-model="search"
                type="text"
                placeholder="Search jobs..."
                class="w-full rounded border border-white/10 bg-[#151518] py-1.5 pl-7 pr-3 text-[12px] text-[#E6E6E6] placeholder:text-[#8A8A8F]/60 focus:outline-none focus:border-[#4ADE80]/40 sm:w-56"
              />
            </div>
            <select
              v-model="statusFilter"
              class="rounded border border-white/10 bg-[#151518] px-2.5 py-1.5 text-[12px] text-[#8A8A8F] focus:outline-none focus:border-[#4ADE80]/40"
            >
              <option value="">All statuses</option>
              <option value="RUNNING">Running</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="READY">Ready</option>
              <option value="DISPATCHED">Dispatched</option>
            </select>
          </div>
        </div>

        <div v-if="jobsStore.loading && paginatedJobs.length === 0" class="px-4 py-4">
          <div v-for="i in pageSize" :key="i" class="mb-2 rounded-lg border border-white/6 px-4 py-3 last:mb-0">
            <div class="h-3 w-32 rounded bg-white/8" />
            <div class="mt-2 h-2 w-52 rounded bg-white/6" />
          </div>
        </div>

        <div v-else-if="filteredJobs.length === 0" class="px-4 py-10 text-center">
          <p class="text-[13px] text-[#E6E6E6]">{{ search || statusFilter ? "No jobs match the current filters" : "No jobs created yet" }}</p>
          <p class="mt-1 text-[11px] text-[#8A8A8F]">
            {{ search || statusFilter ? "Adjust the filters or search query." : "Create your first job to start sending work to your agents." }}
          </p>
          <DfButton class="mt-4" variant="primary" size="sm" @click="openCreateJob">Create Job</DfButton>
        </div>

        <div v-else class="px-2 py-2">
          <div
            v-for="job in paginatedJobs"
            :key="job.id"
            @click="openJob(job)"
            class="mb-2 grid cursor-pointer gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-white/8 hover:bg-white/[0.03] md:grid-cols-[minmax(0,1.3fr)_110px_82px_130px]"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-[13px] font-medium text-[#E6E6E6]">{{ job.title }}</p>
                <span
                  v-if="job.repeatCron"
                  class="rounded bg-[#F59E0B]/10 px-1.5 py-px font-mono text-[10px] text-[#F59E0B]"
                >
                  cron
                </span>
              </div>
              <p v-if="job.description" class="mt-1 truncate text-[11px] text-[#8A8A8F]">{{ job.description }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#8A8A8F]">
                <span class="font-mono">#{{ job.id.slice(0, 8) }}</span>
                <span v-if="job.lastExecution?.agent?.hostname" class="truncate">
                  {{ job.lastExecution.agent.hostname }}
                </span>
              </div>
            </div>

            <div class="flex items-center md:justify-center">
              <StatusBadge v-if="job.lastExecution" :status="job.lastExecution.status" />
              <span v-else class="font-mono text-[11px] text-[#8A8A8F]/50">—</span>
            </div>

            <div class="flex items-center md:justify-center">
              <span
                v-if="job.activeExecutionCount > 0"
                class="inline-flex items-center gap-1 font-mono text-[11px] text-[#4ADE80]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-[#4ADE80] df-dot-pulse" />
                {{ job.activeExecutionCount }}
              </span>
              <span v-else class="font-mono text-[11px] text-[#8A8A8F]/50">—</span>
            </div>

            <div class="flex items-center justify-between gap-3 md:justify-end">
              <span class="font-mono text-[11px] text-[#8A8A8F]">
                {{ formatRelative(job.lastExecution?.scheduledAt || job.lastExecution?.createdAt) }}
              </span>
              <svg class="h-3.5 w-3.5 text-[#8A8A8F]" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 border-t border-white/8 px-4 py-3 text-[11px] text-[#8A8A8F] sm:flex-row sm:items-center sm:justify-between">
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
      </section>
    </div>

    <CreateJobModal
      v-if="showCreateJob"
      :agents="sortedAgents"
      @job-created="onJobCreated"
      @close="closeCreateJob"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDistanceToNow } from "date-fns";
import { useJobsStore } from "@/stores/jobs";
import { useAgentsStore } from "@/stores/agents";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import DfButton from "@/components/ui/DfButton.vue";
import CreateJobModal from "@/components/CreateJobModal.vue";

const route = useRoute();
const router = useRouter();
const jobsStore = useJobsStore();
const agentsStore = useAgentsStore();

const search = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const showCreateJob = ref(false);
const pageSize = 10;

const jobDefinitions = computed(() => {
  const rawJobs = (jobsStore.jobs as any[]) || [];
  const groupedJobs = new Map<string, any>();

  for (const execution of rawJobs) {
    const definition = execution?.job;
    const definitionId = definition?.id || execution?.jobId || execution?.id;
    if (!definitionId) continue;

    const currentStatus = execution?.status || definition?.status || null;
    const isActive = ["RUNNING", "DISPATCHED", "READY", "PENDING"].includes(currentStatus);
    const title = definition?.title || execution?.title || "Untitled Job";
    const description = definition?.description || execution?.description || "";
    const repeatCron = definition?.repeatCron || execution?.repeatCron || null;
    const existing = groupedJobs.get(definitionId);

    if (!existing) {
      groupedJobs.set(definitionId, {
        id: definitionId,
        title,
        description,
        repeatCron,
        status: definition?.status || execution?.status,
        createdAt: definition?.createdAt || execution?.createdAt,
        updatedAt: definition?.updatedAt || execution?.updatedAt,
        lastExecution: execution || null,
        activeExecutionCount: isActive ? 1 : 0,
      });
      continue;
    }

    const previousTimestamp = new Date(
      existing.lastExecution?.scheduledAt ||
      existing.lastExecution?.createdAt ||
      0
    ).getTime();
    const currentTimestamp = new Date(
      execution?.scheduledAt ||
      execution?.createdAt ||
      0
    ).getTime();

    if (currentTimestamp >= previousTimestamp) {
      existing.lastExecution = execution;
      existing.status = definition?.status || execution?.status || existing.status;
      existing.updatedAt = definition?.updatedAt || execution?.updatedAt || existing.updatedAt;
    }

    if (isActive) {
      existing.activeExecutionCount += 1;
    }
  }

  return Array.from(groupedJobs.values()).sort((a: any, b: any) => {
    const aTime = new Date(a.lastExecution?.scheduledAt || a.lastExecution?.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.lastExecution?.scheduledAt || b.lastExecution?.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
});

const sortedAgents = computed(() =>
  [...agentsStore.agents].sort((a: any, b: any) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    const aTime = new Date(a.lastSeen || 0).getTime();
    const bTime = new Date(b.lastSeen || 0).getTime();
    return bTime - aTime;
  })
);

const filteredJobs = computed(() => {
  let list = jobDefinitions.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter((job: any) =>
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.lastExecution?.agent?.hostname?.toLowerCase().includes(q)
    );
  }
  if (statusFilter.value) {
    list = list.filter((job: any) => (job.lastExecution?.status || job.status) === statusFilter.value);
  }
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize)));
const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredJobs.value.slice(start, start + pageSize);
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
    showCreateJob.value = create === "1";
  },
  { immediate: true }
);

const formatRelative = (date: any) => {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
};

const refreshJobs = async () => {
  await Promise.all([jobsStore.fetchJobs(), agentsStore.fetchAgents()]);
};

const openCreateJob = () => {
  router.push({ path: "/jobs", query: { ...route.query, create: "1" } });
};

const closeCreateJob = () => {
  const query = { ...route.query };
  delete query.create;
  router.replace({ path: "/jobs", query });
};

const openJob = (job: any) => {
  const execId = job.lastExecution?.id || job.executionId || job.id;
  router.push(`/jobs/${execId}`);
};

const onJobCreated = async () => {
  closeCreateJob();
  await refreshJobs();
};

onMounted(async () => {
  await refreshJobs();
});
</script>
