<template>
  <div>
    <Menubar :model="items"> </Menubar>
    <slot />
  </div>
</template>

<script setup>
import { ref } from "vue"

const items = ref([
  {
    label: "Home",
    icon: "pi pi-home",
  },
  {
    label: "Features",
    icon: "pi pi-star",
  },

  {
    label: "Contact",
    icon: "pi pi-envelope",
    badge: 3,
  },
])
</script>
