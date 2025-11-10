"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Doc, Id } from "@/convex/_generated/dataModel"

interface Answer {
  text: string
  isCorrect: boolean
}

interface Question {
  _id?: Id<"questions">
  questionText: string
  answers: Answer[]
  points: number
}

type LessonOption = Pick<Doc<"lessons">, "_id" | "title">
type ClusterOption = { _id: Id<"clusters">; name: string; code: string }
type CdejOption = { _id: Id<"cdejs">; name: string; code: string }

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as Id<"quizzes">

  const quiz = useQuery(api.quizzes.getQuiz, { quizId })
  const questions = useQuery(api.quizzes.getQuestions, { quizId })
  const updateQuiz = useMutation(api.quizzes.updateQuiz)
  const addQuestion = useMutation(api.quizzes.addQuestion)
  const updateQuestion = useMutation(api.quizzes.updateQuestion)
  const deleteQuestion = useMutation(api.quizzes.deleteQuestion)
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)
  const lessons = useQuery(api.lessons.getLessons, {})
  const clusters = useQuery(api.lessons.getClusters)
  const [selectedCluster, setSelectedCluster] = useState<Id<"clusters"> | null>(null)
  const cdejs = useQuery(
    api.lessons.getCdejsByCluster,
    selectedCluster ? { clusterId: selectedCluster } : "skip"
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [passingScore, setPassingScore] = useState("70")
  const [scope, setScope] = useState<"national" | "cluster" | "cdej">("national")
  const [clusterId, setClusterId] = useState<Id<"clusters"> | undefined>()
  const [cdejId, setCdejId] = useState<Id<"cdejs"> | undefined>()
  const [lessonId, setLessonId] = useState<Id<"lessons"> | undefined>()
  const [validFrom, setValidFrom] = useState<string>("")
  const [validUntil, setValidUntil] = useState<string>("")
  const [isPublished, setIsPublished] = useState(false)
  const [questionsList, setQuestionsList] = useState<Question[]>([])

  // Load quiz data when available
  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title)
      setDescription(quiz.description)
      setPassingScore(quiz.passingScore.toString())
      setScope(quiz.scope)
      setClusterId(quiz.clusterId)
      setCdejId(quiz.cdejId)
      setLessonId(quiz.lessonId)
      setIsPublished(quiz.isPublished)
      
      // Convert timestamps to datetime-local format
      if (quiz.validFrom) {
        const date = new Date(quiz.validFrom)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        setValidFrom(`${year}-${month}-${day}T${hours}:${minutes}`)
      }
      
      if (quiz.validUntil) {
        const date = new Date(quiz.validUntil)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        setValidUntil(`${year}-${month}-${day}T${hours}:${minutes}`)
      }

      // Set selected cluster for CDEJ scope
      if (quiz.scope === "cdej" && quiz.clusterId) {
        setSelectedCluster(quiz.clusterId)
      } else if (quiz.scope === "cluster" && quiz.clusterId) {
        setSelectedCluster(quiz.clusterId)
      }
    }
  }, [quiz])

  // Load questions when available
  useEffect(() => {
    if (questions) {
      setQuestionsList(
        questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          answers: q.answers,
          points: q.points,
        }))
      )
    }
  }, [questions])

  const addQuestionToList = () => {
    setQuestionsList([
      ...questionsList,
      {
        questionText: "",
        answers: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        points: 10,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    const question = questionsList[index]
    if (question._id) {
      // Delete existing question from database
      deleteQuestion({ questionId: question._id }).catch((error) => {
        toast.error("Erreur", {
          description: error.message || "Erreur lors de la suppression de la question",
        })
      })
    }
    setQuestionsList(questionsList.filter((_, i) => i !== index))
  }

  const updateQuestionInList = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questionsList]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestionsList(newQuestions)
  }

  const addAnswer = (questionIndex: number) => {
    const newQuestions = [...questionsList]
    newQuestions[questionIndex].answers.push({ text: "", isCorrect: false })
    setQuestionsList(newQuestions)
  }

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const newQuestions = [...questionsList]
    if (newQuestions[questionIndex].answers.length > 2) {
      newQuestions[questionIndex].answers.splice(answerIndex, 1)
      setQuestionsList(newQuestions)
    }
  }

  const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof Answer, value: any) => {
    const newQuestions = [...questionsList]
    newQuestions[questionIndex].answers[answerIndex] = {
      ...newQuestions[questionIndex].answers[answerIndex],
      [field]: value,
    }
    setQuestionsList(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description) {
      toast.error("Erreur", {
        description: "Veuillez remplir tous les champs requis",
      })
      return
    }

    // Validate questions
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i]
      if (!q.questionText) {
        toast.error("Erreur", {
          description: `Question ${i + 1}: Le texte de la question est requis`,
        })
        return
      }
      if (q.answers.length < 2) {
        toast.error("Erreur", {
          description: `Question ${i + 1}: Au moins 2 réponses sont requises`,
        })
        return
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        toast.error("Erreur", {
          description: `Question ${i + 1}: Au moins une réponse correcte est requise`,
        })
        return
      }
      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text) {
          toast.error("Erreur", {
            description: `Question ${i + 1}, Réponse ${j + 1}: Le texte est requis`,
          })
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      // Convert date strings to timestamps
      const validFromTimestamp = validFrom ? new Date(validFrom).getTime() : undefined
      const validUntilTimestamp = validUntil ? new Date(validUntil).getTime() : undefined

      // Validate validity period
      if (validFromTimestamp !== undefined && validUntilTimestamp !== undefined) {
        if (validFromTimestamp >= validUntilTimestamp) {
          toast.error("Erreur", {
            description: "La date de début doit être antérieure à la date de fin",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Update quiz
      await updateQuiz({
        quizId,
        title,
        description,
        lessonId,
        passingScore: parseInt(passingScore),
        scope,
        clusterId,
        cdejId,
        validFrom: validFromTimestamp,
        validUntil: validUntilTimestamp,
        isPublished,
      })

      // Update or add questions
      for (let i = 0; i < questionsList.length; i++) {
        const question = questionsList[i]
        if (question._id) {
          // Update existing question
          await updateQuestion({
            questionId: question._id,
            questionText: question.questionText,
            answers: question.answers,
            points: question.points,
          })
        } else {
          // Add new question
          await addQuestion({
            quizId,
            questionText: question.questionText,
            answers: question.answers,
            points: question.points,
          })
        }
      }

      toast.success("Succès", {
        description: "Le quiz a été mis à jour avec succès",
      })

      router.push("/user/quizzes")
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la mise à jour du quiz",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Chargement du quiz...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Modifier le quiz</h1>
          <p className="text-muted-foreground mt-2">
            Modifier les détails du quiz
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du quiz</CardTitle>
            <CardDescription>
              Modifiez les détails du quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du quiz *</Label>
              <Input
                id="title"
                placeholder="Entrez le titre du quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez brièvement le quiz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Score de passage (%) *</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                placeholder="70"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateTimePicker
                id="validFrom"
                label="Date de début (optionnel)"
                value={validFrom}
                onChange={setValidFrom}
                description="Date à partir de laquelle le quiz devient disponible"
                disablePastDates={true}
              />
              <DateTimePicker
                id="validUntil"
                label="Date de fin (optionnel)"
                value={validUntil}
                onChange={setValidUntil}
                description="Date après laquelle le quiz n'est plus disponible"
                disablePastDates={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson">Leçon associée (optionnel)</Label>
              <Select value={lessonId} onValueChange={(value) => setLessonId(value as Id<"lessons">)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une leçon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune leçon</SelectItem>
                  {lessons?.map((lesson: LessonOption) => (
                    <SelectItem key={lesson._id} value={lesson._id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Portée *</Label>
              <Select value={scope} onValueChange={(value: any) => setScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userInfo?.role === "national_admin" && (
                    <SelectItem value="national">National</SelectItem>
                  )}
                  {(userInfo?.role === "national_admin" || userInfo?.role === "cluster_admin") && (
                    <SelectItem value="cluster">Cluster</SelectItem>
                  )}
                  <SelectItem value="cdej">CDEJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === "cluster" && (
              <div className="space-y-2">
                <Label htmlFor="cluster">Cluster *</Label>
                <Select
                  value={clusterId}
                  onValueChange={(value) => {
                    setClusterId(value as Id<"clusters">)
                    setSelectedCluster(value as Id<"clusters">)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters?.map((cluster: ClusterOption) => (
                      <SelectItem key={cluster._id} value={cluster._id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === "cdej" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cluster">Cluster *</Label>
                  <Select
                    value={selectedCluster || undefined}
                    onValueChange={(value) => {
                      setSelectedCluster(value as Id<"clusters">)
                      setClusterId(value as Id<"clusters">)
                      setCdejId(undefined)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters?.map((cluster: ClusterOption) => (
                        <SelectItem key={cluster._id} value={cluster._id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCluster && (
                  <div className="space-y-2">
                    <Label htmlFor="cdej">CDEJ *</Label>
                    <Select value={cdejId} onValueChange={(value) => setCdejId(value as Id<"cdejs">)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un CDEJ" />
                      </SelectTrigger>
                      <SelectContent>
                        {cdejs?.map((cdej: CdejOption) => (
                          <SelectItem key={cdej._id} value={cdej._id}>
                            {cdej.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="published">Publier immédiatement</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              Modifiez les questions du quiz avec leurs réponses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {questionsList.map((question, qIndex) => (
              <div key={qIndex} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Question {qIndex + 1}</h3>
                  {questionsList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Texte de la question *</Label>
                  <Textarea
                    placeholder="Entrez votre question"
                    value={question.questionText}
                    onChange={(e) => updateQuestionInList(qIndex, "questionText", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Points *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) => updateQuestionInList(qIndex, "points", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Réponses</Label>
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={`Réponse ${aIndex + 1}`}
                          value={answer.text}
                          onChange={(e) => updateAnswer(qIndex, aIndex, "text", e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={answer.isCorrect}
                            onCheckedChange={(checked) =>
                              updateAnswer(qIndex, aIndex, "isCorrect", checked)
                            }
                          />
                          <Label>Réponse correcte</Label>
                        </div>
                      </div>
                      {question.answers.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnswer(qIndex, aIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAnswer(qIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une réponse
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addQuestionToList} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/user/quizzes">Annuler</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-800 hover:bg-blue-700 text-white rounded-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour en cours...
              </>
            ) : (
              "Mettre à jour le quiz"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

