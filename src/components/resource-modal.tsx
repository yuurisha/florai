import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Badge } from "./badge"
import {Button}  from "./button"

interface Resource {
  id: number
  title: string
  description: string
  type: string
  icon: React.ReactNode
  content: string
  duration: string
  difficulty: string
}

interface ResourceModalProps {
  resource: Resource | null
  isOpen: boolean
  onClose: () => void
}

export function ResourceModal({ resource, isOpen, onClose }: ResourceModalProps) {
  if (!resource) return null

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">{resource.icon}</div>
            <div className="flex-1">
              <DialogTitle className="text-xl text-gray-900 mb-2">{resource.title}</DialogTitle>
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className={getTypeColor(resource.type)}>
                  {resource.type}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor(resource.difficulty)}>
                  {resource.difficulty}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  {resource.duration}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="text-gray-600 leading-relaxed mb-6">{resource.content}</DialogDescription>
        <div className="flex gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Start Learning</Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            Save for Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
