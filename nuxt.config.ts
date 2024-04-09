// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["nuxt-primevue"],
  primevue: {
    cssLayerOrder: "reset,primevue",
  },
  css: [
    "primevue/resources/themes/aura-light-green/theme.css",
    "primeicons/primeicons.css",
    "primeflex/primeflex.css",
  ],
  nitro: {
    storage: {
      redis: {
        driver: "redis",
        host: process.env.REDIS_HOST || "redis",
        port: process.env.REDIS_PORT || 6379,
      },
    },
  },
})
