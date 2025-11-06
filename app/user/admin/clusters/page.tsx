"use client"

import React from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"

export default function ClustersPage() {
  return (
    <RoleProtection allowedRoles={["national_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gérer les clusters</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les clusters de centres
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Créer un cluster
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des clusters</CardTitle>
            <CardDescription>
              Tous les clusters de centres dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun cluster configuré</p>
              <p className="text-sm mt-2">
                Créez votre premier cluster pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtection>
  )
}

