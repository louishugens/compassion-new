'use client';

import { Authenticated, Unauthenticated, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="p-8 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Plateforme Compassion Haïti</h1>
          <p className="text-muted-foreground">Centres de Développement d'Enfants et de Jeunes</p>
        </div>
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
    </div>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p className="text-muted-foreground text-center">Connectez-vous pour accéder à la plateforme Compassion Haïti</p>
      <a href="/sign-in">
        <Button variant="outline" className="w-full">Se connecter</Button>
      </a>
      <a href="/sign-up">
        <Button className="w-full">S'inscrire</Button>
      </a>
    </div>
  );
}

function Content() {
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments);
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined || currentUser === undefined) {
    return <div className="mx-auto">Chargement...</div>;
  }

  const displayName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email
    : viewer ?? 'Anonyme';

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <p>Bienvenue {displayName} !</p>
      {currentUser && (
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm">
            <strong>Rôle :</strong> {currentUser.role.replace(/_/g, ' ')}
          </p>
          <p className="text-sm">
            <strong>Email :</strong> {currentUser.email}
          </p>
        </div>
      )}
      <p className="text-red-500">
        Cliquez sur le bouton ci-dessous et ouvrez cette page dans une autre fenêtre - ces données sont stockées dans la base de données cloud Convex !
      </p>
      <p>
        <Button
          variant="ghost"
          className="bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Ajouter un nombre aléatoire
        </Button>
      </p>
      <Suspense fallback={<div>Chargement...</div>}>
      <p>Nombres : {numbers?.length === 0 ? 'Cliquez sur le bouton !' : (numbers?.join(', ') ?? '...')}</p>
      </Suspense>

    </div>
  );
}

function ResourceCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 bg-muted p-4 rounded-md h-28 overflow-auto border border-border">
      <a href={href} className="text-sm font-medium text-primary hover:underline">
        {title}
      </a>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
