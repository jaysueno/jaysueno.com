import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const essays = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/essays" }),
  schema: z.object({
    title: z.string(),
    dek: z.string().optional(),
    // Search and share text, when the dek is too short to stand alone there.
    description: z.string().optional(),
    date: z.coerce.date(),
    substack: z.string().url(),
  }),
});
export const collections = { essays };
