<template>
  <div>
    <Textarea v-model="value" autoResize rows="30" class="w-full" />

    <div class="flex flex-col gap-2">
      <InputText
        id="secretKey"
        v-model="secretKey"
        aria-describedby="secretKey-help"
      />
      <small id="secretKey-help"> Secret Key(Optional) </small>
    </div>

    <Button label="Share" :loading="share" @click="shareText" class="" />
  </div>
</template>

<script setup>
import { ref } from "vue"
import { ShareText } from "~/api/share-text"

const value = ref("")
const share = ref(false)
const secretKey = ref("")

const shareText = () => {
  share.value = true
  ShareText({ text: value.value, secretKey: secretKey.value })
    .then((res) => {
      console.log(res)
      share.value = false
    })
    .catch((err) => {
      console.log(err)
      share.value = false
    })
}
</script>
