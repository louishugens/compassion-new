"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileQuestion, Plus, Clock, Eye, EyeOff, BookOpen, Award, Calendar } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"

export default function QuizzesPage() {
  const quizzes = useQuery(api.quizzes.getQuizzes, {})

  const getValidityStatus = (quiz: NonNullable<typeof quizzes>[number]) => {
    const now = Date.now()
    if (quiz.validFrom !== undefined && now < quiz.validFrom) {
      return { status: "upcoming" as const, message: `Disponible le ${format(quiz.validFrom, "dd/MM/yyyy à HH:mm", { locale: fr })}` }
    }
    if (quiz.validUntil !== undefined && now > quiz.validUntil) {
      return { status: "expired" as const, message: `Expiré le ${format(quiz.validUntil, "dd/MM/yyyy à HH:mm", { locale: fr })}` }
    }
    if (quiz.validFrom !== undefined || quiz.validUntil !== undefined) {
      return { status: "active" as const, message: quiz.validUntil ? `Expire le ${format(quiz.validUntil, "dd/MM/yyyy à HH:mm", { locale: fr })}` : undefined }
    }
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-muted-foreground mt-2">
            Gérer et consulter tous les quiz
          </p>
        </div>
        <Button asChild className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
          <Link href="/user/quizzes/create">
            <Plus className="mr-2 h-4 w-4" />
            Créer un quiz
          </Link>
        </Button>
      </div>

      {quizzes === undefined ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des quiz...</p>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {quiz.title}
                  </CardTitle>
                  {quiz.isPublished ? (
                    <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                      <Eye className="h-3 w-3" />
                      Publié
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                      <EyeOff className="h-3 w-3" />
                      Brouillon
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileQuestion className="h-3 w-3" />
                    <span>{quiz.questionCount} question{quiz.questionCount > 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-3 w-3" />
                    <span>Score requis: {quiz.passingScore}%</span>
                  </div>

                  {quiz.lessonId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>Lié à une leçon</span>
                    </div>
                  )}

                  {(() => {
                    const validity = getValidityStatus(quiz)
                    if (validity) {
                      return (
                        <div className={`flex items-center gap-2 text-sm ${validity.status === "expired" ? "text-destructive" : validity.status === "upcoming" ? "text-yellow-600" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{validity.message}</span>
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(quiz.createdAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 rounded-full">
                  <Link href={`/user/quizzes/${quiz._id}/edit`}>
                    Éditer
                  </Link>
                </Button>
                {(() => {
                  const validity = getValidityStatus(quiz)
                  const isAvailable = !validity || validity.status === "active"
                  return (
                    <Button 
                      asChild 
                      className="flex-1 bg-blue-800 hover:bg-blue-700 text-white rounded-full"
                      disabled={!isAvailable}
                    >
                      <Link href={`/user/quizzes/${quiz._id}`}>
                        {validity?.status === "expired" ? "Expiré" : validity?.status === "upcoming" ? "Bientôt disponible" : "Commencer"}
                      </Link>
                    </Button>
                  )
                })()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

