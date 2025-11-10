"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Clock, Users, Globe, Building2, Home, Eye, EyeOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"

export default function LessonsPage() {
  const lessons = useQuery(api.lessons.getLessons, {})

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "national":
        return <Globe className="h-3 w-3" />
      case "cluster":
        return <Building2 className="h-3 w-3" />
      case "cdej":
        return <Home className="h-3 w-3" />
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leçons</h1>
          <p className="text-muted-foreground mt-2">
            Gérer et consulter toutes les leçons
          </p>
        </div>
        <Button asChild className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
          <Link href="/user/lessons/create" >
            <Plus className="mr-2 h-4 w-4 " />
            Créer une leçon
          </Link>
        </Button>
      </div>

      {lessons === undefined ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des leçons...</p>
          </div>
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Liste des leçons</CardTitle>
            <CardDescription>
              Toutes les leçons disponibles dans la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucune leçon disponible</p>
              <p className="text-sm mt-2">
                Créez votre première leçon pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson._id} className="flex flex-col hover:shadow-lg transition-shadow pt-0">
              {lesson.imageUrl ? (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                  <Image
                    width={100}
                    height={100}
                    src={lesson.imageUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-blue-100">
                  <Image
                    width={100}
                    height={100}
                    src="/icon.png"
                    alt="Placeholder"
                    className="w-full h-full object-contain rounded-t-lg"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {lesson.title}
                  </CardTitle>
                  {lesson.isPublished ? (
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
                  {lesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getScopeIcon(lesson.scope)}
                    <span>{getScopeLabel(lesson.scope)}</span>
                  </div>
                  
                  {lesson.ageGroups.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <div className="flex flex-wrap gap-1">
                        {lesson.ageGroups.map((age: string) => (
                          <Badge key={age} variant="outline" className="text-xs">
                            {age}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(lesson.createdAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                  <Link href={`/user/lessons/${lesson._id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Voir la leçon
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
