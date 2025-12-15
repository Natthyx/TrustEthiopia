import { 
  Shirt, 
  Hotel, 
  Utensils, 
  TabletSmartphone, 
  Folder, 
  Hospital, 
  ShoppingBag, 
  Briefcase, 
  Drama, 
  Car, 
  Home, 
  Sparkles, 
  Dumbbell, 
  Laptop, 
  Plane, 
  Book, 
  Wallet, 
  PawPrint,
  Stethoscope,
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

// Map category icon values to Lucide React components
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  "shirt": Shirt,
  "hotel": Hotel,
  "utensils": Utensils,
  "tablet-smartphone": TabletSmartphone,
  "tooth": Stethoscope,
  "folder": Folder,
  "hospital": Hospital,
  "shopping-bag": ShoppingBag,
  "briefcase": Briefcase,
  "drama": Drama,
  "car": Car,
  "home": Home,
  "sparkles": Sparkles,
  "dumbbell": Dumbbell,
  "laptop": Laptop,
  "plane": Plane,
  "book": Book,
  "wallet": Wallet,
  "paw-print": PawPrint,
}

export function TrustpilotCategories({ categories }: { categories: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const categoriesToShow = 5
  const maxIndex = Math.max(0, categories.length - categoriesToShow)

  // Reset index when categories change
  useEffect(() => {
    setCurrentIndex(0)
  }, [categories])

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }

  // Get the slice of categories to display
  const visibleCategories = categories.slice(currentIndex, currentIndex + categoriesToShow)

  return (
    <section className="bg-background">
      <div className="container-app mx-auto px-4">
        {/* Desktop layout - header and controls side by side */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">What are you looking for?</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-primary hover:bg-primary/10"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 text-primary" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-primary hover:bg-primary/10"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
            >
              <ChevronRight className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="outline" className="rounded-full border-primary hover:bg-primary/10 text-primary" asChild>
              <Link href="/categories">See more</Link>
            </Button>
          </div>
        </div>
        
        {/* Mobile layout - stacked elements */}
        <div className="md:hidden mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">What are you looking for?</h2>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary hover:bg-primary/10"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary hover:bg-primary/10"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </Button>
            </div>
            <Button variant="outline" className="rounded-full border-primary hover:bg-primary/10 text-primary" asChild>
              <Link href="/categories">See more</Link>
            </Button>
          </div>
        </div>
        
        {/* Categories grid - always show 5 centered */}
        <div className="grid grid-cols-5 gap-4 justify-items-center">
          {visibleCategories.map((category: any, index: number) => {
            const IconComponent = iconComponents[category.icon] || Folder
            return (
              <Link 
                key={category.id} 
                href={`/explore?category=${category.id}`}
                className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-primary/10 transition-colors w-full"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <span className="text-xs text-center text-foreground leading-tight">{category.name}</span>
              </Link>
            )
          })}
          
          {/* Fill empty slots if less than 5 categories */}
          {visibleCategories.length < categoriesToShow && 
            Array.from({ length: categoriesToShow - visibleCategories.length }).map((_, index) => (
              <div key={`empty-${index}`} className="w-12 h-12"></div>
            ))
          }
        </div>
      </div>
    </section>
  )
}