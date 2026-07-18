import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enums
export const familyRoleEnum = pgEnum('family_role', ['guardian', 'child'])
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'inactive'])
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
  'declined',
])

// Kreds identities — keyed by ZITADEL subject (FAM-04, D-16)
// Must be defined before families due to forward FK reference
export const identities = pgTable('kreds_identities', {
  id: uuid('id').defaultRandom().primaryKey(),
  zitadelSubject: text('zitadel_subject').unique().notNull(),
  email: text('email'),
  emailVerified: boolean('email_verified').default(false),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// One-time, short-lived capability used only to establish the first session
// immediately after native guardian signup. Raw tokens are never persisted.
export const guardianSignupTokens = pgTable(
  'guardian_signup_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identityId: uuid('identity_id').notNull().references(() => identities.id),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    identityIdIdx: index('guardian_signup_tokens_identity_id_idx').on(table.identityId),
  }),
)

// Families — extended with creator identity and soft deactivation
export const families = pgTable(
  'families',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
    createdByIdentityId: uuid('created_by_identity_id').references(
      () => identities.id,
    ),
    // Phase 10: 0=Sunday..6=Saturday — day the weekly activity cycle begins.
    // Read by getCurrentCycleStart() (garden, task completion, reports).
    cycleStartDay: integer('cycle_start_day').notNull().default(0),
    // Phase 13: guardian PIN gate. bcrypt hash, shared by all guardians of the
    // family (mirrors childProfiles.pinHash). Null until first "guardian-setup";
    // while null, /family/* routes redirect to the setup flow. See
    // src/lib/families/guardian-session.ts + src/app/actions/guardian-auth.ts.
    guardianPinHash: text('guardian_pin_hash'),
    deactivatedAt: timestamp('deactivated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    cycleStartDayCheck: check(
      'cycle_start_day_range',
      sql`${table.cycleStartDay} >= 0 AND ${table.cycleStartDay} <= 6`,
    ),
  }),
)

// Child profiles — parent-managed (FAM-03, D-09 through D-12)
export const childProfiles = pgTable(
  'child_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    displayName: text('display_name').notNull(),
    ageYears: integer('age_years').notNull(),
    avatarPreset: text('avatar_preset').notNull(),
    accentColor: text('accent_color').notNull(),
    identityId: uuid('identity_id'), // nullable — future ZITADEL child identity link (D-10)
    active: boolean('active').notNull().default(true),
    deactivatedAt: timestamp('deactivated_at'),
    pinHash: text('pin_hash'),
    pinEncrypted: text('pin_encrypted'), // nullable — D-12; null until first "Redefinir PIN" post-migration
    lastAccessedAt: timestamp('last_accessed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('child_profiles_family_id_idx').on(table.familyId),
  }),
)

// Family memberships — Kreds-domain roles stored by family_id (FAM-04, FAM-05)
export const familyMemberships = pgTable(
  'family_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    identityId: uuid('identity_id').references(() => identities.id),
    childProfileId: uuid('child_profile_id').references(() => childProfiles.id),
    role: familyRoleEnum('role').notNull(),
    status: membershipStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('family_memberships_family_id_idx').on(table.familyId),
    uniqueActiveGuardian: uniqueIndex('unique_active_guardian').on(
      table.familyId,
      table.identityId,
    ),
    oneTargetCheck: check(
      'one_member_target',
      sql`(${table.identityId} IS NOT NULL AND ${table.childProfileId} IS NULL) OR (${table.identityId} IS NULL AND ${table.childProfileId} IS NOT NULL)`,
    ),
  }),
)

// Guardian invitations — auditable lifecycle (FAM-02, D-05 through D-08)
export const guardianInvitations = pgTable(
  'guardian_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    email: text('email').notNull(),
    status: invitationStatusEnum('status').notNull().default('pending'),
    tokenHash: text('token_hash').notNull(),
    invitedByIdentityId: uuid('invited_by_identity_id').references(
      () => identities.id,
    ),
    acceptedByIdentityId: uuid('accepted_by_identity_id').references(
      () => identities.id,
    ),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('guardian_invitations_family_id_idx').on(table.familyId),
    uniquePendingInvite: uniqueIndex('unique_pending_invite')
      .on(table.familyId, table.email)
      .where(sql`${table.status} = 'pending'`),
  }),
)

// Family audit events — parent-readable timeline (FAM-07, D-17, D-18)
export const familyAuditEvents = pgTable(
  'family_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    actorIdentityId: uuid('actor_identity_id').references(() => identities.id),
    eventType: text('event_type').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    summary: text('summary').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('family_audit_events_family_id_idx').on(table.familyId),
  }),
)

