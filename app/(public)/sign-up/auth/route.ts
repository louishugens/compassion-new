import { redirect } from 'next/navigation';
import { getSignUpUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  // Get WorkOS sign-up URL
  // The sign-up page validates the access code and stores it in sessionStorage
  // The RegistrationHandler component will read from sessionStorage after WorkOS auth
  const authorizationUrl = await getSignUpUrl();
  return redirect(authorizationUrl);
}
