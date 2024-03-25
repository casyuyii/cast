<template>
  <div>
    <Menubar :model="topMenu"> </Menubar>

    <PanelMenu :model="items" style="width: 25%">
      <template #item="{ item }">
        <router-link v-slot="{ href, navigate }" :to="item.route" custom>
          <a
            v-ripple
            class="flex align-items-center cursor-pointer text-color px-3 py-2"
            :href="href"
            @click="navigate"
          >
            <span :class="item.icon" />
            <span class="ml-2 text-color">{{ item.label }}</span>
          </a>
        </router-link>
      </template>
    </PanelMenu>

    <slot class="" />
  </div>
</template>

<script setup>
import { ref } from "vue"
import "primeicons/primeicons.css"

const topMenu = ref([
  {
    label: "Home",
    icon: "pi pi-home",
  },
])

const items = ref([
  {
    label: "ShareText",
    icon: "pi pi-link",
    route: "/sharetext",
  },
])
</script>
