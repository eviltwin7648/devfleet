<template>
  <div class="flex flex-col h-full">
    <header
      class="flex flex-col gap-3 px-5 py-4 df-border-b df-surface shrink-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <h1 class="text-[15px] font-semibold text-[#E6E6E6]">Dashboard</h1>
          <span
            class="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-[#8A8A8F]"
          >
            {{ jobDefinitions.length }} jobs
          </span>
          <span
            class="rounded-full border border-[#4ADE80]/20 bg-[#4ADE80]/10 px-2 py-0.5 font-mono text-[10px] text-[#4ADE80]"
          >
            {{ onlineAgents }} agents online
          </span>
        </div>
        <p class="mt-1 text-[12px] text-[#8A8A8F]">
          Monitor fleet health, launch jobs, and manage agent availability from
          one place.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <DfButton
          variant="ghost"
          size="sm"
          @click="refreshDashboard"
          :loading="isRefreshing"
        >
          Refresh
        </DfButton>
        <DfButton variant="secondary" size="sm" @click="showCreateAgent = true">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          Add Agent
        </DfButton>
        <DfButton variant="primary" size="sm" @click="showCreateJob = true">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          New Job
        </DfButton>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5">
      <div class="space-y-5">
        <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div
            class="rounded-xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.14),transparent_45%),linear-gradient(180deg,rgba(24,24,27,0.95),rgba(14,14,16,0.96))] p-5"
          >
            <div
              class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="max-w-2xl">
                <p
                  class="text-[11px] uppercase tracking-[0.22em] text-[#8A8A8F]"
                >
                  Fleet Overview
                </p>
                <h2
                  class="mt-2 text-[22px] font-semibold leading-tight text-[#F5F5F5]"
                >
                  {{
                    runningJobs > 0
                      ? `${runningJobs} jobs are currently active`
                      : "No active jobs right now"
                  }}
                </h2>
                <p class="mt-2 max-w-xl text-[12px] leading-5 text-[#A1A1AA]">
                  {{
                    onlineAgents > 0
                      ? `${onlineAgents} of ${totalAgents} agents are online. Use quick actions to deploy new jobs or provision another agent key.`
                      : "No agents are online yet. Generate an API key to connect a new agent and start dispatching work."
                  }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] sm:min-w-[220px]">
                <div
                  class="rounded-lg border border-white/8 bg-black/20 px-3 py-2"
                >
                  <p class="text-[#8A8A8F]">Recent failures</p>
                  <p class="mt-1 font-mono text-[16px] text-[#F87171]">
                    {{ failedJobs }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-white/8 bg-black/20 px-3 py-2"
                >
                  <p class="text-[#8A8A8F]">Queued jobs</p>
                  <p class="mt-1 font-mono text-[16px] text-[#F59E0B]">
                    {{ queuedJobs }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-white/8 bg-black/20 px-3 py-2"
                >
                  <p class="text-[#8A8A8F]">Online agents</p>
                  <p class="mt-1 font-mono text-[16px] text-[#4ADE80]">
                    {{ onlineAgents }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-white/8 bg-black/20 px-3 py-2"
                >
                  <p class="text-[#8A8A8F]">Last refresh</p>
                  <p class="mt-1 font-mono text-[12px] text-[#E6E6E6]">
                    {{ refreshedAtLabel }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-white/8 bg-[#111114] p-5">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-[11px] uppercase tracking-[0.22em] text-[#8A8A8F]"
                >
                  Quick Actions
                </p>
                <p class="mt-2 text-[12px] text-[#A1A1AA]">
                  Common tasks for operating the fleet.
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-3">
              <button
                @click="showCreateJob = true"
                class="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-[#4ADE80]/30 hover:bg-[#4ADE80]/[0.06]"
              >
                <p class="text-[12px] font-medium text-[#E6E6E6]">
                  Create a new job
                </p>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">
                  Launch an immediate, scheduled, or recurring workflow.
                </p>
              </button>
              <button
                @click="showCreateAgent = true"
                class="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-[#4ADE80]/30 hover:bg-[#4ADE80]/[0.06]"
              >
                <p class="text-[12px] font-medium text-[#E6E6E6]">
                  Add a new agent
                </p>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">
                  Generate an API key and connect another machine.
                </p>
              </button>
              <button
                @click="router.push('/agents')"
                class="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
              >
                <p class="text-[12px] font-medium text-[#E6E6E6]">
                  View all agents
                </p>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">
                  Open the full fleet page with agent-level details.
                </p>
              </button>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-xl border border-white/8 bg-[#111114] px-4 py-3"
          >
            <p class="text-[11px] uppercase tracking-[0.18em] text-[#8A8A8F]">
              {{ stat.label }}
            </p>
            <div class="mt-3 flex items-end justify-between gap-3">
              <p
                class="font-mono text-[22px] leading-none"
                :class="stat.valueClass"
              >
                {{ stat.value }}
              </p>
              <span class="text-[11px] text-[#8A8A8F]">{{ stat.caption }}</span>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.95fr]">
          <div class="rounded-xl border border-white/8 bg-[#111114]">
            <div
              class="flex flex-col gap-3 border-b border-white/8 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 class="text-[13px] font-semibold text-[#E6E6E6]">Jobs</h3>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">
                  Recent executions grouped by job definition.
                </p>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div class="relative">
                  <svg
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8F]"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="3.5"
                      stroke="currentColor"
                      stroke-width="1.4"
                    />
                    <path
                      d="M7.5 7.5l2.5 2.5"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                    />
                  </svg>
                  <input
                    v-model="search"
                    type="text"
                    placeholder="Search jobs..."
                    class="w-full rounded border border-white/10 bg-[#151518] py-1.5 pl-7 pr-3 text-[12px] text-[#E6E6E6] placeholder:text-[#8A8A8F]/60 focus:outline-none focus:border-[#4ADE80]/40 sm:w-52"
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
                </select>
              </div>
            </div>

            <div
              v-if="jobsStore.loading && displayedJobs.length === 0"
              class="px-4 py-4"
            >
              <div
                v-for="i in 5"
                :key="i"
                class="mb-2 rounded-lg border border-white/6 px-4 py-3 last:mb-0"
              >
                <div class="h-3 w-32 rounded bg-white/8" />
                <div class="mt-2 h-2 w-52 rounded bg-white/6" />
              </div>
            </div>

            <div
              v-else-if="filteredJobs.length === 0"
              class="px-4 py-10 text-center"
            >
              <p class="text-[13px] text-[#E6E6E6]">
                {{
                  search || statusFilter
                    ? "No jobs match the current filters"
                    : "No jobs created yet"
                }}
              </p>
              <p class="mt-1 text-[11px] text-[#8A8A8F]">
                {{
                  search || statusFilter
                    ? "Adjust the filters or search query."
                    : "Create your first job to start sending work to your agents."
                }}
              </p>
              <DfButton
                class="mt-4"
                variant="primary"
                size="sm"
                @click="showCreateJob = true"
                >Create Job</DfButton
              >
            </div>

            <div v-else class="px-2 py-2">
              <div
                v-for="job in displayedJobs"
                :key="job.id"
                @click="openJob(job)"
                class="mb-2 grid cursor-pointer gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-white/8 hover:bg-white/[0.03] md:grid-cols-[minmax(0,1.3fr)_110px_82px_130px]"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-[13px] font-medium text-[#E6E6E6]">
                      {{ job.title }}
                    </p>
                    <span
                      v-if="job.repeatCron"
                      class="rounded bg-[#F59E0B]/10 px-1.5 py-px font-mono text-[10px] text-[#F59E0B]"
                    >
                      cron
                    </span>
                  </div>
                  <p
                    v-if="job.description"
                    class="mt-1 truncate text-[11px] text-[#8A8A8F]"
                  >
                    {{ job.description }}
                  </p>
                  <div
                    class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#8A8A8F]"
                  >
                    <span class="font-mono">#{{ job.id.slice(0, 8) }}</span>
                    <span
                      v-if="job.lastExecution?.agent?.hostname"
                      class="truncate"
                    >
                      {{ job.lastExecution.agent.hostname }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center md:justify-center">
                  <StatusBadge
                    v-if="job.lastExecution"
                    :status="job.lastExecution.status"
                  />
                  <span v-else class="font-mono text-[11px] text-[#8A8A8F]/50"
                    >—</span
                  >
                </div>

                <div class="flex items-center md:justify-center">
                  <span
                    v-if="job.activeExecutionCount > 0"
                    class="inline-flex items-center gap-1 font-mono text-[11px] text-[#4ADE80]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full bg-[#4ADE80] df-dot-pulse"
                    />
                    {{ job.activeExecutionCount }}
                  </span>
                  <span v-else class="font-mono text-[11px] text-[#8A8A8F]/50"
                    >—</span
                  >
                </div>

                <div
                  class="flex items-center justify-between gap-3 md:justify-end"
                >
                  <span class="font-mono text-[11px] text-[#8A8A8F]">
                    {{
                      formatRelative(
                        job.lastExecution?.scheduledAt ||
                          job.lastExecution?.createdAt,
                      )
                    }}
                  </span>
                  <svg
                    class="h-3.5 w-3.5 text-[#8A8A8F]"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M4.5 3l3 3-3 3"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-white/8 px-4 py-3 text-[11px] text-[#8A8A8F]"
            >
              <span>{{ filteredJobs.length }} matching jobs</span>
              <div class="flex items-center gap-2">
                <DfButton
                  v-if="filteredJobs.length > compactJobLimit"
                  variant="ghost"
                  size="sm"
                  @click="router.push('/jobs')"
                >
                  View all jobs
                </DfButton>
                <DfButton
                  variant="secondary"
                  size="sm"
                  @click="showCreateJob = true"
                  >Add job</DfButton
                >
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-white/8 bg-[#111114]">
            <div
              class="flex items-center justify-between border-b border-white/8 px-4 py-4"
            >
              <div>
                <h3 class="text-[13px] font-semibold text-[#E6E6E6]">Agents</h3>
                <p class="mt-1 text-[11px] text-[#8A8A8F]">
                  Current fleet availability and capacity.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <DfButton
                  variant="ghost"
                  size="sm"
                  @click="router.push('/agents')"
                  >View all agents</DfButton
                >
                <DfButton
                  variant="secondary"
                  size="sm"
                  @click="showCreateAgent = true"
                  >Add agent</DfButton
                >
              </div>
            </div>

            <div
              v-if="agentsStore.loading && sortedAgents.length === 0"
              class="px-4 py-4"
            >
              <div
                v-for="i in 4"
                :key="i"
                class="mb-2 rounded-lg border border-white/6 px-4 py-3 last:mb-0"
              >
                <div class="h-3 w-24 rounded bg-white/8" />
                <div class="mt-2 h-2 w-40 rounded bg-white/6" />
              </div>
            </div>

            <div
              v-else-if="sortedAgents.length === 0"
              class="px-4 py-10 text-center"
            >
              <p class="text-[13px] text-[#E6E6E6]">No agents connected</p>
              <p class="mt-1 text-[11px] text-[#8A8A8F]">
                Generate an API key and connect your first agent.
              </p>
              <DfButton
                class="mt-4"
                variant="primary"
                size="sm"
                @click="showCreateAgent = true"
                >Add Agent</DfButton
              >
            </div>

            <div v-else class="px-2 py-2">
              <div
                v-for="agent in displayedAgents"
                :key="agent.id"
                class="mb-2 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-white/8 hover:bg-white/[0.03]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        :class="[
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          agent.isOnline
                            ? 'bg-[#4ADE80] df-dot-pulse'
                            : 'bg-[#8A8A8F]/40',
                        ]"
                      />
                      <p
                        class="truncate text-[13px] font-medium text-[#E6E6E6]"
                      >
                        {{ agent.hostname }}
                      </p>
                    </div>
                    <p class="mt-1 font-mono text-[11px] text-[#8A8A8F]">
                      {{ [agent.os, agent.arch].filter(Boolean).join(" / ") }}
                    </p>
                  </div>
                  <span
                    :class="[
                      'rounded px-2 py-0.5 text-[10px] font-medium',
                      agent.isOnline
                        ? 'bg-[#4ADE80]/10 text-[#4ADE80]'
                        : 'bg-white/5 text-[#8A8A8F]',
                    ]"
                  >
                    {{ agent.isOnline ? "Online" : "Offline" }}
                  </span>
                </div>

                <div
                  class="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#8A8A8F]"
                >
                  <div
                    class="rounded-md border border-white/6 bg-black/20 px-3 py-2"
                  >
                    <p>Concurrency</p>
                    <p class="mt-1 font-mono text-[#E6E6E6]">
                      {{ agent.concurrency ?? 1 }}
                    </p>
                  </div>
                  <div
                    class="rounded-md border border-white/6 bg-black/20 px-3 py-2"
                  >
                    <p>Last seen</p>
                    <p class="mt-1 font-mono text-[#E6E6E6]">
                      {{ formatRelative(agent.lastSeen) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="agent.tags?.length"
                  class="mt-3 flex flex-wrap gap-1"
                >
                  <span
                    v-for="tag in agent.tags"
                    :key="tag"
                    class="rounded bg-[#4ADE80]/10 px-1.5 py-px text-[10px] text-[#4ADE80]"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-white/8 px-4 py-3 text-[11px] text-[#8A8A8F]"
            >
              <span>{{ totalAgents }} registered agents</span>
              <DfButton
                v-if="sortedAgents.length > compactAgentLimit"
                variant="ghost"
                size="sm"
                @click="router.push('/agents')"
              >
                View all agents
              </DfButton>
            </div>
          </div>
        </section>
      </div>
    </div>

    <CreateJobModal
      v-if="showCreateJob"
      :agents="sortedAgents"
      @job-created="onJobCreated"
      @close="showCreateJob = false"
    />

    <CreateApiKeyDialog
      v-model:open="showCreateAgent"
      @created="refreshDashboard"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { formatDistanceToNow } from "date-fns";
import { useJobsStore } from "@/stores/jobs";
import { useAgentsStore } from "@/stores/agents";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import DfButton from "@/components/ui/DfButton.vue";
import CreateJobModal from "@/components/CreateJobModal.vue";
import CreateApiKeyDialog from "@/components/CreateApiKeyDialog.vue";

const router = useRouter();
const jobsStore = useJobsStore();
const agentsStore = useAgentsStore();

const search = ref("");
const statusFilter = ref("");
const showAllJobs = ref(false);
const showAllAgents = ref(false);
const isRefreshing = ref(false);
const refreshedAt = ref<Date | null>(null);
const showCreateJob = ref(false);
const showCreateAgent = ref(false);
const compactJobLimit = 6;
const compactAgentLimit = 4;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const jobDefinitions = computed(() => {
  const rawJobs = (jobsStore.jobs as any[]) || [];
  const groupedJobs = new Map<string, any>();

  for (const execution of rawJobs) {
    const definition = execution?.job;
    const definitionId = definition?.id || execution?.jobId || execution?.id;
    if (!definitionId) continue;

    const currentStatus = execution?.status || definition?.status || null;
    const isActive = ["RUNNING", "DISPATCHED", "READY", "PENDING"].includes(
      currentStatus,
    );
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
        0,
    ).getTime();
    const currentTimestamp = new Date(
      execution?.scheduledAt || execution?.createdAt || 0,
    ).getTime();

    if (currentTimestamp >= previousTimestamp) {
      existing.lastExecution = execution;
      existing.status =
        definition?.status || execution?.status || existing.status;
      existing.updatedAt =
        definition?.updatedAt || execution?.updatedAt || existing.updatedAt;
    }

    if (isActive) {
      existing.activeExecutionCount += 1;
    }
  }

  return Array.from(groupedJobs.values()).sort((a: any, b: any) => {
    const aTime = new Date(
      a.lastExecution?.scheduledAt ||
        a.lastExecution?.createdAt ||
        a.updatedAt ||
        0,
    ).getTime();
    const bTime = new Date(
      b.lastExecution?.scheduledAt ||
        b.lastExecution?.createdAt ||
        b.updatedAt ||
        0,
    ).getTime();
    return bTime - aTime;
  });
});

const sortedAgents = computed(() =>
  [...agentsStore.agents].sort((a: any, b: any) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    const aTime = new Date(a.lastSeen || 0).getTime();
    const bTime = new Date(b.lastSeen || 0).getTime();
    return bTime - aTime;
  }),
);

const filteredJobs = computed(() => {
  let list = jobDefinitions.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (job: any) =>
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.lastExecution?.agent?.hostname?.toLowerCase().includes(q),
    );
  }
  if (statusFilter.value) {
    list = list.filter(
      (job: any) =>
        (job.lastExecution?.status || job.status) === statusFilter.value,
    );
  }
  return list;
});

const displayedJobs = computed(() =>
  showAllJobs.value
    ? filteredJobs.value
    : filteredJobs.value.slice(0, compactJobLimit),
);

const displayedAgents = computed(() =>
  showAllAgents.value
    ? sortedAgents.value
    : sortedAgents.value.slice(0, compactAgentLimit),
);

const totalAgents = computed(() => sortedAgents.value.length);
const onlineAgents = computed(
  () => sortedAgents.value.filter((agent: any) => agent.isOnline).length,
);
const offlineAgents = computed(() => totalAgents.value - onlineAgents.value);
const runningJobs = computed(
  () =>
    jobDefinitions.value.filter((job: any) =>
      ["RUNNING", "DISPATCHED"].includes(
        job.lastExecution?.status || job.status,
      ),
    ).length,
);
const failedJobs = computed(
  () =>
    jobDefinitions.value.filter(
      (job: any) => (job.lastExecution?.status || job.status) === "FAILED",
    ).length,
);
const successJobs = computed(
  () =>
    jobDefinitions.value.filter(
      (job: any) => (job.lastExecution?.status || job.status) === "SUCCESS",
    ).length,
);
const queuedJobs = computed(
  () =>
    jobDefinitions.value.filter((job: any) =>
      ["READY", "PENDING"].includes(job.lastExecution?.status || job.status),
    ).length,
);
const totalCapacity = computed(() =>
  sortedAgents.value.reduce(
    (sum: number, agent: any) => sum + (agent.concurrency ?? 1),
    0,
  ),
);

const stats = computed(() => [
  {
    label: "Total Jobs",
    value: jobDefinitions.value.length,
    caption: "definitions",
    valueClass: "text-[#E6E6E6]",
  },
  {
    label: "Running",
    value: runningJobs.value,
    caption: "active now",
    valueClass: "text-[#4ADE80]",
  },
  {
    label: "Failed",
    value: failedJobs.value,
    caption: "attention needed",
    valueClass: "text-[#F87171]",
  },
  {
    label: "Successful",
    value: successJobs.value,
    caption: "latest state",
    valueClass: "text-[#60A5FA]",
  },
  {
    label: "Agents",
    value: totalAgents.value,
    caption: `${onlineAgents.value} online`,
    valueClass: "text-[#E6E6E6]",
  },
  {
    label: "Capacity",
    value: totalCapacity.value,
    caption: `${offlineAgents.value} offline`,
    valueClass: "text-[#F59E0B]",
  },
]);

const refreshedAtLabel = computed(() => {
  if (!refreshedAt.value) return "just now";
  return formatRelative(refreshedAt.value);
});

const formatRelative = (date: any) => {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
};

const refreshDashboard = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await Promise.all([jobsStore.fetchJobs(), agentsStore.fetchAgents()]);
    refreshedAt.value = new Date();
  } finally {
    isRefreshing.value = false;
  }
};

const openJob = (job: any) => {
  const execId = job.lastExecution?.id || job.executionId || job.id;
  router.push(`/jobs/${execId}`);
};

const onJobCreated = async () => {
  showCreateJob.value = false;
  await refreshDashboard();
};

onMounted(async () => {
  await refreshDashboard();

  pollInterval = setInterval(() => {
    if (
      jobDefinitions.value.some((job: any) =>
        ["RUNNING", "DISPATCHED", "READY", "PENDING"].includes(
          job.lastExecution?.status || job.status,
        ),
      )
    ) {
      refreshDashboard();
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>
