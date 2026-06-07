import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ZITADEL_ISSUER: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  AUTH_ZITADEL_ID: z.string().min(1),
  AUTH_ZITADEL_SECRET: z.string().min(1),
  AUTH_ZITADEL_ISSUER: z.string().url().default('https://auth.hasslab.pro'),
})

export const env = envSchema.parse(process.env)
