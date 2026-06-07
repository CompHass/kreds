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

// Families — extended with creator identity and soft deactivation
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdByIdentityId: uuid('created_by_identity_id').references(
    () => identities.id,
  ),
  deactivatedAt: timestamp('deactivated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

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

export * from './ledger'
