"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export default function LessonPage() {
  const params = useParams()
  const lessonId = params.id as Id<"lessons">
  
  const lesson = useQuery(api.lessons.getLesson, { lessonId })

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
    </div>
  )
}

