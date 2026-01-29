import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import { Badge } from "./badge"

interface TipCardProps {
  title: string
  description: string
  icon: React.ReactNode
  category: string
}

export function TipCard({ title, description, icon, category }: TipCardProps) {
  return (
    <Card className="h-48 border-emerald-200 hover:border-emerald-300 transition-colors flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          {icon}
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {category}
          </Badge>
        </div>
        <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-start">
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
