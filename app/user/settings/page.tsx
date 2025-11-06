"use client"

import React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  const initials = `${currentUser?.firstName?.charAt(0)}${currentUser?.lastName?.charAt(0)}`.toUpperCase()
    if (!initials) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Chargement...</div>
        </div>
      )
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérer vos informations personnelles et préférences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentUser.profilePictureUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
                <AvatarFallback className="bg-blue-800 text-white text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  Changer la photo
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" defaultValue={currentUser.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" defaultValue={currentUser.lastName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={currentUser.email} disabled />
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input 
                value={currentUser.role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} 
                disabled 
              />
            </div>

            <div className="flex justify-end">
              <Button>Sauvegarder les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

