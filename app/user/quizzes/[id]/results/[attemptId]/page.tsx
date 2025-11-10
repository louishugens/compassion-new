"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock, Target, Loader2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"

export default function QuizResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as Id<"quizAttempts">

  const attemptDetails = useQuery(api.quizzes.getAttemptDetails, { attemptId })

  if (!attemptDetails) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Chargement des résultats...</p>
        </div>
      </div>
    )
  }

  const timeSpent = attemptDetails.completedAt - attemptDetails.startedAt
  const timeSpentMinutes = Math.floor(timeSpent / 1000 / 60)
  const timeSpentSeconds = Math.floor((timeSpent / 1000) % 60)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Résultats du Quiz</h1>
          <p className="text-muted-foreground mt-2">{attemptDetails.quizTitle}</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className={attemptDetails.passed ? "border-green-500" : "border-red-500"}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {attemptDetails.passed ? (
              <Trophy className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-3xl">
            {attemptDetails.passed ? "Félicitations!" : "Continuez vos efforts!"}
          </CardTitle>
          <CardDescription className="text-lg">
            {attemptDetails.passed
              ? "Vous avez réussi le quiz!"
              : "Vous n'avez pas atteint le score requis"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <p className="text-3xl font-bold">
                {attemptDetails.score} / {attemptDetails.maxScore}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {attemptDetails.percentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Réponses correctes</p>
              </div>
              <p className="text-3xl font-bold">
                {attemptDetails.answers.filter((a) => a.isCorrect).length} /{" "}
                {attemptDetails.answers.length}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Temps écoulé</p>
              </div>
              <p className="text-3xl font-bold">
                {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Détails des réponses</h2>
        {attemptDetails.answers.map((answer, index) => (
          <Card
            key={answer.questionId}
            className={answer.isCorrect ? "border-green-200" : "border-red-200"}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <CardDescription className="text-base whitespace-pre-wrap mt-2">
                    {answer.questionText}
                  </CardDescription>
                </div>
                <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                  {answer.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Correct
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Incorrect
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Votre réponse:
                </p>
                <div
                  className={`p-3 rounded-lg ${
                    answer.isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p>{answer.selectedAnswerText}</p>
                </div>
              </div>
              {!answer.isCorrect && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Réponse(s) correcte(s):
                  </p>
                  <div className="space-y-2">
                    {answer.correctAnswers.map((correctAnswer: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-green-50 border border-green-200"
                      >
                        <p>{correctAnswer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Points gagnés: {answer.pointsEarned}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/user/quizzes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux quiz
          </Link>
        </Button>
        <Button asChild className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
          <Link href={`/user/quizzes/${attemptDetails.quizId}`}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refaire le quiz
          </Link>
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Débuté:</span>
            <span>{format(attemptDetails.startedAt, "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terminé:</span>
            <span>
              {format(attemptDetails.completedAt, "dd/MM/yyyy à HH:mm", { locale: fr })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Il y a:</span>
            <span>
              {formatDistanceToNow(attemptDetails.completedAt, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

