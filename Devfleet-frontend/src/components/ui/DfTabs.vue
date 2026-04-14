<script setup lang="ts">
const props = defineProps<{
  tabs: string[];
  modelValue: string;
}>();

const emit = defineEmits<{ "update:modelValue": [val: string] }>();
</script>

<template>
  <div class="flex gap-0 df-border-b">
    <button
      v-for="tab in tabs"
      :key="tab"
      @click="emit('update:modelValue', tab)"
      :class="[
        'px-3 py-2 text-[12px] font-medium transition-all duration-150 ease-out relative',
        modelValue === tab
          ? 'text-[#E6E6E6] after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-[#4ADE80]'
          : 'text-[#8A8A8F] hover:text-[#E6E6E6]',
      ]"
    >
      {{ tab }}
    </button>
  </div>
</template>
