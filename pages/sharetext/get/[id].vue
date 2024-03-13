<template>
  <Textarea v-model="sharedText" autoResize rows="20" class="w-full" />
</template>

<script setup>
import { useRoute } from "vue-router"
import { ref } from "vue"
import { GetSharedText } from "~/api/share-text"

const sharedText = ref("")

const route = useRoute()
sharedText.value = await GetSharedText({ shareCode: route.params.id })
</script>
