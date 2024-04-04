<template>
  <div class="">
    <Textarea v-model="text" rows="27" autoResize class="w-full" />
    <Button label="Share" @click="sharetext" />
  </div>
</template>

<script setup>
import { ref } from "vue"

const text = ref("")
async function sharetext() {
  await useFetch("/api/sharetext", {
    method: "post",
    body: { text: text.value },
  })
}
</script>
