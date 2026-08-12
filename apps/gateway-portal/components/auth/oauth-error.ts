/**
 * Map Better Auth OAuth callback error codes to user-facing copy.
 * Callback redirects use `?error=<code>` (spaces become underscores).
 */
export function oauthErrorMessage(errorCode: string | null | undefined): string | null {
  if (!errorCode) return null;

  switch (errorCode) {
    case "account_not_linked":
      return "An account with this email already exists using a different sign-in method. Sign in with your email and password instead.";
    case "unable_to_link_account":
      return "We couldn't link your Google account to the existing user. Sign in with your original method (email and password) and try again.";
    case "account_already_linked_to_different_user":
      return "This Google account is already linked to a different user. Use another Google account or sign in with email and password.";
    case "email_doesn't_match":
      return "The Google account email does not match your existing account email.";
    case "signup_disabled":
      return "Sign-up with Google is not available. Create an account with email and password instead.";
    case "unable_to_create_user":
      return "We couldn't create your account with Google. Please try again or use email and password.";
    case "unable_to_get_user_info":
    case "email_not_found":
      return "Google did not return the required account details. Check that email access is allowed for this app, then try again.";
    case "access_denied":
      return "Google sign-in was cancelled. You can try again or use email and password.";
    case "invalid_code":
    case "state_mismatch":
    case "no_code":
      return "Google sign-in expired or was interrupted. Please try again.";
    default:
      return "Google sign-in failed. Please try again or use email and password.";
  }
}
