export const EMAIL_NOT_VERIFIED_REDIRECT = '/login?error=email-not-verified'

export function guardianSignInDecision(input: {
  profileEmailVerified?: boolean
  credentialsEmailVerified?: boolean
  provisionalSignup?: boolean
}): true | typeof EMAIL_NOT_VERIFIED_REDIRECT {
  if (input.profileEmailVerified === false) return EMAIL_NOT_VERIFIED_REDIRECT
  if (input.profileEmailVerified === undefined && input.credentialsEmailVerified === false && input.provisionalSignup !== true) {
    return EMAIL_NOT_VERIFIED_REDIRECT
  }
  return true
}
