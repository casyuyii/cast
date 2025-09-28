// @ts-check
import eslint from "@eslint/js"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import tseslint from "typescript-eslint"
import astroPlugin from "eslint-plugin-astro"
import { FlatCompat } from "@eslint/eslintrc"
import { defineConfig } from "eslint/config"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const nextConfig = compat.config({
  extends: ["next"],
  settings: {
    next: {
      rootDir: "packages/client/",
    },
  },
})

export default defineConfig([
  {
    ignores: [
      "eslint.config.mjs",
      "**/dist/**",
      "**/node_modules/**",
      "**/output/**",
      "**/.next/**",
      "**/.astro/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  ...nextConfig,

  {
    files: ["packages/server/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: "packages/server/tsconfig.json",
      },
    },
  },
  {
    files: ["packages/blog/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      astro: astroPlugin,
    },
    rules: {
      ...astroPlugin.configs.recommended.rules,
    },
    ignores: ["packages/blog/.astro/**"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: "packages/blog/tsconfig.json",
      },
    },
  },
])
