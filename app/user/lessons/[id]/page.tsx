"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, Globe, Building2, Home, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Id } from "@/convex/_generated/dataModel"
import "react-quill-new/dist/quill.snow.css"

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as Id<"lessons">
  
  const lesson = useQuery(api.lessons.getLesson, { lessonId })

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

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/lessons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
            {lesson.isPublished ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Publié
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Brouillon
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{lesson.description}</p>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {getScopeIcon(lesson.scope)}
              <div>
                <p className="text-sm font-medium">Portée</p>
                <p className="text-sm text-muted-foreground">{getScopeLabel(lesson.scope)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Créé</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(lesson.createdAt, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>

            {lesson.ageGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Groupes d&apos;âge</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lesson.ageGroups.map((age: string) => (
                      <Badge key={age} variant="outline" className="text-xs">
                        {age}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Section */}
      {(lesson.imageUrl || lesson.videoUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lesson.imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-64 overflow-hidden rounded-lg">
                  <img
                    src={lesson.imageUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {lesson.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Vidéo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-64 overflow-hidden rounded-lg">
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu de la leçon</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="ql-editor prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

