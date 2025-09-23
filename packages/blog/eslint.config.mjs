import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import astroPlugin from "eslint-plugin-astro";

export default [
  {
    ignores: ["**/*.md", "**/*.mdx", "dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Basic rules for now
    },
  },
  ...astroPlugin.configs["flat/recommended"],
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroPlugin.parser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      // Astro-specific rules
    },
  },
];
