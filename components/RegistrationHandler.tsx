'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';


/**
 * Component that handles user registration completion after WorkOS authentication
 * Should be rendered after user is authenticated to check if they need to complete registration
 */
export function RegistrationHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const completeRegistration = useMutation(api.users.completeRegistration);
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments);

  useEffect(() => {
    async function checkAndCompleteRegistration() {
      // Wait for auth to complete
      if (authLoading || !user) {
        return;
      }

      // Wait for user query to complete
      if (currentUser === undefined) {
        return;
      }

      // Already checked
      if (checked) {
        return;
      }

      setChecked(true);

      // If user exists, they're already registered
      if (currentUser) {
        return;
      }

      // User authenticated but not registered - check if we have signup data
      const code = sessionStorage.getItem('signup_code');
      const email = sessionStorage.getItem('signup_email');

      if (!code || !email) {
        // No signup data found - user might have signed in instead of signing up
        // Or they came from a different flow
        return;
      }

      // Complete registration
      setIsCompleting(true);
      setError(null);

      try {
        await completeRegistration({
          code,
          email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          profilePictureUrl: user.profilePictureUrl || undefined,
        });

        // Clear session storage
        sessionStorage.removeItem('signup_code');
        sessionStorage.removeItem('signup_email');

        // Reload to get updated user data
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de la finalisation de l'inscription");
        setIsCompleting(false);
        setChecked(false);
      }
    }

    checkAndCompleteRegistration();
  }, [authLoading, user, currentUser, checked, completeRegistration]);

  // Show loading state while completing registration
  if (isCompleting) {
    return (
      <>
        
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Configuration de votre compte...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show error if registration failed
  if (error) {
    return (
      <>
        
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/sign-up')} className="w-full">
                Réessayer de s'inscrire
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // User is registered or doesn't need registration - render children
  return (
    <>
      
      {children}
    </>
  );
}

