"use client"

import { Calendar, MapPin, Users, Clock, User, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Badge } from "./badge"
import { Button } from "./button"
import type { Event } from "../models/Event"
import { useState, useEffect } from "react"
import { auth, db } from "../lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { deleteEvent } from "../controller/eventController"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import ConfirmDeleteModal from "./ConfirmDeleteModal"

interface EventDetailsModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onInterestChange: (eventId: string, status: "interested" | "not-interested") => void
  userInterestStatus: "interested" | "not-interested" | "none"
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onInterestChange,
  userInterestStatus,
}: EventDetailsModalProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setIsAdmin(userData?.role === "admin")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      }
    }

    if (isOpen) {
      checkAdmin()
    }
  }, [isOpen])

  const handleDeleteEvent = async () => {
    if (!event) return

    setDeleting(true)
    setShowDeleteConfirm(false)
    
    try {
      await deleteEvent(event.id)
      toast.success("Event deleted successfully")
      onClose()
      // Refresh the page to update the events list
      router.refresh()
      window.location.reload()
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast.error(error?.message || "Failed to delete event")
    } finally {
      setDeleting(false)
    }
  }

  if (!event) return null

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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between mb-4">
            <Badge className={getCategoryColor(event.category)}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>{event.interestedUsers.length} interested</span>
            </div>
          </div>
          <DialogTitle className="text-2xl text-gray-900 leading-tight">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          {/* {event.imageUrl && (
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={event.imageUrl || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div> */}
          {/* )} */}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-700">
              <Calendar className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-sm text-gray-600">{formatDate(event.date)}</div>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <div className="font-medium">Time</div>
                <div className="text-sm text-gray-600">{event.time}</div>
              </div>
            </div>
            <div className="flex items-start text-gray-700 md:col-span-2">
              <MapPin className="h-5 w-5 mr-3 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-medium">Location</div>
                <div className="text-sm text-gray-600">{event.location}</div>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <User className="h-5 w-5 mr-3 text-emerald-600" />
              <div>
                <div className="font-medium">Organizer</div>
                <div className="text-sm text-gray-600">{event.createdBy}</div>
              </div>
            </div>
            {event.maxParticipants && (
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-3 text-emerald-600" />
                <div>
                  <div className="font-medium">Max Participants</div>
                  <div className="text-sm text-gray-600">{event.maxParticipants}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Interest Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant={userInterestStatus === "interested" ? "default" : "outline"}
              onClick={() => onInterestChange(event.id, "interested")}
              className={`flex-1 ${userInterestStatus === "interested" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            >
              👍 {userInterestStatus === "interested" ? "Interested" : "Mark as Interested"}
            </Button>
            <Button
              variant={userInterestStatus === "not-interested" ? "default" : "outline"}
              onClick={() => onInterestChange(event.id, "not-interested")}
              className={`flex-1 ${userInterestStatus === "not-interested" ? "bg-red-600 hover:bg-red-700" : ""}`}
            >
              👎 {userInterestStatus === "not-interested" ? "Not Interested" : "Mark as Not Interested"}
            </Button>
          </div>

          {/* Admin Delete Button */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="w-full gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting Event..." : "Delete Event (Admin)"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Modal - Outside Dialog to avoid black background */}
    {showDeleteConfirm && event && (
      <ConfirmDeleteModal
        message={`Are you sure you want to permanently delete this event: "${event.title}"?\n\nThis action cannot be undone and will remove the event for all users.`}
        onConfirm={handleDeleteEvent}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
    </>
  )
}