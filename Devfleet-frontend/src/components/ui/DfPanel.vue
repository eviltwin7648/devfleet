<script setup lang="ts">
defineProps<{
  noPad?: boolean;
}>();
</script>

<template>
  <div
    :class="[
      'df-surface rounded-md df-border',
      noPad ? '' : 'p-4',
    ]"
  >
    <slot />
  </div>
</template>
