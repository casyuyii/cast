import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { readdirSync } from "fs";
import { join } from "path";

// Define the blog post schema
const blogPostSchema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
});

// Function to dynamically create collections based on year folders
function createDynamicCollections() {
  const postsDir = "./src/pages/posts";
  const collections: Record<string, any> = {};

  try {
    // Read all year directories in the posts folder
    const yearDirs = readdirSync(postsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Create a collection for each year
    yearDirs.forEach((year) => {
      const collectionName = `posts${year}`;
      collections[collectionName] = defineCollection({
        loader: glob({
          pattern: "**/*.md",
          base: join(postsDir, year),
        }),
        schema: blogPostSchema,
      });
    });
  } catch (error) {
    console.warn("Could not read posts directory:", error);
  }

  return collections;
}

// Create collections dynamically
const collections = createDynamicCollections();

export { collections };
