"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import FileUpload from "@/components/FileUpload"
import LexicalEditor from "@/components/LexicalEditor"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  content: z.string().min(1, "Le contenu est requis"),
  ageGroups: z.array(z.string()).min(1, "Sélectionnez au moins un groupe d'âge"),
  scope: z.enum(["national", "cluster", "cdej"]),
  clusterId: z.string().optional(),
  cdejId: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  isPublished: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const AGE_GROUPS = [
  { value: "0-5", label: "0-5 ans" },
  { value: "6-10", label: "6-10 ans" },
  { value: "11-15", label: "11-15 ans" },
  { value: "16-18", label: "16-18 ans" },
  { value: "19+", label: "19+ ans" },
]

export default function CreateLessonPage() {
  const router = useRouter()
  const createLesson = useMutation(api.lessons.createLesson)
  const clusters = useQuery(api.lessons.getClusters)
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      ageGroups: [],
      scope: "cdej",
      clusterId: "",
      cdejId: "",
      imageUrl: "",
      videoUrl: "",
      isPublished: false,
    },
  })

  const selectedClusterId = form.watch("clusterId")

  // Get CDEJs for selected cluster
  const cdejs = useQuery(
    api.lessons.getCdejsByCluster,
    selectedClusterId ? { clusterId: selectedClusterId as any } : "skip"
  )

  // Determine available scope options based on user role
  const availableScopeOptions = useMemo(() => {
    if (!userInfo) return []
    
    const options: Array<{ value: "national" | "cluster" | "cdej"; label: string }> = []
    
    if (userInfo.role === "national_admin") {
      options.push(
        { value: "national", label: "National (tous les clusters/CDEJs)" },
        { value: "cluster", label: "Cluster" },
        { value: "cdej", label: "CDEJ" }
      )
    } else if (userInfo.role === "cluster_admin") {
      options.push(
        { value: "cluster", label: "Cluster" },
        { value: "cdej", label: "CDEJ" }
      )
    } else if (userInfo.role === "cdej_admin") {
      options.push({ value: "cdej", label: "CDEJ" })
    }
    
    return options
  }, [userInfo])

  // Auto-select cluster and cdej for non-national admins
  React.useEffect(() => {
    if (userInfo) {
      if (userInfo.role === "cluster_admin" && userInfo.clusterId) {
        form.setValue("clusterId", userInfo.clusterId)
      }
      if (userInfo.role === "cdej_admin" && userInfo.cdejId) {
        form.setValue("cdejId", userInfo.cdejId)
        if (userInfo.clusterId) {
          form.setValue("clusterId", userInfo.clusterId)
        }
      }
    }
  }, [userInfo, form])

  const toggleAgeGroup = (value: string) => {
    const current = form.getValues("ageGroups")
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    form.setValue("ageGroups", updated)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await createLesson({
        title: values.title,
        description: values.description,
        content: values.content,
        imageUrl: values.imageUrl || undefined,
        videoUrl: values.videoUrl || undefined,
        ageGroups: values.ageGroups,
        scope: values.scope,
        clusterId: values.scope !== "national" && values.clusterId ? (values.clusterId as any) : undefined,
        cdejId: values.scope === "cdej" && values.cdejId ? (values.cdejId as any) : undefined,
        isPublished: values.isPublished,
      })

      toast.success("Leçon créée avec succès!")
      form.reset()
      router.push("/user/lessons")
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast.error("Erreur lors de la création de la leçon: " + (error as Error).message)
    }
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
      <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild type="button">
          <Link href="/user/lessons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer une leçon</h1>
          <p className="text-muted-foreground mt-2">
            Créer une nouvelle leçon pour les bénéficiaires
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Remplissez les détails de la nouvelle leçon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de la leçon *</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez le titre de la leçon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Décrivez brièvement la leçon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu de la leçon *</FormLabel>
                  <FormControl>
                    <LexicalEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Écrivez le contenu de la leçon ici..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Médias</CardTitle>
            <CardDescription>
              Ajoutez des images ou vidéos à la leçon (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <FileUpload
                      endpoint="lessonImage"
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept="image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vidéo</FormLabel>
                  <FormControl>
                    <FileUpload
                      endpoint="lessonVideo"
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept="video"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public cible</CardTitle>
            <CardDescription>
              Sélectionnez les groupes d'âge et la portée de la leçon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="ageGroups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupes d'âge *</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {AGE_GROUPS.map((group) => (
                        <button
                          key={group.value}
                          type="button"
                          onClick={() => toggleAgeGroup(group.value)}
                          className={`px-4 py-2 rounded-md border transition-colors ${
                            field.value.includes(group.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-accent"
                          }`}
                        >
                          {group.label}
                        </button>
                      ))}
          </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portée *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={availableScopeOptions.length === 1}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la portée" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableScopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("scope") !== "national" && (
              <FormField
                control={form.control}
                name="clusterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cluster *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("cdejId", "") // Reset CDEJ when cluster changes
                      }}
                      value={field.value}
                      disabled={userInfo?.role === "cluster_admin" || userInfo?.role === "cdej_admin"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un cluster" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clusters?.map((cluster) => (
                          <SelectItem key={cluster._id} value={cluster._id}>
                            {cluster.name} ({cluster._id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("scope") === "cdej" && selectedClusterId && (
              <FormField
                control={form.control}
                name="cdejId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CDEJ *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={userInfo?.role === "cdej_admin"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un CDEJ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cdejs?.map((cdej) => (
                          <SelectItem key={cdej._id} value={cdej._id}>
                            {cdej.name} ({cdej._id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publication</CardTitle>
            <CardDescription>
              Choisissez si la leçon doit être publiée immédiatement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer font-normal">
                    Publier immédiatement
                  </FormLabel>
                </FormItem>
              )}
            />

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild type="button" className="outline-blue-800 hover:bg-blue-200 text-blue-800 rounded-full">
              <Link href="/user/lessons">Annuler</Link>
            </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer la leçon"
                )}
              </Button>
          </div>
        </CardContent>
      </Card>
      </form>
    </Form>
  )
}

