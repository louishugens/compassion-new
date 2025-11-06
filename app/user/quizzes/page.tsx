"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileQuestion, Plus } from "lucide-react"

export default function QuizzesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-muted-foreground mt-2">
            Gérer et consulter tous les quiz
          </p>
        </div>
        <Button asChild>
          <Link href="/user/quizzes/create">
            <Plus className="mr-2 h-4 w-4" />
            Créer un quiz
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des quiz</CardTitle>
          <CardDescription>
            Tous les quiz disponibles dans la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileQuestion className="h-12 w-12 mb-4 opacity-50" />
            <p>Aucun quiz disponible</p>
            <p className="text-sm mt-2">
              Créez votre premier quiz pour commencer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

