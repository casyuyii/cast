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

    <Button
      label="Share"
      :loading="shareLoding"
      @click="shareText"
      icon="pi pi-check"
    />

    <transition-group name="p-message">
      <Message v-for="msg of messages" :key="msg.id" :severity="msg.severity">{{
        msg.content
      }}</Message>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { ShareText } from "~/api/share-text"

const textValue = ref("")
const shareLoding = ref(false)
const secretKey = ref("")
const sharedText = ref("")
const messages = ref([])
let count = ref(0)

const shareText = async () => {
  shareLoding.value = true
  sharedText.value = await ShareText({
    text: textValue.value,
    secretKey: secretKey.value,
  })

  messages.value = [
    { severity: "success", content: "Text Shared", id: count.value++ },
  ]

  shareLoding.value = false
}
</script>
