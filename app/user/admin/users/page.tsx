"use client"

import React, { useState } from "react"
import { RoleProtection } from "@/components/RoleProtection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User2, Plus, Copy, Check, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
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
import type { Role } from "@/convex/auth"
import type { Id } from "@/convex/_generated/dataModel"

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum([
    "national_admin",
    "cluster_admin",
    "cdej_admin",
    "cdej_staff",
    "cdej_monitor",
    "beneficiary",
  ]),
  clusterId: z.string().optional(),
  cdejId: z.string().optional(),
}).refine((data) => {
  // Beneficiary requires cdejId
  if (data.role === "beneficiary" && !data.cdejId) {
    return false
  }
  return true
}, {
  message: "Le CDEJ est requis pour les bénéficiaires",
  path: ["cdejId"],
}).refine((data) => {
  // Cluster admin requires clusterId
  if (data.role === "cluster_admin" && !data.clusterId) {
    return false
  }
  return true
}, {
  message: "Le cluster est requis pour les administrateurs de cluster",
  path: ["clusterId"],
})

const cdejFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  clusterId: z.string().min(1, "Le cluster est requis"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const ROLES: Array<{ value: Role; label: string; enabled: boolean }> = [
  { value: "national_admin", label: "Administrateur National", enabled: true },
  { value: "cluster_admin", label: "Administrateur Cluster", enabled: false },
  { value: "cdej_admin", label: "Administrateur CDEJ", enabled: false },
  { value: "cdej_staff", label: "Personnel CDEJ", enabled: false },
  { value: "cdej_monitor", label: "Moniteur CDEJ", enabled: false },
  { value: "beneficiary", label: "Bénéficiaire", enabled: true },
]

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCdejDialogOpen, setIsCdejDialogOpen] = useState(false)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [codeToRevoke, setCodeToRevoke] = useState<Id<"accessCodes"> | null>(null)
  
  const createAccessCode = useMutation(api.users.createAccessCode)
  const revokeAccessCode = useMutation(api.users.revokeAccessCode)
  const createCDEJ = useMutation(api.organizations.createCDEJ)
  const clusters = useQuery(api.lessons.getClusters)
  const userInfo = useQuery(api.lessons.getCurrentUserInfo)
  const accessCodes = useQuery(api.users.listAccessCodes)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "beneficiary",
      clusterId: "",
      cdejId: "",
    },
  })

  const watchedRole = form.watch("role")
  const watchedClusterId = form.watch("clusterId")
  
  // For beneficiaries, get all CDEJs. For cluster_admin, get CDEJs by cluster
  const cdejs = useQuery(
    watchedRole === "beneficiary" 
      ? api.organizations.listCDEJs
      : api.lessons.getCdejsByCluster,
    watchedRole === "beneficiary" 
      ? {} 
      : watchedClusterId 
        ? { clusterId: watchedClusterId as Id<"clusters"> } 
        : "skip"
  )

  const cdejForm = useForm<z.infer<typeof cdejFormSchema>>({
    resolver: zodResolver(cdejFormSchema),
    defaultValues: {
      name: "",
      clusterId: watchedClusterId || "",
      description: "",
    },
  })

  // Update cdejForm clusterId when watchedClusterId changes
  React.useEffect(() => {
    if (watchedClusterId) {
      cdejForm.setValue("clusterId", watchedClusterId)
    }
  }, [watchedClusterId, cdejForm])

  // Reset cdejId when cluster changes (only for cluster_admin)
  React.useEffect(() => {
    if (watchedClusterId && watchedRole === "cluster_admin") {
      form.setValue("cdejId", "")
    }
  }, [watchedClusterId, watchedRole, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createAccessCode({
        email: values.email,
        role: values.role,
        clusterId: values.clusterId ? (values.clusterId as Id<"clusters">) : undefined,
        cdejId: values.cdejId ? (values.cdejId as Id<"cdejs">) : undefined,
      })
      setGeneratedCode(result.code)
      toast.success("Code d'accès créé avec succès!")
      form.reset()
    } catch (error) {
      console.error("Error creating access code:", error)
      toast.error("Erreur lors de la création du code: " + (error as Error).message)
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      toast.success("Code copié dans le presse-papiers!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setGeneratedCode(null)
    form.reset()
  }

  const handleCreateCDEJ = async (values: z.infer<typeof cdejFormSchema>) => {
    try {
      const result = await createCDEJ({
        name: values.name,
        clusterId: values.clusterId as Id<"clusters">,
        description: values.description || undefined,
      })
      toast.success("CDEJ créé avec succès!")
      setIsCdejDialogOpen(false)
      cdejForm.reset()
      // Automatically select the newly created CDEJ
      form.setValue("cdejId", result.cdejId)
    } catch (error) {
      console.error("Error creating CDEJ:", error)
      toast.error("Erreur lors de la création du CDEJ: " + (error as Error).message)
    }
  }

  const handleRevokeClick = (codeId: Id<"accessCodes">) => {
    setCodeToRevoke(codeId)
    setIsRevokeDialogOpen(true)
  }

  const handleConfirmRevoke = async () => {
    if (!codeToRevoke) return
    
    try {
      await revokeAccessCode({ codeId: codeToRevoke })
      toast.success("Code d'accès révoqué avec succès!")
      setIsRevokeDialogOpen(false)
      setCodeToRevoke(null)
    } catch (error) {
      console.error("Error revoking access code:", error)
      toast.error("Erreur lors de la révocation du code: " + (error as Error).message)
    }
  }

  const getRoleLabel = (role: Role) => {
    return ROLES.find((r) => r.value === role)?.label || role
  }

  const getStatusBadge = (status: string, isUsed: boolean) => {
    if (isUsed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3" />
          Utilisé
        </span>
      )
    }
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle2 className="h-3 w-3" />
            Actif
          </span>
        )
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Révoqué
          </span>
        )
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>
    }
  }

  const canCreateCDEJ = userInfo?.role === "national_admin" || userInfo?.role === "cluster_admin"

  return (
    <RoleProtection allowedRoles={["national_admin", "cluster_admin", "cdej_admin"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">Gérer les utilisateurs</h1>
            <p className="text-muted-foreground mt-2">
              Administrer les utilisateurs du système
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Créer un code d'accès
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des codes d'accès</CardTitle>
            <CardDescription>
              Tous les codes d'accès créés dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessCodes === undefined ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>Chargement...</p>
              </div>
            ) : accessCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <User2 className="h-12 w-12 mb-4 opacity-50" />
                <p>Aucun code d'accès trouvé</p>
                <p className="text-sm mt-2">
                  Créez des codes d'accès pour inviter des utilisateurs
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-sm">Code</th>
                        <th className="text-left p-3 font-semibold text-sm">Email</th>
                        <th className="text-left p-3 font-semibold text-sm">Rôle</th>
                        <th className="text-left p-3 font-semibold text-sm">Statut</th>
                        <th className="text-left p-3 font-semibold text-sm">Cluster</th>
                        <th className="text-left p-3 font-semibold text-sm">CDEJ</th>
                        <th className="text-left p-3 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessCodes.map((code) => (
                        <tr key={code._id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <code className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded">
                              {code.code}
                            </code>
                          </td>
                          <td className="p-3 text-sm">{code.email}</td>
                          <td className="p-3 text-sm">{getRoleLabel(code.role)}</td>
                          <td className="p-3">{getStatusBadge(code.status, code.isUsed)}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {code.clusterName || "-"}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {code.cdejName || "-"}
                          </td>
                          <td className="p-3">
                            {code.status === "pending" && !code.isUsed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeClick(code._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Créer un code d'accès</DialogTitle>
              <DialogDescription>
                Créez un code d'accès pour inviter un nouvel utilisateur au système
              </DialogDescription>
            </DialogHeader>

            {generatedCode ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">Code d'accès généré:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background px-3 py-2 text-lg font-mono font-bold">
                      {generatedCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Partagez ce code avec l'utilisateur pour qu'il puisse s'inscrire
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseDialog} className=" rounded-full ">Fermer</Button>
                </DialogFooter>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="utilisateur@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            // Reset cluster and cdej when role changes
                            form.setValue("clusterId", "")
                            form.setValue("cdejId", "")
                            // For cluster_admin, we'll need to select cluster first
                            // For beneficiary, we'll select CDEJ directly
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem
                                key={role.value}
                                value={role.value}
                                disabled={!role.enabled}
                              >
                                {role.label}
                                {!role.enabled && (
                                  <span className="text-muted-foreground ml-2 text-xs">
                                    (bientôt disponible)
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Seuls les rôles Administrateur National et Bénéficiaire sont disponibles pour le moment
                        </p>
                      </FormItem>
                    )}
                  />

                  {watchedRole === "beneficiary" && (
                    <FormField
                      control={form.control}
                      name="cdejId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>CDEJ *</FormLabel>
                            {canCreateCDEJ && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCdejDialogOpen(true)}
                                className="h-7 text-xs"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Créer
                              </Button>
                            )}
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un CDEJ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cdejs?.map((cdej) => (
                                <SelectItem key={cdej._id} value={cdej._id}>
                                  {cdej.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedRole === "cluster_admin" && (
                    <FormField
                      control={form.control}
                      name="clusterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cluster *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue("cdejId", "")
                            }}
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

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="border-blue-800 text-blue-800 hover:border-blue-700 hover:text-blue-700 rounded-full"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                      {form.formState.isSubmitting ? "Création..." : "Créer le code"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Create CDEJ Dialog */}
        <Dialog open={isCdejDialogOpen} onOpenChange={setIsCdejDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Créer un CDEJ</DialogTitle>
              <DialogDescription>
                Créez un nouveau CDEJ dans le cluster sélectionné
              </DialogDescription>
            </DialogHeader>
            <Form {...cdejForm}>
              <form onSubmit={cdejForm.handleSubmit(handleCreateCDEJ)} className="space-y-4">
                <FormField
                  control={cdejForm.control}
                  name="clusterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cluster *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={watchedRole === "cluster_admin" && !!watchedClusterId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un cluster" />
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
                      {watchedRole === "cluster_admin" && watchedClusterId && (
                        <p className="text-xs text-muted-foreground">
                          Cluster pré-sélectionné depuis le formulaire principal
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={cdejForm.control}
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
                  control={cdejForm.control}
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
                    onClick={() => setIsCdejDialogOpen(false)}
                    className="border-blue-800 text-blue-800 hover:border-blue-700 hover:text-blue-700 rounded-full"
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={cdejForm.formState.isSubmitting} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full">
                    {cdejForm.formState.isSubmitting ? "Création..." : "Créer le CDEJ"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation Dialog */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Révoquer le code d'accès</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir révoquer ce code d'accès ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRevokeDialogOpen(false)
                  setCodeToRevoke(null)
                }}
                className="border-blue-800 text-blue-800 hover:border-blue-700 hover:text-blue-700 rounded-full"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRevoke}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full"
              >
                Révoquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleProtection>
  )
}

