"use client"

import React from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User2, Plus } from "lucide-react"

export default function UsersPage() {
  return (
    <RoleProtection allowedRoles={["national_admin", "cluster_admin", "cdej_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gérer les utilisateurs</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les utilisateurs du système
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Inviter un utilisateur
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              Tous les utilisateurs dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <User2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
              <p className="text-sm mt-2">
                Invitez des utilisateurs pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtection>
  )
}

