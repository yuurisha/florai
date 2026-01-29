"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Check, X, RefreshCcw, Trash2 } from "lucide-react"

import AdminTopNavbar from "../../../components/adminTopNavBar"
import { Button } from "../../../components/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/select"
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal"

import type { Event } from "../../../models/Event"
import {
  fetchAllEventsAdmin,
  approveEvent,
  rejectEvent,
  deleteEvent,
} from "../../../controller/eventController"

type StatusFilter = "pending" | "approved" | "rejected" | "all"

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  // ---- Load events ----
  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllEventsAdmin()
      setEvents(data)
    } catch (err: any) {
      console.error("Error loading events:", err)
      setError(err?.message || "Failed to load events. Please try again.")
      toast.error("Failed to load events.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // ---- Derived filtered list ----
  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events
    return events.filter((e) => e.status === statusFilter)
  }, [events, statusFilter])

  // ---- Counts for UI ----
  const counts = useMemo(() => {
    return {
      all: events.length,
      pending: events.filter((e) => e.status === "pending").length,
      approved: events.filter((e) => e.status === "approved").length,
      rejected: events.filter((e) => e.status === "rejected").length,
    }
  }, [events])

  // ---- Actions ----
  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId)
    
    // Store previous state for rollback
    const previousEvents = [...events]
    
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "approved" } : e)),
    )

    try {
      await approveEvent(eventId)
      toast.success("Event approved.")
    } catch (err: any) {
      console.error("Error approving event:", err)
      // Rollback on failure
      setEvents(previousEvents)
      toast.error(err?.message || "Failed to approve event.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId)
    
    // Store previous state for rollback
    const previousEvents = [...events]
    
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "rejected" } : e)),
    )

    try {
      await rejectEvent(eventId)
      toast.success("Event rejected.")
    } catch (err: any) {
      console.error("Error rejecting event:", err)
      // Rollback on failure
      setEvents(previousEvents)
      toast.error(err?.message || "Failed to reject event.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    setActionLoading(eventToDelete)
    setDeleteModalOpen(false)
    
    // Store previous state for rollback
    const previousEvents = [...events]
    
    // Optimistic removal
    setEvents((prev) => prev.filter((e) => e.id !== eventToDelete))

    try {
      await deleteEvent(eventToDelete)
      toast.success("Event deleted permanently.")
    } catch (err: any) {
      console.error("Error deleting event:", err)
      // Rollback on failure
      setEvents(previousEvents)
      toast.error(err?.message || "Failed to delete event.")
    } finally {
      setActionLoading(null)
      setEventToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopNavbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verify Events</h1>
            <p className="text-gray-600 mt-1">
              Review submitted events before they appear to users.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadEvents}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Queue:</span>{" "}
            Pending ({counts.pending}) · Approved ({counts.approved}) · Rejected ({counts.rejected})
          </div>

          <div className="sm:ml-auto">
            <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-48 justify-between">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>

              {/* Fix dropdown overflow issue by setting z-index and max-height */}
              <SelectContent className="z-50 max-h-64 w-48 overflow-y-auto">
                <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
                <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
                <SelectItem value="all">All ({counts.all})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-red-600 font-semibold">Error Loading Events</p>
                <p className="text-red-500 text-sm">{error}</p>
                <Button
                  onClick={loadEvents}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <div className="text-gray-600">
            No events found for: <span className="font-medium">{statusFilter}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="border">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <span
                      className={
                        "text-xs px-2 py-1 rounded-full border " +
                        (event.status === "pending"
                          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                          : event.status === "approved"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800")
                      }
                    >
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {event.date} · {event.time} · {event.location}
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted by: {event.createdBy}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Actions: only for pending */}
                  {event.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        onClick={() => handleApprove(event.id)}
                        disabled={actionLoading === event.id}
                      >
                        <Check className="h-4 w-4" />
                        {actionLoading === event.id ? "Approving..." : "Approve"}
                      </Button>

                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleReject(event.id)}
                        disabled={actionLoading === event.id}
                      >
                        <X className="h-4 w-4" />
                        {actionLoading === event.id ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      No actions available for {event.status}.
                    </div>
                  )}

                  {/* Delete button - available for all statuses */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(event.id)}
                      disabled={actionLoading === event.id}
                    >
                      <Trash2 className="h-3 w-3" />
                      {actionLoading === event.id ? "Deleting..." : "Delete Event"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <ConfirmDeleteModal
          message="Are you sure you want to permanently delete this event? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false)
            setEventToDelete(null)
          }}
        />
      )}
    </div>
  )
}
