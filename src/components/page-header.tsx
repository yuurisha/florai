import { Leaf } from "lucide-react"

export default function PageHeader() {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-4">
        <Leaf className="h-8 w-8 text-emerald-600 mr-3" />
        <h1 className="text-4xl font-bold text-green-900">Learning Resources</h1>
      </div>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Discover expert tips and comprehensive resources to enhance your green space knowledge
      </p>
    </div>
  )
}