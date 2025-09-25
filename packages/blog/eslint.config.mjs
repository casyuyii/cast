import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import astroPlugin from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {},
  },
  ...astroPlugin.configs["flat/recommended"],
  {
    rules: {},
  },
]);
