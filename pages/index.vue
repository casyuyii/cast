<template>
  <div>
    <Textarea v-model="value" class="w-full" />
  </div>
</template>

<script setup>
import { ref } from "vue";

const value = ref("");
</script>
