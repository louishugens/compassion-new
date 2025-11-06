"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateQuizPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer un quiz</h1>
          <p className="text-muted-foreground mt-2">
            Créer un nouveau quiz pour les bénéficiaires
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du quiz</CardTitle>
          <CardDescription>
            Remplissez les détails du nouveau quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du quiz</Label>
            <Input id="title" placeholder="Entrez le titre du quiz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Décrivez brièvement le quiz" />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/user/quizzes">Annuler</Link>
            </Button>
            <Button>Créer le quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

