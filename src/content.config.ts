import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod/v4'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    author: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      ratio: z.string().default('16:10'),
    }),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    disabled: z.boolean().default(false),
    active: z.boolean().default(true),
    instagramUrl: z.string().optional(),
    instagramId: z.string().optional(),
  }),
})

const camps = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/camps' }),
  schema: z.object({
    year: z.number().int().positive(),
    title: z.string(),
    motto: z.string(),
    active: z.boolean().default(true),
    date: z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    }),
    age: z.object({
      min: z.number().int(),
      max: z.number().int(),
    }),
    price: z.string().default('189 €'),
    location: z.object({
      name: z.string(),
      coordinates: z.string().optional(),
    }),
    theme: z.object({
      id: z.string(),
      colors: z.object({
        background: z.string(),
        foreground: z.string(),
        accent: z.string(),
      }),
      assets: z.object({
        hero: z.string(),
        texture: z.string().optional(),
      }),
    }),
    registration: z.object({
      enabled: z.boolean().default(true),
      url: z.url().optional(),
      deadline: z.coerce.date().optional(),
    }),
    story: z.string().optional(),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    images: z.array(z.object({ src: z.string(), alt: z.string(), ratio: z.string() })).default([]),
  }),
})

export const collections = { posts, camps }
