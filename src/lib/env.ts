import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ZITADEL_ISSUER: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
