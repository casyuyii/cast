<template>
  <div>
    <Textarea v-model="value" autoResize rows="30" class="w-full" />
    <Button label="Share" :loading="share" @click="shareText" class="" />
  </div>
</template>

<script setup>
import { ref } from "vue";

const value = ref("");
const share = ref(false);

const shareText = () => {
  share.value = true;
  console.log(value.value);
  setTimeout(() => {
    share.value = false;
  }, 2000);
};
</script>
