'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Authenticated, Unauthenticated,  } from 'convex/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOutIcon } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              width={40}
              height={40}
              src="/icon.png"
              alt="Compassion logo"
              className="w-10 h-10 rounded-lg"
            />
            <span className="font-semibold text-lg text-foreground hidden sm:inline">Compassion</span>
          </Link>
          <nav className="flex items-center gap-8">
            <Unauthenticated>
              <Link href="/sign-in" className="text-sm border border-blue-800 text-blue-800 px-4 py-2 rounded-full hover:bg-blue-800/10 transition-colors">
                Se connecter
              </Link>
              <Link href="/sign-up" className="text-sm bg-blue-800 px-4 py-2 rounded-full text-primary-foreground hover:bg-blue-800/90 transition-colors">
                S'inscrire
              </Link>
            </Unauthenticated>
            <Authenticated>
              <Button variant="outline" onClick={handleSignOut} className="text-sm border border-blue-800 text-blue-800 px-4 py-2 rounded-full hover:bg-blue-800/10 transition-colors">
                <LogOutIcon className="w-4 h-4" />
                Se déconnecter
              </Button>
            </Authenticated>
          </nav>
        </div>
      </header>
      <main>{children}</main>
            {/* Footer */}
      <footer className="border-t border-border bg-blue-300/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Organisation</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.compassion.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    À propos de Compassion
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.compassion.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Notre mission
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Se connecter</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.facebook.com/compassion.caribbean/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/compassion/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-2">
              <h3 className="font-semibold text-foreground mb-4">Compassion International</h3>
              <p className="text-sm text-muted-foreground">Libérer les enfants de la pauvreté au nom de Jésus.</p>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Compassion International - Carrefour-Leogane Cluster
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

// function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
//   const handleSignOut = async () => {
//     await onSignOut();
//   };

//   return (
//     <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <Image
//           width={40}
//           height={40}
//           src="/icon.png"
//           alt="Compassion Logo"
//         />
//         <div>
//           <h1 className="text-lg font-bold text-foreground">Compassion</h1>
//           <p className="text-xs text-muted-foreground">Haiti</p>
//         </div>
//       </div>
//       <nav className="hidden md:flex items-center gap-6">
//         <a href="#centers" className="text-sm font-medium text-muted-foreground hover:text-primary transition">
//           Centers
//         </a>
//         <a href="#impact" className="text-sm font-medium text-muted-foreground hover:text-primary transition">
//           Impact
//         </a>
//         <button className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition">
//           Connect
//         </button>
//       </nav>
//     </div>
//   </header>
//   );
// }

