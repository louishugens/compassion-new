"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus } from "lucide-react"

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leçons</h1>
          <p className="text-muted-foreground mt-2">
            Gérer et consulter toutes les leçons
          </p>
        </div>
        <Button asChild>
          <Link href="/user/lessons/create">
            <Plus className="mr-2 h-4 w-4" />
            Créer une leçon
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des leçons</CardTitle>
          <CardDescription>
            Toutes les leçons disponibles dans la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-4 opacity-50" />
            <p>Aucune leçon disponible</p>
            <p className="text-sm mt-2">
              Créez votre première leçon pour commencer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

