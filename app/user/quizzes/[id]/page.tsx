"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

type QuizQuestionForAttempt = {
  _id: Id<"questions">
  questionText: string
  answers: { text: string }[]
  points: number
  order: number
}

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as Id<"quizzes">

  const quiz = useQuery(api.quizzes.getQuiz, { quizId })
  const questions = useQuery(api.quizzes.getQuestionsForAttempt, { quizId })
  const submitQuizAttempt = useMutation(api.quizzes.submitQuizAttempt)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setStartedAt(Date.now())
  }, [])

  if (!quiz || !questions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Chargement du quiz...</p>
        </div>
      </div>
    )
  }

  // Check validity period
  const now = Date.now()
  const isNotYetAvailable = quiz.validFrom !== undefined && now < quiz.validFrom
  const isExpired = quiz.validUntil !== undefined && now > quiz.validUntil

  if (isNotYetAvailable || isExpired) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/quizzes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                  {isNotYetAvailable ? "Quiz non disponible" : "Quiz expiré"}
                </h3>
                <p className="text-muted-foreground">
                  {isNotYetAvailable
                    ? `Ce quiz sera disponible le ${format(quiz.validFrom!, "dd/MM/yyyy à HH:mm", { locale: fr })}`
                    : `Ce quiz a expiré le ${format(quiz.validUntil!, "dd/MM/yyyy à HH:mm", { locale: fr })}`}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/user/quizzes">Retour aux quiz</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typedQuestions = questions as QuizQuestionForAttempt[]
  const currentQuestion = typedQuestions[currentQuestionIndex]
  const totalQuestions = typedQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestion._id]: answerIndex,
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = typedQuestions.filter((q) => answers[q._id] === undefined)
    if (unansweredQuestions.length > 0) {
      toast.warning("Attention", {
        description: `Vous avez ${unansweredQuestions.length} question(s) sans réponse. Êtes-vous sûr de vouloir soumettre ?`,
      })
    }

    setIsSubmitting(true)

    try {
      const answersArray = typedQuestions.map((q) => ({
        questionId: q._id,
        selectedAnswerIndex: answers[q._id] ?? 0,
      }))

      const result = await submitQuizAttempt({
        quizId,
        answers: answersArray,
        startedAt,
      })

      toast.success("Quiz soumis", {
        description: result.passed
          ? `Félicitations! Vous avez réussi avec ${result.percentage.toFixed(1)}%`
          : `Vous avez obtenu ${result.percentage.toFixed(1)}%. Score requis: ${quiz.passingScore}%`,
      })

      router.push(`/user/quizzes/${quizId}/results/${result.attemptId}`)
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la soumission du quiz",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
          <p className="text-muted-foreground mt-2">{quiz.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {currentQuestionIndex + 1} sur {totalQuestions}
          </span>
          <span>Score requis: {quiz.passingScore}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Question {currentQuestionIndex + 1}
          </CardTitle>
          <CardDescription className="text-base whitespace-pre-wrap">
            {currentQuestion.questionText}
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion._id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            <div className="space-y-4">
              {currentQuestion.answers.map((answer: { text: string }, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                  <Label htmlFor={`answer-${index}`} className="flex-1 cursor-pointer">
                    {answer.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Soumission...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Soumettre
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-full"
              >
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des réponses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {typedQuestions.map((q, index) => (
              <Button
                key={q._id}
                variant={answers[q._id] !== undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`${
                  index === currentQuestionIndex ? "ring-2 ring-blue-800" : ""
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

