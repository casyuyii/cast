// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["nuxt-primevue", "@nuxtjs/eslint-module", "@nuxtjs/tailwindcss"],
  primevue: {},
  css: ["primevue/resources/themes/aura-light-green/theme.css"],
})
