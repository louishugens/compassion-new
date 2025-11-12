"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, MessageCircle, Users, Clock, Globe, Building2, Home, Edit, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { LessonChatbotModal } from "@/components/lesson-chatbot-modal"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default function LessonPage() {
  const params = useParams()
  const lessonId = params.id as Id<"lessons">
  const [chatbotOpen, setChatbotOpen] = useState(false)
  
  const lesson = useQuery(api.lessons.getLesson, { lessonId })
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)
  const isBeneficiary = userInfo?.role === "beneficiary"

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "national":
        return <Globe className="h-4 w-4" />
      case "cluster":
        return <Building2 className="h-4 w-4" />
      case "cdej":
        return <Home className="h-4 w-4" />
      default:
        return null
    }
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "national":
        return "National"
      case "cluster":
        return "Cluster"
      case "cdej":
        return "CDEJ"
      default:
        return scope
    }
  }

  if (lesson === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (lesson === null) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/lessons">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leçon introuvable</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Cette leçon n&apos;existe pas ou a été supprimée.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Beneficiary view - simple with chatbot
  if (isBeneficiary) {
    return (
      <div className="space-y-8 pb-8">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/user/lessons" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux leçons
          </Link>
        </Button>

        {/* Image at the top */}
        {lesson.imageUrl && (
          <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg">
            <Image
              src={lesson.imageUrl}
              alt={lesson.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Title and Description */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-xl text-muted-foreground">{lesson.description}</p>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none pt-8">
            <div 
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>

          {/* Video below content if available */}
          {lesson.videoUrl && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black mt-8">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full object-contain"
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <Button
          onClick={() => setChatbotOpen(true)}
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 bg-blue-800 hover:bg-blue-700 text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Ouvrir l&apos;aide à la compréhension</span>
        </Button>

        {/* Chatbot Modal */}
        <LessonChatbotModal
          lessonId={lessonId}
          open={chatbotOpen}
          onOpenChange={setChatbotOpen}
        />
      </div>
    )
  }

  // Non-beneficiary view - detailed with metadata
  return (
    <div className="space-y-8 pb-8">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/user/lessons" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux leçons
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-xl text-muted-foreground">{lesson.description}</p>
          )}
        </div>

        {/* Edit Button */}
        <Button asChild className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
          <Link href={`/user/lessons/${lessonId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {lesson.isPublished ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Statut:</span>
              <span className="text-sm text-muted-foreground">
                {lesson.isPublished ? "Publiée" : "Brouillon"}
              </span>
            </div>

            {/* Scope */}
            <div className="flex items-center gap-2">
              {getScopeIcon(lesson.scope)}
              <span className="text-sm font-medium">Portée:</span>
              <span className="text-sm text-muted-foreground">{getScopeLabel(lesson.scope)}</span>
            </div>

            {/* Age Groups */}
            {lesson.ageGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Groupes d&apos;âge:</span>
                <div className="flex flex-wrap gap-1">
                  {lesson.ageGroups.map((age: string) => (
                    <Badge key={age} variant="outline" className="text-xs">
                      {age}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Créée:</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(lesson.createdAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            {/* Updated Date */}
            {lesson.updatedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Modifiée:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(lesson.updatedAt, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image */}
      {lesson.imageUrl && (
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg">
          <Image
            src={lesson.imageUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="prose prose-lg max-w-none pt-8">
          <div 
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>

        {/* Video below content if available */}
        {lesson.videoUrl && (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black mt-8">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full object-contain"
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 bg-blue-800 hover:bg-blue-700 text-white"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Ouvrir l&apos;aide à la compréhension</span>
      </Button>

      {/* Chatbot Modal */}
      <LessonChatbotModal
        lessonId={lessonId}
        open={chatbotOpen}
        onOpenChange={setChatbotOpen}
      />
    </div>
  )
}

