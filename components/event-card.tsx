"use client"

import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import type { Event } from "../models/Event"

interface EventCardProps {
  event: Event
  onViewDetails: (event: Event) => void
  onInterestChange: (eventId: string, status: "interested" | "not-interested") => void
  userInterestStatus: "interested" | "not-interested" | "none"
}

export function EventCard({ event, onViewDetails, onInterestChange, userInterestStatus }: EventCardProps) {
  const getCategoryColor = (category: Event["category"]) => {
    switch (category) {
      case "workshop":
        return "bg-blue-100 text-blue-800"
      case "cleanup":
        return "bg-green-100 text-green-800"
      case "planting":
        return "bg-emerald-100 text-emerald-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "community":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="hover:shadow-lg hover:bg-green-50 transition-shadow duration-200 bg-white border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getCategoryColor(event.category)}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>{event.interestedUsers.length}</span>
          </div>
        </div>
        <CardTitle className="text-lg text-gray-900 line-clamp-2">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-emerald-600" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(event)} className="flex-1">
            View Details
          </Button>
          <div className="flex gap-1">
            <Button
              variant={userInterestStatus === "interested" ? "default" : "outline"}
              size="sm"
              onClick={() => onInterestChange(event.id, "interested")}
              className={userInterestStatus === "interested" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              👍
            </Button>
            <Button
              variant={userInterestStatus === "not-interested" ? "default" : "outline"}
              size="sm"
              onClick={() => onInterestChange(event.id, "not-interested")}
              className={userInterestStatus === "not-interested" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              👎
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
