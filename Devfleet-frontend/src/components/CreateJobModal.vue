<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background: hsl(220 20% 2% / 0.8); backdrop-filter: blur(8px)"
  >
    <div
      class="bg-card border border-border rounded-xl max-w-5xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl"
      style="
        box-shadow: 0 0 60px hsl(152 100% 50% / 0.06),
          0 40px 80px hsl(220 20% 0% / 0.7);
      "
    >
      <!-- Modal header with terminal dots -->
      <div
        class="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-destructive/60" />
            <div class="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div class="w-3 h-3 rounded-full bg-primary/60" />
          </div>
          <h2 class="text-sm font-semibold text-foreground font-mono ml-1">
            new-job.sh
          </h2>
        </div>
        <button
          @click="$emit('close')"
          class="text-muted-foreground hover:text-foreground transition-colors w-7 h-7 rounded flex items-center justify-center hover:bg-secondary"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 2l8 8M10 2L2 10"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleCreate" class="p-6">
        <div class="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div class="space-y-5">
            <div>
              <label class="block text-xs font-medium text-foreground/70 mb-2"
                >Job Title</label
              >
              <input
                v-model="form.title"
                type="text"
                placeholder="build-pipeline"
                class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-foreground/70 mb-2"
                >Description</label
              >
              <textarea
                v-model="form.description"
                placeholder="Short description of what this job does..."
                class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors h-24 resize-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-foreground/70 mb-2">
                Script
                <span class="text-primary ml-1 font-mono">*</span>
              </label>
              <div
                class="border border-border rounded-lg overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-colors"
              >
                <div
                  class="flex items-center gap-2 px-3 py-2.5 border-b border-border"
                  style="background: hsl(220 20% 3%)"
                >
                  <span class="text-primary font-mono text-xs select-none"
                    >$</span
                  >
                  <span class="text-muted-foreground font-mono text-xs"
                    >bash</span
                  >
                </div>
                <textarea
                  v-model="form.script"
                  placeholder="#!/bin/bash&#10;echo 'Hello World'"
                  class="w-full px-4 py-3 font-mono text-sm text-foreground/90 placeholder-muted-foreground/50 focus:outline-none resize-none h-[320px]"
                  style="background: hsl(220 20% 3%)"
                  required
                />
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <div class="rounded-lg border border-border bg-secondary/35 p-4">
              <p
                class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Dispatch
              </p>

              <div class="mt-4">
                <label class="block text-xs font-medium text-foreground/70 mb-2"
                  >Agent</label
                >
                <select
                  v-model="form.agentId"
                  class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="">Any available agent</option>
                  <option
                    v-for="agent in agents"
                    :key="agent.id"
                    :value="agent.id"
                  >
                    {{ agent.hostname }} ({{ agent.os }})
                  </option>
                </select>
                <p class="mt-1.5 text-xs text-muted-foreground">
                  Leave empty to let any matching agent claim the job.
                </p>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-secondary/35 p-4">
              <label class="block text-xs font-medium text-foreground/70 mb-3"
                >Schedule</label
              >
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <label
                  v-for="opt in scheduleOptions"
                  :key="opt.value"
                  :class="[
                    'flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-all',
                    form.scheduleType === opt.value
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/20',
                  ]"
                >
                  <input
                    type="radio"
                    v-model="form.scheduleType"
                    :value="opt.value"
                    class="sr-only"
                  />
                  <span
                    class="text-sm font-semibold"
                    :class="
                      form.scheduleType === opt.value
                        ? 'text-primary'
                        : 'text-foreground'
                    "
                  >
                    {{ opt.label }}
                  </span>
                  <span
                    class="text-xs"
                    :class="
                      form.scheduleType === opt.value
                        ? 'text-primary/70'
                        : 'text-muted-foreground'
                    "
                  >
                    {{ opt.desc }}
                  </span>
                </label>
              </div>

              <div v-if="form.scheduleType === 'once'" class="mt-4">
                <label class="block text-xs font-medium text-foreground/70 mb-2"
                  >Date & Time</label
                >
                <input
                  v-model="form.scheduleAt"
                  type="datetime-local"
                  class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>

              <div v-if="form.scheduleType === 'recurring'" class="mt-4">
                <label class="block text-xs font-medium text-foreground/70 mb-2"
                  >Cron Pattern</label
                >
                <input
                  v-model="form.repeatCron"
                  type="text"
                  placeholder="0 9 * * *"
                  class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground font-mono text-sm placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />

                <div class="mt-3 rounded-lg bg-secondary p-3 space-y-1">
                  <p class="text-xs text-muted-foreground font-mono">
                    <span class="text-primary">*</span> * * * * → every minute
                  </p>
                  <p class="text-xs text-muted-foreground font-mono">
                    0 <span class="text-primary">*</span> * * * → every hour
                  </p>
                  <p class="text-xs text-muted-foreground font-mono">
                    0 9 <span class="text-primary">*</span> * * → daily at 9am
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-secondary/35 p-4">
              <button
                type="button"
                @click="showAdvanced = !showAdvanced"
                class="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  :class="[
                    'w-3.5 h-3.5 transition-transform',
                    showAdvanced ? 'rotate-90' : '',
                  ]"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M4 2.5L8 6l-4 3.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Advanced Options
              </button>

              <div
                v-if="showAdvanced"
                class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1"
              >
                <div>
                  <label
                    class="block text-xs font-medium text-foreground/70 mb-2"
                    >Max Retries</label
                  >
                  <input
                    v-model.number="form.maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="3"
                    class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-foreground/70 mb-2"
                    >Timeout (sec)</label
                  >
                  <input
                    v-model.number="form.timeoutSec"
                    type="number"
                    min="0"
                    placeholder="None"
                    class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-6">
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity box-glow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="submitting"
              class="animate-spin w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            {{ submitting ? "Deploying..." : "Deploy Job" }}
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2.5 bg-secondary border border-border hover:border-border/80 text-foreground/80 rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { jobAPI } from "@/api/apis";
import { showAPIToast } from "@/composables/showApiToast";
import { handleApiError } from "@/composables/errorHandler";

