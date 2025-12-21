"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"

interface ResourceCardProps {
  title: string
  description: string
  type: string
  icon: React.ReactNode
  duration: string
  difficulty: string
  onClick: () => void
}

export function ResourceCard({ title, description, type, icon, duration, difficulty, onClick }: ResourceCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-emerald-100 text-emerald-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Video Course":
        return "bg-blue-100 text-blue-800"
      case "Guide":
        return "bg-purple-100 text-purple-800"
      case "Reference":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-emerald-300 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">{icon}</div>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={getTypeColor(type)}>
              {type}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 mb-3 line-clamp-2">{description}</CardDescription>
        <div className="flex items-center text-sm text-gray-500">
          <span>{duration}</span>
        </div>
      </CardContent>
    </Card>
  )
}
