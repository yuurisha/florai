"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/button"
import { AddEventForm } from "@/components/add-event-form"
import type { Event } from "@/models/Event"
import TopNavbar from "@/components/TopNavBar"

interface AddEventPageProps {
  onNavigateBack: () => void
  onEventCreate: (event: Event) => void
}

export default function AddEventPage({ onNavigateBack, onEventCreate }: AddEventPageProps) {
  const handleEventCreate = (eventData: Omit<Event, "id" | "createdAt" | "interestedUsers" | "notInterestedUsers">) => {
    const newEvent: Event = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      interestedUsers: [],
      notInterestedUsers: [],
    }

    onEventCreate(newEvent)
    onNavigateBack()
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <TopNavbar></TopNavbar>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Event</h1>
          <p className="text-gray-600">Create a new event for your green space community</p>
        </div>

        {/* Form */}
        <AddEventForm onEventCreate={handleEventCreate} />
      </div>
    </div>
  )
}
