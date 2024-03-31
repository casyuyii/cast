<template>
  <div class="">
    <Textarea v-model="text" rows="27" autoResize class="w-full" />
    <Button label="Share" @click="sharetext" />
  </div>
</template>

<script setup>
import { ref } from "vue"

const text = ref("")
function sharetext() {
  console.log(text.value)
}
</script>
