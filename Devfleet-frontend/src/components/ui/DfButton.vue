<script setup lang="ts">
defineProps<{
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
}>();

defineEmits<{ click: [e: MouseEvent] }>();
</script>

<template>
  <button
    v-bind="$attrs"
    @click="$emit('click', $event)"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150 ease-out select-none',
      // size
      size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-4 py-2 text-[13px]',
      // variant
      variant === 'primary'
        ? 'bg-[#4ADE80] text-[#0B0B0C] hover:bg-[#22C55E] active:bg-[#16a34a]'
        : variant === 'secondary'
        ? 'bg-transparent border border-white/10 text-[#E6E6E6] hover:border-white/20 hover:bg-white/4'
        : variant === 'danger'
        ? 'bg-transparent border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10'
        : 'bg-transparent text-[#8A8A8F] hover:text-[#E6E6E6] hover:bg-white/5',
      // disabled
      (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '',
    ]"
  >
    <svg v-if="loading" class="df-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    <slot />
  </button>
</template>
