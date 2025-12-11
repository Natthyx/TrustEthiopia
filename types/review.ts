// types/review.ts
export interface Reply {
  id: string
  author: string
  content: string
  date: string
  likes: number
  isLiked: boolean
  onLike?: () => void
}

export interface Review {
  id: string
  rating: number
  comment: string | null
  reviewer_name: string | null
  reviewer_avatar?: string | null
  created_at: string | null
  is_verified: boolean | null
  likes: number
  replies?: Reply[]
}