<template>
  <Textarea v-model="text" rows="27" autoResize class="w-full" />
  <Message :severity="shareRsp">{{ shareKey }}</Message>
</template>

<script setup>
import { ref } from "vue"

const route = useRoute()
const text = ref("")
const shareRsp = ref("info")
const shareKey = ref("get text by dynamic route")
const { data, status, error } = await useFetch("/api/gettext", {
  method: "post",
  body: { key: route.params.code },
})

if (status.value === "success" && data.value.value) {
  shareRsp.value = "success"
  text.value = data.value.value
  shareKey.value = "got text by key"
} else {
  shareRsp.value = "error"
  shareKey.value = error.value
}
</script>
