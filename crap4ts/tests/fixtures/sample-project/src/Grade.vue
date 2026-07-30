<template>
  <span v-if="visible">{{ grade(score) }}</span>
</template>

<script setup lang="ts">
import { ref } from "vue";

const visible = ref(true);

function grade(score: number): string {
  if (score > 90) return "A";
  if (score > 80) return "B";
  if (score > 70) return "C";
  return "F";
}

function toggle(): void {
  visible.value = !visible.value;
}
</script>

<style scoped>
span { color: red; }
</style>
