'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SignUpPage() {

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validateCode = useMutation(api.users.validateAccessCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    try {
      const result = await validateCode({ code: code.toUpperCase().trim(), email: email.toLowerCase().trim() });

      if (!result.valid) {
        setError(result.error || "Code d'accès invalide");
        setIsValidating(false);
        return;
      }

      // Store code and email in sessionStorage for use after WorkOS auth
      sessionStorage.setItem('signup_code', code.toUpperCase().trim());
      sessionStorage.setItem('signup_email', email.toLowerCase().trim());

      // Redirect to WorkOS sign-up
      window.location.href = '/sign-up/auth';
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      setIsValidating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl lg:text-2xl text-blue-800 text-center font-bold  mb-6 leading-tight text-balance">
              Créer un compte
            </h1>
            <p className=" text-center text-muted-foreground mb-8 leading-relaxed">
              Entrez votre code d'accès et votre email pour commencer l'inscription
            </p>

            <Card className="w-full max-w-md mx-auto">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-base font-medium">Code d'accès</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Entrez votre code d'accès"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                      disabled={isValidating}
                      className="font-mono tracking-wider h-11"
                      maxLength={8}
                    />
                    <p className="text-sm text-muted-foreground">Entrez le code d'accès à 8 caractères qui vous a été fourni</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isValidating}
                      className="h-11"
                    />
                    <p className="text-sm text-muted-foreground">Cet email doit correspondre à celui associé à votre code d'accès</p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full rounded-full bg-blue-800 text-primary-foreground font-medium hover:opacity-90 transition-opacity h-11" 
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validation...
                      </>
                    ) : (
                      "Continuer vers l'inscription"
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Vous avez déjà un compte ?{' '}
                    <a href="/sign-in" className="text-blue-800 hover:underline font-medium">
                      Se connecter
                    </a>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

