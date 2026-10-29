import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/pages/blog",
  }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date().optional(),
    topics: z.array(z.string().min(1)).default([]),
    archived: z.boolean().default(false),
    unlisted: z.boolean().default(false),
    sourceUrl: z.string().url().optional(),
  }),
})

export const collections = { blog }
