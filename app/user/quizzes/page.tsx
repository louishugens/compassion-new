"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileQuestion, Plus, Clock, Eye, EyeOff, BookOpen, Award, Calendar, Timer, AlertCircle } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      setTimeRemaining(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  const formatTimeRemaining = (ms: number) => {
    if (ms === 0) return "Expiré"
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m ${seconds}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
      <Timer className="h-3 w-3" />
      <span>{formatTimeRemaining(timeRemaining)}</span>
    </div>
  )
}

export default function QuizzesPage() {
  const quizzes = useQuery(api.quizzes.getQuizzes, {})
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)
  const myAttempts = useQuery(api.quizzes.getMyAttempts, {})
  const isBeneficiary = userInfo?.role === "beneficiary"
  const needsBirthDate = isBeneficiary && !currentUser?.birthDate

  // Calculate age group from birth date
  const calculateAgeGroup = (birthDate: number): string => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 0) {
      return '0-5'
    } else if (age <= 5) {
      return '0-5'
    } else if (age <= 10) {
      return '6-10'
    } else if (age <= 15) {
      return '11-15'
    } else if (age <= 18) {
      return '16-18'
    } else {
      return '19+'
    }
  }

  // Filter out quizzes that have been taken (only for beneficiaries, excluding test attempts)
  // Also filter by age group for beneficiaries
  const availableQuizzes = React.useMemo(() => {
    if (!quizzes || !myAttempts || !userInfo) return quizzes || []
    
    let filtered = quizzes

    // Filter by age group for beneficiaries
    if (isBeneficiary && currentUser?.birthDate) {
      const userAgeGroup = calculateAgeGroup(currentUser.birthDate)
      filtered = filtered.filter(quiz => quiz.ageGroups.includes(userAgeGroup))
    }

    // Only beneficiaries can "take" quizzes - their attempts hide quizzes from the list
    // Non-beneficiaries can only test quizzes they created, which don't hide them
    if (isBeneficiary) {
      // Filter out test attempts (where user is the quiz creator)
      const realAttempts = myAttempts.filter(attempt => attempt.quizCreatedBy !== userInfo.userId)
      const takenQuizIds = new Set(realAttempts.map(attempt => attempt.quizId))
      filtered = filtered.filter(quiz => !takenQuizIds.has(quiz._id))
    }
    // Non-beneficiaries see all quizzes (they can test any quiz)
    return filtered
  }, [quizzes, myAttempts, userInfo, isBeneficiary, currentUser?.birthDate])

  const getValidityStatus = (quiz: NonNullable<typeof availableQuizzes>[number]) => {
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
            {isBeneficiary ? "Consulter et passer tous les quiz disponibles" : "Gérer et consulter tous les quiz"}
          </p>
        </div>
        {!isBeneficiary && (
          <Button asChild className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
            <Link href="/user/quizzes/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer un quiz
            </Link>
          </Button>
        )}
      </div>

      {needsBirthDate && (
        <Alert className="border-blue-800 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-800" />
          <AlertTitle className="text-blue-800">Date de naissance requise</AlertTitle>
          <AlertDescription className="text-blue-700">
            Vous devez définir votre date de naissance pour voir les quiz disponibles. 
            <Button asChild variant="link" className="p-0 h-auto ml-1 text-blue-800 underline">
              <Link href="/user/settings">Ajoutez votre date de naissance dans les paramètres</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {quizzes === undefined || myAttempts === undefined ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des quiz...</p>
          </div>
        </div>
      ) : (needsBirthDate ? [] : availableQuizzes).length === 0 ? (
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
              <p>{needsBirthDate ? "Aucun quiz disponible" : isBeneficiary ? "Aucun quiz disponible pour votre groupe d'âge" : "Aucun quiz disponible"}</p>
              <p className="text-sm mt-2">
                {needsBirthDate ? "Ajoutez votre date de naissance pour voir les quiz" : isBeneficiary ? "Les quiz seront affichés ici lorsqu'ils correspondent à votre groupe d'âge" : "Créez votre premier quiz pour commencer"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(needsBirthDate ? [] : availableQuizzes).map((quiz) => (
            <Card key={quiz._id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">
                  {quiz.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              {!isBeneficiary && (
                <>
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
                            <div className="space-y-2">
                              <div className={`flex items-center gap-2 text-sm ${validity.status === "expired" ? "text-destructive" : validity.status === "upcoming" ? "text-yellow-600" : "text-muted-foreground"}`}>
                                <Calendar className="h-3 w-3" />
                                <span>{validity.message}</span>
                              </div>
                              {quiz.validUntil && validity.status === "active" && Date.now() < quiz.validUntil && (
                                <CountdownTimer endTime={quiz.validUntil} />
                              )}
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
                      const isCreator = quiz.createdBy === userInfo?.userId
                      return (
                        <Button 
                          asChild 
                          className="flex-1 bg-blue-800 hover:bg-blue-700 text-white rounded-full"
                          disabled={!isAvailable || !isCreator}
                        >
                          <Link href={`/user/quizzes/${quiz._id}`}>
                            {validity?.status === "expired" ? "Expiré" : validity?.status === "upcoming" ? "Bientôt disponible" : isCreator ? "Tester" : "Non disponible"}
                          </Link>
                        </Button>
                      )
                    })()}
                  </CardFooter>
                </>
              )}
              {isBeneficiary && (
                <>
                  <CardContent className="flex-1">
                    {(() => {
                      const validity = getValidityStatus(quiz)
                      const now = Date.now()
                      const hasValidUntil = quiz.validUntil && now < quiz.validUntil
                      
                      if (validity && hasValidUntil && validity.status === "active") {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{validity.message}</span>
                            </div>
                            <CountdownTimer endTime={quiz.validUntil!} />
                          </div>
                        )
                      }
                      return null
                    })()}
                  </CardContent>
                  <CardFooter>
                    {(() => {
                      const validity = getValidityStatus(quiz)
                      const isAvailable = !validity || validity.status === "active"
                      return (
                        <Button 
                          asChild 
                          className="w-full bg-blue-800 hover:bg-blue-700 text-white rounded-full"
                          disabled={!isAvailable}
                        >
                          <Link href={`/user/quizzes/${quiz._id}`}>
                            {validity?.status === "expired" ? "Expiré" : validity?.status === "upcoming" ? "Bientôt disponible" : "Commencer"}
                          </Link>
                        </Button>
                      )
                    })()}
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

