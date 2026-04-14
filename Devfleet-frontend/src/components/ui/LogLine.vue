<script setup lang="ts">
defineProps<{
  timestamp?: string;
  level?: string;   // STDOUT | STDERR | SYSTEM
  message: string;
}>();

const COLOR: Record<string, string> = {
  STDERR: "text-[#EF4444]",
  STDOUT: "text-[#4ADE80]",
  SYSTEM: "text-[#F59E0B]",
  INFO:   "text-[#4ADE80]",
  ERROR:  "text-[#EF4444]",
  WARN:   "text-[#F59E0B]",
};

const levelColor = (level?: string) =>
  level ? (COLOR[level.toUpperCase()] ?? "text-[#8A8A8F]") : "text-[#8A8A8F]";
</script>

<template>
  <div class="flex gap-2 leading-5 py-px pr-2 df-log-hover min-w-0">
    <span
      v-if="timestamp"
      class="font-mono text-[11px] text-white/25 shrink-0 select-none whitespace-nowrap"
    >
      {{ timestamp }}
    </span>
    <span
      v-if="level"
      :class="['font-mono text-[11px] font-semibold shrink-0 w-14 text-right select-none', levelColor(level)]"
    >
      {{ level }}
    </span>
    <span class="font-mono text-[11px] text-[#E6E6E6]/80 break-all whitespace-pre-wrap flex-1 min-w-0">{{ message }}</span>
  </div>
</template>
