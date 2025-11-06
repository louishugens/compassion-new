"use client"

import React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileQuestion, Users, Building2 } from "lucide-react"

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  const stats = [
    {
      title: "Leçons",
      value: "0",
      description: "Leçons disponibles",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Quiz",
      value: "0",
      description: "Quiz disponibles",
      icon: FileQuestion,
      color: "text-green-600",
    },
    {
      title: "Utilisateurs",
      value: "0",
      description: "Utilisateurs actifs",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "CDEJ",
      value: "0",
      description: "Centres actifs",
      icon: Building2,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue, {currentUser.firstName} {currentUser.lastName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Tableau de bord - {currentUser.role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Aperçu de votre activité récente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Aucune activité récente
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
