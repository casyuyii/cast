import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/pages/blog",
  }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    topics: z.array(z.string().min(1)).default([]),
  }),
})

export const collections = { blog }
