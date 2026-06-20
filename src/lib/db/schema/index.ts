import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const identities = pgTable('kreds_identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  zitadelSubject: text('zitadel_subject').notNull().unique(),
  email: text('email'),
  emailVerified: boolean('email_verified').default(false),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
