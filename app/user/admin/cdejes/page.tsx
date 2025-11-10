"use client"

import React, { useState } from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

const cdejFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  clusterId: z.string().min(1, "Le cluster est requis"),
  description: z.string().optional(),
})

export default function CDEJesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const createCDEJ = useMutation(api.organizations.createCDEJ)
  const clusters = useQuery(api.organizations.listClusters)
  const cdejs = useQuery(api.organizations.listCDEJs, {})

  const form = useForm<z.infer<typeof cdejFormSchema>>({
    resolver: zodResolver(cdejFormSchema),
    defaultValues: {
      name: "",
      clusterId: "",
      description: "",
    },
  })

  const handleCreateCDEJ = async (values: z.infer<typeof cdejFormSchema>) => {
    try {
      await createCDEJ({
        name: values.name,
        clusterId: values.clusterId as Id<"clusters">,
        description: values.description || undefined,
      })
      toast.success("CDEJ créé avec succès!")
      setIsDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error creating CDEJ:", error)
      toast.error("Erreur lors de la création du CDEJ: " + (error as Error).message)
    }
  }

  return (
    <RoleProtection allowedRoles={["national_admin", "cluster_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">Gérer les CDEJ</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les Centres de Développement d'Enfants et de Jeunes
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-blue-800 hover:bg-blue-700 text-white rounded-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer un CDEJ
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des CDEJ</CardTitle>
            <CardDescription>
              Tous les centres dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cdejs === undefined ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>Chargement...</p>
              </div>
            ) : cdejs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>Aucun CDEJ configuré</p>
                <p className="text-sm mt-2">
                  Créez votre premier centre pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cdejs.map((cdej) => {
                  const cluster = clusters?.find((c) => c._id === cdej.clusterId)
                  return (
                    <div
                      key={cdej._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-blue-800">{cdej.name}</h3>
                        {cluster && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Cluster: {cluster.name}
                          </p>
                        )}
                        {cdej.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {cdej.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Créer un CDEJ</DialogTitle>
              <DialogDescription>
                Créez un nouveau CDEJ dans un cluster
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCDEJ)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clusterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cluster *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un cluster" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clusters?.map((cluster) => (
                            <SelectItem key={cluster._id} value={cluster._id}>
                              {cluster.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du CDEJ" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description du CDEJ (optionnel)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-blue-800 text-blue-800 hover:border-blue-700 hover:text-blue-700 rounded-full"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                    {form.formState.isSubmitting ? "Création..." : "Créer le CDEJ"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleProtection>
  )
}

