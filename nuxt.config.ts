import path from "path";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: ["nuxt-primevue"],
  primevue: {
    options: {
      unstyled: true,
    },
    importPT: { from: path.resolve(__dirname, "./presets/lara/") },
  },
  // css: ["primevue/resources/themes/aura-light-green/theme.css"],
  css: ["~/assets/css/tailwind.css"],
});
