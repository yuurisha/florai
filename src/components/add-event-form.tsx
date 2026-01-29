"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Label } from "./label"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { useToast } from "./toast"
import type { Event } from "@/models/Event"

interface AddEventFormProps {
  onEventCreate: (event: Omit<Event, "id" | "createdAt" | "interestedUsers" | "notInterestedUsers">) => void
}

export function AddEventForm({ onEventCreate }: AddEventFormProps) {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    category: "" as Event["category"],
    maxParticipants: "",
    imageUrl: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.title ||
      !formData.description ||
      !formData.location ||
      !formData.date ||
      !formData.time ||
      !formData.category
    ) {
      addToast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? Number.parseInt(formData.maxParticipants) : undefined,
        createdBy: "Current User", // In a real app, this would come from auth
      }

      onEventCreate(eventData)

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        time: "",
        category: "" as Event["category"],
        maxParticipants: "",
        imageUrl: "",
      })

      addToast({
        title: "Success",
        description: "Event created successfully!",
        variant: "success",
      })
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Event location or address"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <div className="relative">
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="cleanup">Cleanup</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                placeholder="Optional"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">Event Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg (optional)"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  title: "",
                  description: "",
                  location: "",
                  date: "",
                  time: "",
                  category: "" as Event["category"],
                  maxParticipants: "",
                  imageUrl: "",
                })
              }
            >
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
