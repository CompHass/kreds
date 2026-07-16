import { z } from 'zod'

const serviceAccountKeySchema = z.object({
  type: z.literal('serviceaccount'),
  keyId: z.string().min(1),
  key: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1).optional(),
})

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  ZITADEL_ISSUER: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  CHILD_SESSION_SECRET: z.string().min(32),
  AUTH_ZITADEL_ID: z.string().min(1),
  AUTH_ZITADEL_SECRET: z.string().min(1),
  AUTH_ZITADEL_ISSUER: z.string().url().default('https://auth.hasslab.pro'),
  PIN_ENCRYPTION_KEY: z.string().refine(
    (v) => Buffer.from(v, 'base64').length === 32,
    'PIN_ENCRYPTION_KEY must be a base64-encoded 32-byte (256-bit) key',
  ),
  IAM_LOGIN_CLIENT: z.string().min(1).transform((value, ctx) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(value)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'IAM_LOGIN_CLIENT must be valid JSON' })
      return z.NEVER
    }
    const result = serviceAccountKeySchema.safeParse(parsed)
    if (!result.success) {
      ctx.addIssue({ code: 'custom', message: 'IAM_LOGIN_CLIENT has an invalid service-account key shape' })
      return z.NEVER
    }
    return result.data
  }),
})

export const env = envSchema.parse(process.env)
