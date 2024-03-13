<template>
  <div>
    <Textarea v-model="textValue" autoResize rows="20" class="w-full" />

    <div class="flex flex-col gap-2">
      <InputText
        id="secretKey"
        v-model="secretKey"
        aria-describedby="secretKey-help"
      />
      <small id="secretKey-help"> Secret Key(Optional) </small>
    </div>

    <Button label="Share" :loading="shareLoding" @click="shareText" class="" />
  </div>
</template>

<script setup>
import { ref } from "vue"
import { ShareText } from "~/api/share-text"

const textValue = ref("")
const shareLoding = ref(false)
const secretKey = ref("")

const shareText = async () => {
  shareLoding.value = true
  await ShareText({ text: textValue.value, secretKey: secretKey.value })
  shareLoding.value = false
}
</script>
