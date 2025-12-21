"use client"

import { useEffect, useState } from "react"
import { Search, Filter, Calendar, Plus } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

import { Input } from "../../../components/input"
import { Button } from "../../../components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select"
import { EventCard } from "../../../components/event-card"
import { EventDetailsModal } from "../../../components/event-details-modal"
import TopNavbar from "../../../components/TopNavBar"

import type { Event, EventInterest } from "../../../models/Event"
import {
  fetchApprovedEvents,
  toggleEventInterest,
} from "../../../controller/eventController"
import { auth } from "../../../lib/firebaseConfig"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  /* =========================
     Load events from Firestore
     ========================= */
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchApprovedEvents()
        setEvents(data)
        setFilteredEvents(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load events.")
      }
    }

    loadEvents()
  }, [])

  /* =========================
     Local filtering (UI sorter)
     ========================= */
  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.location.toLowerCase().includes(q),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.category === categoryFilter,
      )
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, categoryFilter])

  /* =========================
     Helpers
     ========================= */
  const getUserInterestStatus = (
    event: Event,
  ): EventInterest["status"] => {
    const uid = auth.currentUser?.uid
    if (!uid) return "none"
    if (event.interestedUsers?.includes(uid)) return "interested"
    if (event.notInterestedUsers?.includes(uid)) return "not-interested"
    return "none"
  }

  const handleInterestChange = async (
    eventId: string,
    clickedStatus: EventInterest["status"],
  ) => {
    const uid = auth.currentUser?.uid
    if (!uid) {
      toast.error("Please log in to update interest.")
      return
    }

    const event = events.find((e) => e.id === eventId)
    if (!event) return

    const currentStatus = getUserInterestStatus(event)
    const newStatus = currentStatus === clickedStatus ? "none" : clickedStatus

    try {
      await toggleEventInterest(eventId, newStatus)

      // Optimistic UI update
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e

          const interestedUsers = e.interestedUsers.filter((id) => id !== uid)
          const notInterestedUsers = e.notInterestedUsers.filter((id) => id !== uid)

          if (newStatus === "interested") interestedUsers.push(uid)
          if (newStatus === "not-interested") notInterestedUsers.push(uid)

          return { ...e, interestedUsers, notInterestedUsers }
        }),
      )

      toast.success("Interest updated.")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update interest.")
    }
  }

  /* =========================
     Render
     ========================= */
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ========= HEADER ========= */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Green Space Events
            </h1>
            <p className="text-gray-600">
              Discover and join community events in your area
            </p>
          </div>

          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/Learning/events/addEvent">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Link>
          </Button>
        </div>

        {/* ========= SEARCH & SORTER ========= */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="cleanup">Cleanup</SelectItem>
              <SelectItem value="planting">Planting</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ========= EVENTS GRID ========= */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={() => {
                  setSelectedEvent(event)
                  setIsModalOpen(true)
                }}
                onInterestChange={handleInterestChange}
                userInterestStatus={getUserInterestStatus(event)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No events are currently available"}
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/Learning/events/addEvent">
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Link>
            </Button>
          </div>
        )}

        {/* ========= DETAILS MODAL ========= */}
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInterestChange={handleInterestChange}
          userInterestStatus={
            selectedEvent ? getUserInterestStatus(selectedEvent) : "none"
          }
        />
      </div>
    </div>
  )
}
