<template>
  <div class="">
    <Textarea v-model="text" rows="27" autoResize class="w-full" />
    <Button label="Share" @click="sharetext" />
    <Message :severity="shareRsp">{{ shareKey }}</Message>
  </div>
</template>

<script setup>
const text = ref("")
const shareRsp = ref("info")
const shareKey = ref("click share to get key")
async function sharetext() {
  const { data, status, error } = await useFetch("/api/sharetext", {
    method: "post",
    body: { text: text.value },
  })

  if (status.value === "success") {
    shareRsp.value = "success"
    shareKey.value = `gettext/${data.value.key}`
  } else {
    shareRsp.value = "error"
    shareKey.value = error.value
  }
}
</script>
