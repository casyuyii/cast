<template>
  <div class="">
    <Textarea v-model="text" rows="27" autoResize class="w-full" />
  </div>
</template>

<script setup>
import { ref } from "vue"

const text = ref("")
</script>
