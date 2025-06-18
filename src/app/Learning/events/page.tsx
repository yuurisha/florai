"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Calendar, Plus } from "lucide-react"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { EventCard } from "@/components/event-card"
import { EventDetailsModal } from "@/components/event-details-modal"
import { useToast } from "@/components/toast"
import type { Event, EventInterest } from "@/models/Event"
import TopNavbar from "@/components/TopNavBar"

// Mock data - in a real app, this would come from an API
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Community Garden Cleanup",
    description:
      "Join us for a community cleanup event at the local garden. We'll be removing weeds, planting new flowers, and maintaining the garden beds. All tools and refreshments will be provided.",
    location: "Central Community Garden, 123 Green Street",
    date: "2024-01-15",
    time: "09:00",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-01T10:00:00Z",
    interestedUsers: ["user1", "user2", "user3"],
    notInterestedUsers: ["user4"],
    category: "cleanup",
    maxParticipants: 20,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "2",
    title: "Tree Planting Workshop",
    description:
      "Learn how to properly plant and care for trees in urban environments. This hands-on workshop will cover soil preparation, proper planting techniques, and ongoing maintenance.",
    location: "Riverside Park, North Entrance",
    date: "2024-01-20",
    time: "14:00",
    createdBy: "Mike Chen",
    createdAt: "2024-01-02T15:30:00Z",
    interestedUsers: ["user1", "user5"],
    notInterestedUsers: [],
    category: "workshop",
    maxParticipants: 15,
  },
  {
    id: "3",
    title: "Native Plant Identification Walk",
    description:
      "Discover the native plants in our local ecosystem. This guided walk will help you identify common native species and understand their ecological importance.",
    location: "Nature Trail, Greenwood Reserve",
    date: "2024-01-25",
    time: "10:30",
    createdBy: "Dr. Emily Rodriguez",
    createdAt: "2024-01-03T09:15:00Z",
    interestedUsers: ["user2", "user3", "user5", "user6"],
    notInterestedUsers: [],
    category: "community",
  },
]

interface ViewEventsPageProps {
  onNavigateToAddEvent: () => void
}

export default function ViewEventsPage({ onNavigateToAddEvent }: ViewEventsPageProps) {
  const { addToast } = useToast()
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(mockEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [userInterests, setUserInterests] = useState<Record<string, EventInterest["status"]>>({
    "1": "interested",
    "2": "none",
    "3": "not-interested",
  })

  // Filter events based on search and category
  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((event) => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, categoryFilter])

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleInterestChange = (eventId: string, status: EventInterest["status"]) => {
    const currentStatus = userInterests[eventId] || "none"

    // If clicking the same status, toggle it off
    const newStatus = currentStatus === status ? "none" : status

    setUserInterests((prev) => ({
      ...prev,
      [eventId]: newStatus,
    }))

    // Update event interested/not interested counts
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id === eventId) {
          const updatedEvent = { ...event }
          const userId = "current-user" // In a real app, this would come from auth

          // Remove user from both arrays first
          updatedEvent.interestedUsers = updatedEvent.interestedUsers.filter((id) => id !== userId)
          updatedEvent.notInterestedUsers = updatedEvent.notInterestedUsers.filter((id) => id !== userId)

          // Add to appropriate array based on new status
          if (newStatus === "interested") {
            updatedEvent.interestedUsers.push(userId)
          } else if (newStatus === "not-interested") {
            updatedEvent.notInterestedUsers.push(userId)
          }

          return updatedEvent
        }
        return event
      }),
    )

    // Show toast notification
    const statusText =
      newStatus === "none"
        ? "removed your interest"
        : newStatus === "interested"
          ? "marked as interested"
          : "marked as not interested"

    addToast({
      title: "Interest Updated",
      description: `You have ${statusText} in this event.`,
      variant: "success",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar></TopNavbar>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Green Space Events</h1>
            <p className="text-gray-600">Discover and join community events in your area</p>
          </div>
            <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700"
            >
            <a href="/Learning/events/addEvent">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </a>
            </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
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
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={handleViewDetails}
                onInterestChange={handleInterestChange}
                userInterestStatus={userInterests[event.id] || "none"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No events are currently available"}
            </p>
            <Button onClick={onNavigateToAddEvent} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
            </Button>
          </div>
        )}

        {/* Event Details Modal */}
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInterestChange={handleInterestChange}
          userInterestStatus={selectedEvent ? userInterests[selectedEvent.id] || "none" : "none"}
        />
      </div>
    </div>
  )
}
