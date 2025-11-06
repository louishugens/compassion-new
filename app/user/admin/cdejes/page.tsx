"use client"

import React from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

export default function CDEJesPage() {
  return (
    <RoleProtection allowedRoles={["national_admin", "cluster_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gérer les CDEJ</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les Centres de Développement d'Enfants et de Jeunes
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Créer un CDEJ
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des CDEJ</CardTitle>
            <CardDescription>
              Tous les centres dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun CDEJ configuré</p>
              <p className="text-sm mt-2">
                Créez votre premier centre pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtection>
  )
}

