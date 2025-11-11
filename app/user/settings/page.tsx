"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)
  const updateUser = useMutation(api.users.updateUser)
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || "")
      setLastName(currentUser.lastName || "")
      if (currentUser.birthDate) {
        const date = new Date(currentUser.birthDate)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        setBirthDate(`${year}-${month}-${day}`)
      } else {
        setBirthDate("")
      }
    }
  }, [currentUser])

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!currentUser) return false
    
    const currentBirthDate = currentUser.birthDate 
      ? (() => {
          const date = new Date(currentUser.birthDate)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })()
      : ""
    
    return (
      firstName !== (currentUser.firstName || "") ||
      lastName !== (currentUser.lastName || "") ||
      birthDate !== currentBirthDate
    )
  }

  const calculateAgeGroup = (birthDateTimestamp: number): string => {
    const today = new Date()
    const birth = new Date(birthDateTimestamp)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 0) {
      return '0-5'
    } else if (age <= 5) {
      return '0-5'
    } else if (age <= 10) {
      return '6-10'
    } else if (age <= 15) {
      return '11-15'
    } else if (age <= 18) {
      return '16-18'
    } else {
      return '19+'
    }
  }

  const handleSave = async () => {
    if (!currentUser || !hasChanges()) return

    // Basic validation
    if (birthDate && new Date(birthDate) > new Date()) {
      toast.error("Erreur", {
        description: "La date de naissance ne peut pas être dans le futur",
      })
      return
    }

    setIsSaving(true)
    try {
      const birthDateTimestamp = birthDate ? new Date(birthDate).getTime() : undefined
      
      await updateUser({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        birthDate: birthDateTimestamp,
      })

      toast.success("Profil mis à jour avec succès")
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  const initials = `${currentUser?.firstName?.charAt(0) || ""}${currentUser?.lastName?.charAt(0) || ""}`.toUpperCase() || "?"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérer vos informations personnelles et préférences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentUser.profilePictureUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
                <AvatarFallback className="bg-blue-800 text-white text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  Changer la photo
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={currentUser.email} disabled />
            </div>

            <DatePicker
              id="birthDate"
              label="Date de naissance"
              value={birthDate}
              onChange={setBirthDate}
              maxDate={new Date()}
              description={birthDate ? `Groupe d'âge: ${calculateAgeGroup(new Date(birthDate).getTime())} ans` : undefined}
            />

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input 
                value={currentUser.role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} 
                disabled 
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges()} 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder les modifications"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