// Parental consents — explicit child-profile consent evidence (FAM-03, D-02, D-13)
export const parentalConsents = pgTable(
  'parental_consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    guardianIdentityId: uuid('guardian_identity_id')
      .notNull()
      .references(() => identities.id),
    consentType: text('consent_type').notNull(),
    consentedAt: timestamp('consented_at').defaultNow().notNull(),
    source: text('source'),
  },
  (table) => ({
    familyIdIdx: index('parental_consents_family_id_idx').on(table.familyId),
  }),
)

// Task templates — weekly recurring responsibilities (Phase 4, ACT-01, ACT-03)
export const taskTemplates = pgTable(
  'task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    assignedChildId: uuid('assigned_child_id')
      .notNull()
      .references(() => childProfiles.id),
    title: text('title').notNull(),
    description: text('description'), // nullable by default in Drizzle (no .notNull())
    kredsValue: integer('kreds_value').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    category: text('category'),
    days: jsonb('days').$type<number[]>(),
    approval: boolean('approval').notNull().default(false),
    deactivatedAt: timestamp('deactivated_at'), // nullable — D-06: history preserved on row
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('task_templates_family_id_idx').on(table.familyId),
    childIdIdx: index('task_templates_child_id_idx').on(table.assignedChildId),
    kredsValueCheck: check(
      'kreds_value_positive',
      sql`${table.kredsValue} > 0`,
    ),
  }),
)

export * from './ledger'

// Wishlist goals — child savings targets (GOAL-01, GOAL-02)
export const wishlistGoalStatusEnum = pgEnum('wishlist_goal_status', ['active', 'achieved', 'archived'])

export const wishlistGoals = pgTable(
  'wishlist_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    childProfileId: uuid('child_profile_id').notNull().references(() => childProfiles.id),
    title: text('title').notNull(),
    targetAmount: integer('target_amount').notNull(),
    allocatedAmount: integer('allocated_amount').notNull().default(0),
    status: wishlistGoalStatusEnum('status').notNull().default('active'),
    dueDate: text('due_date'), // nullable ISO date string 'YYYY-MM-DD' (Phase 11) — no time/deadline enforcement, display-only
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    childIdIdx: index('wishlist_goals_child_profile_id_idx').on(table.childProfileId),
    familyIdIdx: index('wishlist_goals_family_id_idx').on(table.familyId),
    targetAmountCheck: check('target_amount_positive', sql`${table.targetAmount} > 0`),
    allocatedAmountCheck: check('allocated_non_negative', sql`${table.allocatedAmount} >= 0`),
  }),
)

// Task completions — child task completion tracking per cycle (Phase 11, D-07)
export const taskCompletionStatusEnum = pgEnum('task_completion_status', ['pending', 'completed'])

export const taskCompletions = pgTable(
  'task_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskTemplateId: uuid('task_template_id')
      .notNull()
      .references(() => taskTemplates.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    cycleStart: text('cycle_start').notNull(), // ISO date string: 'YYYY-MM-DD'
    completedAt: timestamp('completed_at'),
    status: taskCompletionStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    childIdIdx: index('task_completions_child_id_idx').on(table.childProfileId),
    taskIdIdx: index('task_completions_task_id_idx').on(table.taskTemplateId),
    uniqueTaskChildCycle: uniqueIndex('unique_task_child_cycle').on(
      table.taskTemplateId,
      table.childProfileId,
      table.cycleStart,
    ),
  }),
)

// Donations — Kreds do Bem requests (Phase 11, D-10)
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'approved', 'rejected'])

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    targetLabel: text('target_label').notNull(),
    amountKreds: integer('amount_kreds').notNull(),
    status: donationStatusEnum('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at').defaultNow().notNull(),
    approvedAt: timestamp('approved_at'),
  },
  (table) => ({
    familyIdIdx: index('donations_family_id_idx').on(table.familyId),
    childIdIdx: index('donations_child_id_idx').on(table.childProfileId),
    amountCheck: check('donation_amount_positive', sql`${table.amountKreds} > 0`),
  }),
)

// Bible verses — seed data for celebration overlay (Phase 3, GARD-10, D-06, D-07)
export const bibleVerses = pgTable('bible_verses', {
  id: uuid('id').defaultRandom().primaryKey(),
  reference: text('reference').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Notification preferences — Phase 10. One row per family; toggles are
// stored/managed only. There is no delivery channel yet (no email/push
// infra in this project) — these booleans exist so the settings UI is
// truthful and ready to wire to a real sender later without a schema change.
export const notificationPreferences = pgTable('notification_preferences', {
  familyId: uuid('family_id').primaryKey().references(() => families.id),
  taskCompleted: boolean('task_completed').notNull().default(true),
  goalAchieved: boolean('goal_achieved').notNull().default(true),
  weeklyReportReady: boolean('weekly_report_ready').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
