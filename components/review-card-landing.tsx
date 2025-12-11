// components/review-card-landing.tsx
import { Card } from "@/components/ui/card"
import { RatingStars } from "@/components/rating-stars"

interface ReviewCardLandingProps {
  id: string
  rating: number
  comment: string | null
  businessName: string
  reviewerName: string
  createdAt: string
}

export function ReviewCardLanding({ 
  rating, 
  comment, 
  businessName, 
  reviewerName,
  createdAt
}: ReviewCardLandingProps) {
  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-sm truncate">{businessName}</h3>
          <p className="text-xs text-muted-foreground">{reviewerName}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(createdAt)}
        </span>
      </div>
      
      <div className="mb-2">
        <RatingStars rating={rating} size="sm" />
      </div>
      
      {comment && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          "{comment}"
        </p>
      )}
    </Card>
  )
}