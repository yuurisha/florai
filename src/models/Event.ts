export interface Event {
  id: string
  title: string
  description: string
  location: string
  date: string
  time: string
  createdBy: string
  createdAt: string
  interestedUsers: string[]
  notInterestedUsers: string[]
  category: "workshop" | "cleanup" | "planting" | "maintenance" | "community" | "other"
  maxParticipants?: number
  imageUrl?: string
}

export interface EventInterest {
  eventId: string
  userId: string
  status: "interested" | "not-interested" | "none"
}
