import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BestBusiness {
  id: string
  business_name: string
  website: string | null
  rating: number
  review_count: number
}

interface BestInCategory {
  categoryName: string
  categoryId: string | null
  subcategoryId: string | null
  subcategoryName: string | null
  businesses: BestBusiness[]
}

export function BestInSection({ categories }: { categories: BestInCategory[] }) {
  // Don't render if there are no categories
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="bg-background">
      <div className="container-app mx-auto px-4 space-y-16">
        {categories.map((category, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Best in {category.categoryName}</h2>
              <Button variant="outline" className="rounded-full border-primary hover:bg-primary/10 text-primary" asChild>
                {category.categoryId && category.subcategoryName ? (
                  <Link href={`/explore?category=${category.categoryId}&subcategory=${encodeURIComponent(category.subcategoryName)}`}>
                    See more
                  </Link>
                ) : (
                  <Link href={`/explore?category=${encodeURIComponent(category.categoryName)}`}>
                    See more
                  </Link>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.businesses.map((business, businessIndex) => (
                <div key={`${category.categoryName}-${businessIndex}`} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <span className="text-lg font-bold text-foreground">
                      {business.business_name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{business.business_name}</h3>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.round(business.rating) ? "fill-[#00b67a] text-[#00b67a]" : "fill-muted text-muted"}`} 
                      />
                    ))}
                    <span className="text-sm font-semibold text-foreground">{business.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({business.review_count})</span>
                  </div>
                  {business.website && (
                    <a 
                      href={business.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 block truncate"
                    >
                      {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}