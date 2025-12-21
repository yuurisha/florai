import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel"
import { TipCard } from "./tip-card"
import { Sun, Droplets, Flower, Sprout, TreePine, Leaf } from "lucide-react"

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

export function TipsCarousel() {
  return (
    <section className="mb-16">
      <div className="flex items-center mb-6">
        <Sun className="h-6 w-6 text-emerald-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Tips of the Day</h2>
      </div>

      <Carousel className="w-full max-w-5xl mx-auto">
        <CarouselContent>
          {tipsOfTheDay.map((tip) => (
            <CarouselItem key={tip.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-2">
                <TipCard title={tip.title} description={tip.description} icon={tip.icon} category={tip.category} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-emerald-200 hover:bg-emerald-50" />
        <CarouselNext className="border-emerald-200 hover:bg-emerald-50" />
      </Carousel>
    </section>
  )
}
