"use client"

import TopNavbar from "../../../../components/TopNavBar"
import { AddEventForm } from "../../../../components/add-event-form"

export default function AddEventPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Event</h1>
          <p className="text-gray-600">Create a new event for your green space community</p>
        </div>

        <AddEventForm />
      </div>
    </div>
  )
}
