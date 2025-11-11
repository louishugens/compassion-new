"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileQuestion, Trophy, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Id } from "@/convex/_generated/dataModel"

export default function QuizResultsPage() {
  const myAttempts = useQuery(api.quizzes.getMyAttempts, {})
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)

  // Separate test attempts (where user is the quiz creator) from real attempts
  // Only beneficiaries can have "real" attempts - non-beneficiaries only have test attempts
  const { realAttempts, testAttempts } = React.useMemo(() => {
    if (!myAttempts || !userInfo) return { realAttempts: [], testAttempts: [] }
    const isBeneficiary = userInfo.role === "beneficiary"
    
    if (isBeneficiary) {
      // Beneficiaries: real attempts are those where they're NOT the creator
      const real = myAttempts.filter(attempt => attempt.quizCreatedBy !== userInfo.userId)
      const tests = myAttempts.filter(attempt => attempt.quizCreatedBy === userInfo.userId)
      return { realAttempts: real, testAttempts: tests }
    } else {
      // Non-beneficiaries: all their attempts are test attempts
      return { realAttempts: [], testAttempts: myAttempts }
    }
  }, [myAttempts, userInfo])

  if (myAttempts === undefined || userInfo === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Chargement des résultats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Résultats des quiz</h1>
          <p className="text-muted-foreground mt-2">
            Consultez les résultats des quiz que vous avez passés
          </p>
        </div>
      </div>

      {/* Test Attempts Section (for quiz creators) */}
      {testAttempts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Tests de quiz</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Résultats de vos tests de quiz que vous avez créés
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testAttempts.map((attempt) => (
              <Card key={attempt._id} className="flex flex-col hover:shadow-lg transition-shadow border-dashed">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg flex-1">
                      {attempt.quizTitle}
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                      Test
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-lg font-bold">
                      {attempt.score} / {attempt.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pourcentage</span>
                    <span className={`text-lg font-semibold ${attempt.passed ? "text-green-600" : "text-red-600"}`}>
                      {attempt.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(attempt.completedAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(attempt.completedAt, "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link href={`/user/quizzes/${attempt.quizId}/results/${attempt._id}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Real Attempts Section - Only show if there are real attempts */}
      {realAttempts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Résultats des quiz passés</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Résultats des quiz que vous avez réellement passés
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realAttempts.map((attempt) => (
            <Card key={attempt._id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg flex-1">
                    {attempt.quizTitle}
                  </CardTitle>
                  {attempt.passed ? (
                    <Badge variant="default" className="flex items-center gap-1 shrink-0 bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Réussi
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                      <XCircle className="h-3 w-3" />
                      Échoué
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-lg font-bold">
                    {attempt.score} / {attempt.maxScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pourcentage</span>
                  <span className={`text-lg font-semibold ${attempt.passed ? "text-green-600" : "text-red-600"}`}>
                    {attempt.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(attempt.completedAt, {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(attempt.completedAt, "dd/MM/yyyy à HH:mm", { locale: fr })}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                  <Link href={`/user/quizzes/${attempt.quizId}/results/${attempt._id}`}>
                    Voir les détails
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          </div>
        </div>
      )}

      {/* Empty state - only show if no attempts at all */}
      {testAttempts.length === 0 && realAttempts.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
            <CardDescription>
              Vos résultats de quiz apparaîtront ici
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Trophy className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun résultat disponible</p>
              <p className="text-sm mt-2">
                Passez un quiz pour voir vos résultats ici
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

