"use client"

import { useState } from "react"
import { ResourceCard } from "./resource-card"
import { ResourceModal } from "./resource-modal"
import { BookOpen, Video, FileText } from "lucide-react"

const learningResources = [
  {
    id: 1,
    title: "Plant Identification Guide",
    description: "Comprehensive guide to identifying common plants, trees, and flowers in your green space.",
    type: "Guide",
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    content:
      "This comprehensive guide covers over 200 common plant species you might encounter in urban and suburban green spaces. Learn to identify plants by their leaves, flowers, bark, and growth patterns. Includes seasonal identification tips and common look-alikes to avoid confusion.",
    duration: "45 min read",
    difficulty: "Beginner",
  },
  {
    id: 2,
    title: "Sustainable Gardening Practices",
    description: "Learn eco-friendly methods to maintain your garden while protecting the environment.",
    type: "Video Course",
    icon: <Video className="h-8 w-8 text-emerald-600" />,
    content:
      "Discover sustainable gardening techniques including water conservation, natural pest control, composting, and native plant selection. This video series covers practical methods to create an environmentally responsible garden that supports local ecosystems.",
    duration: "2.5 hours",
    difficulty: "Intermediate",
  },
  {
    id: 3,
    title: "Seasonal Care Calendar",
    description: "Month-by-month guide for optimal plant and garden care throughout the year.",
    type: "Reference",
    icon: <FileText className="h-8 w-8 text-emerald-600" />,
    content:
      "A detailed calendar outlining essential gardening tasks for each month. Includes planting schedules, pruning times, fertilization periods, and seasonal maintenance activities. Customizable for different climate zones and plant types.",
    duration: "Quick reference",
    difficulty: "All levels",
  },
  {
    id: 4,
    title: "Pest and Disease Management",
    description: "Natural methods to identify, prevent, and treat common garden pests and diseases.",
    type: "Guide",
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    content:
      "Learn to identify common garden pests and plant diseases early. Covers organic treatment methods, beneficial insects, companion planting for pest control, and preventive measures to maintain healthy plants without harmful chemicals.",
    duration: "1 hour read",
    difficulty: "Intermediate",
  },
  {
    id: 5,
    title: "Water-Wise Gardening",
    description: "Techniques for efficient water use and drought-resistant landscaping.",
    type: "Video Course",
    icon: <Video className="h-8 w-8 text-emerald-600" />,
    content:
      "Master water-efficient gardening techniques including drip irrigation setup, mulching strategies, drought-tolerant plant selection, and rainwater harvesting. Perfect for areas with water restrictions or those wanting to reduce water usage.",
    duration: "1.5 hours",
    difficulty: "Beginner",
  },
  {
    id: 6,
    title: "Soil Testing & Amendment",
    description: "Understanding soil composition and how to improve it for optimal plant growth.",
    type: "Guide",
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    content:
      "Complete guide to soil testing, understanding results, and amending soil for different plant needs. Covers pH adjustment, nutrient deficiencies, organic matter incorporation, and creating custom soil mixes for various plant types.",
    duration: "30 min read",
    difficulty: "Beginner",
  },
  {
    id: 7,
    title: "Native Plant Selection",
    description: "Choosing indigenous plants that thrive in your local climate and support wildlife.",
    type: "Reference",
    icon: <FileText className="h-8 w-8 text-emerald-600" />,
    content:
      "Comprehensive database of native plants organized by region, growing conditions, and wildlife benefits. Includes planting guides, care instructions, and ecological benefits of choosing native species over exotic alternatives.",
    duration: "Reference tool",
    difficulty: "All levels",
  },
  {
    id: 8,
    title: "Composting Mastery",
    description: "Complete guide to creating nutrient-rich compost from kitchen and garden waste.",
    type: "Video Course",
    icon: <Video className="h-8 w-8 text-emerald-600" />,
    content:
      "Learn various composting methods from traditional bins to vermicomposting. Covers proper ratios of green and brown materials, troubleshooting common problems, and using finished compost effectively in your garden.",
    duration: "2 hours",
    difficulty: "Beginner",
  },
  {
    id: 9,
    title: "Garden Design Principles",
    description: "Creating beautiful, functional garden layouts that maximize space and visual appeal.",
    type: "Guide",
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    content:
      "Explore fundamental design principles including color theory, plant placement, seasonal interest, and creating focal points. Learn to design gardens that are both beautiful and functional, with considerations for maintenance and growth patterns.",
    duration: "1.5 hour read",
    difficulty: "Intermediate",
  },
]

export function ResourcesGrid() {
  const [selectedResource, setSelectedResource] = useState<(typeof learningResources)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleResourceClick = (resource: (typeof learningResources)[0]) => {
    setSelectedResource(resource)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedResource(null)
  }

  return (
    <section>
      <div className="flex items-center mb-8">
        <BookOpen className="h-6 w-6 text-emerald-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Learning Resources</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            description={resource.description}
            type={resource.type}
            icon={resource.icon}
            duration={resource.duration}
            difficulty={resource.difficulty}
            onClick={() => handleResourceClick(resource)}
          />
        ))}
      </div>

      <ResourceModal resource={selectedResource} isOpen={isModalOpen} onClose={handleCloseModal} />
    </section>
  )
}
