import Link from "next/link"
import { RatingStars } from "./rating-stars"
import { MapPin } from "lucide-react"

interface ServiceListItemProps {
  id: string
  name: string
  imageUrl: string
  category: string
  rating: number
  reviewCount: number
  location?: string
  description?: string
}

export function ServiceListItem({
  id,
  name,
  imageUrl,
  category,
  rating,
  reviewCount,
  location,
  description,
}: ServiceListItemProps) {
  return (
    <Link href={`/service/${id}`} className="block">
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex-shrink-0">
          <img
            src={imageUrl || "/placeholder-service-image.svg"}
            alt={name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {rating > 0 ? rating.toFixed(1) : "No ratings"}
              </span>
              <RatingStars rating={rating} />
              <span className="text-sm text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}
          
          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}