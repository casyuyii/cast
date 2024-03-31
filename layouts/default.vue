<template>
  <div class="card">
    <Menubar :model="items" />

    <slot />
  </div>
</template>

<script setup>
import { ref } from "vue"

const items = ref([
  {
    label: "ShareText",
    icon: "pi pi-file-edit",
    url: "/sharetext",
  },
  {
    label: "GetText",
    icon: "pi pi-file",
    url: "/gettext",
  },
])
</script>
