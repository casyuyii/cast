<template>
  <div>
    <Textarea v-model="value" autoResize rows="30" class="w-full" />
    <Button label="Share" :loading="share" @click="shareText" class="" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ShareText } from "~/api/api";

const value = ref("");
const share = ref(false);

const shareText = () => {
  share.value = true;
  ShareText(value.value)
    .then((res) => {
      console.log(res);
      share.value = false;
    })
    .catch((err) => {
      console.log(err);
      share.value = false;
    });
};
</script>
