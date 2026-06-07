// Stub — implemented in GREEN phase of Task 2

export interface CreateFamilyInput {
  zitadelSub: string
  email: string
  familyName: string
  timezone: string
}

export interface CreateFamilyResult {
  family: { id: string; name: string; timezone: string }
  identity: { id: string; zitadelSub: string; email: string }
  membership: { identityId: string; familyId: string; role: string; status: string }
  redirectTo: string
}

export function createFamily(_input: CreateFamilyInput): CreateFamilyResult {
  throw new Error('Not implemented — stub for RED phase')
}

export interface AddGuardianMembershipInput {
  familyId: string
  identityId: string
}

export function addGuardianMembership(_input: AddGuardianMembershipInput) {
  throw new Error('Not implemented — stub for RED phase')
}
