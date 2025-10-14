// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/resume": "https://docs.google.com/document/d/1LThX44LmBYZfaO6oM9SfN2nhyDP4g3ODcG_feOuYSNM",
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