const props = defineProps<{ agents: any[]; defaultAgentId?: string }>();
const emit = defineEmits(["close", "job-created"]);

const submitting = ref(false);
const showAdvanced = ref(false);
const scheduleOptions = [
  { value: "now", label: "Run Now", desc: "Execute immediately" },
  { value: "once", label: "Once", desc: "At a specific time" },
  { value: "recurring", label: "Recurring", desc: "Cron schedule" },
];

const form = ref({
  title: "",
  description: "",
  script: "",
  agentId: props.defaultAgentId || "",
  scheduleType: "now" as "now" | "once" | "recurring",
  scheduleAt: "",
  repeatCron: "",
  maxRetries: undefined as number | undefined,
  timeoutSec: undefined as number | undefined,
});

const handleCreate = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const repeatCron = form.value.repeatCron.trim();
    if (form.value.scheduleType === "recurring" && !repeatCron) {
      throw new Error("Cron pattern is required for recurring jobs");
    }

    const payload: any = {
      title: form.value.title,
      description: form.value.description || undefined,
      script: form.value.script,
      agentId: form.value.agentId || undefined,
      maxRetries: form.value.maxRetries,
      timeoutSec: form.value.timeoutSec,
    };

    if (form.value.scheduleType === "once") {
      payload.scheduleAt = new Date(form.value.scheduleAt).toISOString();
      payload.isRecurring = false;
    } else if (form.value.scheduleType === "recurring") {
      payload.repeatCron = repeatCron;
      payload.isRecurring = true;
    } else {
      payload.isRecurring = false;
    }

    const res = await jobAPI.createJob(payload);
    showAPIToast({
      status: res.status,
      message: (res.data as any)?.message || "Job deployed successfully",
    });

    form.value = {
      title: "",
      description: "",
      script: "",
      agentId: "",
      scheduleType: "now",
      scheduleAt: "",
      repeatCron: "",
      maxRetries: undefined,
      timeoutSec: undefined,
    };
    showAdvanced.value = false;
    emit("job-created");
    emit("close");
  } catch (err) {
    const normalized = handleApiError(err);
    showAPIToast(normalized);
  } finally {
    submitting.value = false;
  }
};
</script>
