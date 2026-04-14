<script setup lang="ts">
export type StatusType = "running" | "success" | "failed" | "queued" | "pending" | "cancelled" | "timeout" | "dispatched" | "ready";

const props = defineProps<{
  status: StatusType | string;
  label?: string;
}>();

const MAP: Record<string, { dot: string; text: string; bg: string }> = {
  running:    { dot: "bg-[#4ADE80] df-dot-pulse", text: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
  dispatched: { dot: "bg-[#4ADE80] df-dot-pulse", text: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
  success:    { dot: "bg-[#22C55E]",              text: "text-[#22C55E]", bg: "bg-[#22C55E]/10" },
  failed:     { dot: "bg-[#EF4444]",              text: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
  timeout:    { dot: "bg-[#EF4444]",              text: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
  queued:     { dot: "bg-[#F59E0B] df-dot-pulse", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  pending:    { dot: "bg-[#F59E0B] df-dot-pulse", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  ready:      { dot: "bg-[#F59E0B] df-dot-pulse", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  cancelled:  { dot: "bg-[#8A8A8F]",              text: "text-[#8A8A8F]", bg: "bg-white/5" },
};

const resolved = () => {
  const key = (props.status || "").toLowerCase();
  return MAP[key] ?? { dot: "bg-[#8A8A8F]", text: "text-[#8A8A8F]", bg: "bg-white/5" };
};

const label = () => props.label ?? (props.status.charAt(0).toUpperCase() + props.status.slice(1).toLowerCase());
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium leading-none',
      resolved().bg,
      resolved().text,
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full shrink-0', resolved().dot]" />
    {{ label() }}
  </span>
</template>
