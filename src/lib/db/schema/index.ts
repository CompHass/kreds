import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
