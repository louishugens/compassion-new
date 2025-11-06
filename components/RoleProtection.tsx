'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Role } from '@/convex/auth';

interface RoleProtectionProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

/**
 * Component that protects routes based on user roles
 * Only renders children if user has one of the allowed roles
 */
export function RoleProtection({ children, allowedRoles, fallback }: RoleProtectionProps) {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments);

  useEffect(() => {
    if (currentUser === undefined) {
      // Still loading
      return;
    }

    if (!currentUser) {
      // Not authenticated, redirect to sign-in
      router.push('/sign-in');
      return;
    }

    if (!allowedRoles.includes(currentUser.role)) {
      // User doesn't have required role
      // Don't redirect, just show fallback or nothing
      return;
    }
  }, [currentUser, allowedRoles, router]);

  // Loading state
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  // Check if user has required role
  if (!allowedRoles.includes(currentUser.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous n&apos;avez pas la permission d&apos;accéder à cette page. Rôle requis : {allowedRoles.join(' ou ')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required role - render children
  return <>{children}</>;
}

