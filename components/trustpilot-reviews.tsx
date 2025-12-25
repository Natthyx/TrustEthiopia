import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function TrustpilotReviews({ 
  reviews, 
  pagination,
  onPageChange
}: { 
  reviews: any[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}) {
  // Get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Get color based on initial
  const getColorClass = (initial: string) => {
    const colors = [
      'bg-gray-500',
      'bg-purple-600',
      'bg-blue-600',
      'bg-red-800',
      'bg-green-600',
      'bg-yellow-600',
      'bg-indigo-600',
      'bg-pink-600'
    ]
    const charCode = initial.charCodeAt(0) || 0
    return colors[charCode % colors.length]
  }

  const handlePrevPage = () => {
    if (pagination?.hasPrev && onPageChange) {
      onPageChange(pagination.currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination?.hasNext && onPageChange) {
      onPageChange(pagination.currentPage + 1)
    }
  }

  return (
    <section className="bg-background">
      <div className="container-app mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Recent reviews</h2>
          {pagination ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary hover:bg-primary/10"
                onClick={handlePrevPage}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary hover:bg-primary/10"
                onClick={handleNextPage}
                disabled={!pagination.hasNext}
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full border-primary hover:bg-primary/10">
                <ChevronLeft className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary hover:bg-primary/10">
                <ChevronRight className="h-4 w-4 text-primary" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review: any) => {
            const initials = getInitials(review.reviewerName)
            const colorClass = getColorClass(initials)
            
            return (
              <div key={review.id} className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-semibold`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{review.reviewerName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-[#00b67a] text-[#00b67a]" : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">"{review.comment}"</p>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <div className="min-w-0">
                    {review.businessId ? (
                      <Link 
                        href={`/service/${review.businessId}`}
                        className="text-xs font-semibold text-primary hover:underline truncate block"
                      >
                        {review.businessName}
                      </Link>
                    ) : (
                      <p className="text-xs font-semibold text-foreground truncate">{review.businessName}</p>
                    )}
                    {review.businessWebsite && (
                      <div className="mt-1">
                        
                        <a 
                          href={review.businessWebsite.startsWith('http') ? review.businessWebsite : `https://${review.businessWebsite}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline ml-1 truncate block"
                        >
                          {review.businessWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
        
        {pagination && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.currentPage - 1) * 8 + 1}-{Math.min(pagination.currentPage * 8, pagination.totalReviews)} of {pagination.totalReviews} reviews
            </p>
          </div>
        )}
        
        <div className="text-center mt-8">
          <Button variant="outline" className="rounded-full border-primary hover:bg-primary/10 text-primary" asChild>
            <Link href="/explore">See more reviews</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}