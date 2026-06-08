import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { childProfiles, families, identities } from './index'

export const transactionTypeEnum = pgEnum('transaction_type', [
  'task_earning',
  'negative_adjustment',
  'reversal',
  'donation_match',
  'goal_allocation',
])

export const accountTypeEnum = pgEnum('account_type', ['available', 'firstfruits'])

export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    commandId: uuid('command_id').notNull(),
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    initiatedByIdentityId: uuid('initiated_by_identity_id').references(
      () => identities.id,
    ),
    correctsTransactionId: uuid('corrects_transaction_id'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    commandIdUnique: uniqueIndex('ledger_transactions_command_id_unique').on(
      table.commandId,
    ),
    childIdIdx: index('ledger_transactions_child_profile_id_idx').on(
      table.childProfileId,
    ),
    familyIdIdx: index('ledger_transactions_family_id_idx').on(table.familyId),
    selfReferenceCheck: check(
      'no_self_correction',
      sql`${table.correctsTransactionId} IS NULL OR ${table.correctsTransactionId} != ${table.id}`,
    ),
  }),
)

export const ledgerLines = pgTable(
  'ledger_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => ledgerTransactions.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    accountType: accountTypeEnum('account_type').notNull(),
    amount: integer('amount').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    transactionIdIdx: index('ledger_lines_transaction_id_idx').on(
      table.transactionId,
    ),
    childIdIdx: index('ledger_lines_child_profile_id_idx').on(
      table.childProfileId,
    ),
    nonZeroCheck: check('non_zero_amount', sql`${table.amount} != 0`),
  }),
)
