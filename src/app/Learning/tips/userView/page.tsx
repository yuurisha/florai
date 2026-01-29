"use client"

import PageHeader  from "@/components/page-header"
import { ResourcesGrid } from "@/components/resources-grid"
import TopNavBar from "@/components/TopNavBar";

import { useState } from "react"
import { Leaf, TreePine, Flower, Sprout, Droplets, BookOpen, Video, FileText } from "lucide-react"

const tipsOfTheDay = [
  {
    id: 1,
    title: "Water Early Morning",
    description: "Water your plants early in the morning to reduce evaporation and prevent fungal diseases.",
    icon: <Droplets className="h-6 w-6 text-emerald-600" />,
    category: "Watering",
  },
  {
    id: 2,
    title: "Companion Planting",
    description: "Plant marigolds near vegetables to naturally repel pests and attract beneficial insects.",
    icon: <Flower className="h-6 w-6 text-emerald-600" />,
    category: "Planting",
  },
  {
    id: 3,
    title: "Soil Health Check",
    description: "Test your soil pH monthly. Most plants thrive in slightly acidic to neutral soil (6.0-7.0 pH).",
    icon: <Sprout className="h-6 w-6 text-emerald-600" />,
    category: "Soil Care",
  },
  {
    id: 4,
    title: "Seasonal Pruning",
    description: "Prune deciduous trees during dormant season (late winter) for optimal growth and health.",
    icon: <TreePine className="h-6 w-6 text-emerald-600" />,
    category: "Maintenance",
  },
  {
    id: 5,
    title: "Natural Fertilizer",
    description: "Use compost tea as a gentle, organic fertilizer that won't burn your plants.",
    icon: <Leaf className="h-6 w-6 text-emerald-600" />,
    category: "Nutrition",
  },
]

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

type Resource = {
  id: number
  title: string
  description: string
  type: string
  icon: React.ReactNode
  content: string
  duration: string
  difficulty: string
}

const TipsCarousel: React.FC<{ tips: typeof tipsOfTheDay }> = ({ tips }) => {
  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Tips of the Day</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="flex-shrink-0 w-64 rounded-lg border bg-white p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {tip.icon}
                <h3 className="ml-2 text-lg font-semibold text-gray-900">{tip.title}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryColor(tip.category)}`}>
                {tip.category}
              </span>
            </div>
            <p className="mt-2 text-gray-700">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Watering":
      return "bg-blue-100 text-blue-800"
    case "Planting":
      return "bg-green-100 text-green-800"
    case "Soil Care":
      return "bg-brown-100 text-brown-800"
    case "Maintenance":
      return "bg-yellow-100 text-yellow-800"
    case "Nutrition":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function LearningResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<(typeof learningResources)[0] | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-emerald-100 text-emerald-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Video Course":
        return "bg-blue-100 text-blue-800"
      case "Guide":
        return "bg-purple-100 text-purple-800"
      case "Reference":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const ResourcesGrid: React.FC<{ resources: Resource[] }> = ({ resources }) => {
    return (
      <div className="my-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="rounded-lg border bg-white p-4 shadow-md transition-transform duration-200 hover:scale-105"
          >
            <div className="flex items-center">
              {resource.icon}
              <h3 className="ml-2 text-lg font-semibold text-gray-900">{resource.title}</h3>
            </div>
            <p className="mt-2 text-gray-700">{resource.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(resource.difficulty)}`}>
                {resource.difficulty}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeColor(resource.type)}`}>
                {resource.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader />
        <TipsCarousel tips={tipsOfTheDay} />
        <ResourcesGrid resources={learningResources} />
      </div>
    </div>
  )
}
