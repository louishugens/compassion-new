"use client"

import React, { useState } from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"

const clusterFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
})

export default function ClustersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const createCluster = useMutation(api.organizations.createCluster)
  const clusters = useQuery(api.organizations.listClusters)

  const form = useForm<z.infer<typeof clusterFormSchema>>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const handleCreateCluster = async (values: z.infer<typeof clusterFormSchema>) => {
    try {
      await createCluster({
        name: values.name,
        description: values.description || undefined,
      })
      toast.success("Cluster créé avec succès!")
      setIsDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error creating cluster:", error)
      toast.error("Erreur lors de la création du cluster: " + (error as Error).message)
    }
  }

  return (
    <RoleProtection allowedRoles={["national_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">Gérer les clusters</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les clusters de centres
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-blue-800 hover:bg-blue-700 text-white rounded-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer un cluster
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle >Liste des clusters</CardTitle>
            <CardDescription>
              Tous les clusters de centres dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clusters === undefined ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>Chargement...</p>
              </div>
            ) : clusters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-4 opacity-50" />
                <p>Aucun cluster configuré</p>
                <p className="text-sm mt-2">
                  Créez votre premier cluster pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clusters.map((cluster) => (
                  <div
                    key={cluster._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-blue-800">{cluster.name}</h3>
                      {cluster.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {cluster.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Créer un cluster</DialogTitle>
              <DialogDescription>
                Créez un nouveau cluster pour organiser les CDEJs
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCluster)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du cluster" {...field} />
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
                          placeholder="Description du cluster (optionnel)"
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
                    {form.formState.isSubmitting ? "Création..." : "Créer le cluster"}
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

