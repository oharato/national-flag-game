<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  disabled: false,
  type: 'button',
});

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-indigo-600 hover:bg-indigo-700',
  success: 'bg-green-700 hover:bg-green-800',
  danger: 'bg-red-500 hover:bg-red-700',
  purple: 'bg-purple-700 hover:bg-purple-800',
  gray: 'bg-gray-500 hover:bg-gray-700',
};

const sizeClasses = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4',
  lg: 'py-3 px-4 text-lg',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'text-white font-bold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      disabled ? 'opacity-50 cursor-not-allowed hover:bg-gray-400' : '',
    ]"
  >
    <slot />
  </button>
</template>
