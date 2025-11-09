<script setup lang="ts">
interface Props {
  message: string;
  retryable?: boolean;
}

withDefaults(defineProps<Props>(), {
  retryable: false,
});

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="text-center py-10 text-red-500">
    <p>{{ message }}</p>
    <button 
      v-if="retryable"
      @click="emit('retry')"
      class="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      再試行
    </button>
  </div>
</template>
