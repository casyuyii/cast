<template>
  <div class="card flex justify-content-center">
    <Textarea v-model="value" class="w-full" />
  </div>
</template>

<script setup>
import { ref } from "vue";

const value = ref("");
</script>
