import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { NextResponse } from 'next/server'

// Create a service role client for admin operations
const createAdminClient = () => {
  // This uses the service_role key which bypasses RLS
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/admin/best-in-categories/businesses?category_id=... - Fetch top rated businesses by category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    
    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }
    
    // Create admin client that bypasses RLS
    const supabase = createAdminClient()
    
    // Fetch businesses with their average ratings for the selected category
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name
      `)
      .eq('business_categories.category_id', categoryId)
      .eq('is_banned', false)
    
    if (error) {
      throw error
    }
    
    // Process the data to calculate average ratings
    const businessIds = data?.map(business => business.id) || []
    
    if (businessIds.length === 0) {
      return NextResponse.json([])
    }
    
    // Fetch reviews for these businesses
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('reviewee_id, rating')
      .in('reviewee_id', businessIds)
    
    if (reviewsError) {
      throw reviewsError
    }
    
    // Calculate average ratings and review counts
    const businessStats: Record<string, { totalRating: number, count: number }> = {}
    
    reviewsData?.forEach(review => {
      if (!businessStats[review.reviewee_id]) {
        businessStats[review.reviewee_id] = { totalRating: 0, count: 0 }
      }
      businessStats[review.reviewee_id].totalRating += review.rating
      businessStats[review.reviewee_id].count += 1
    })
    
    // Filter businesses with at least 3 reviews and calculate averages
    const filteredData = data
      ?.map(business => {
        const stats = businessStats[business.id]
        if (!stats || stats.count < 3) return null
        
        return {
          id: business.id,
          business_name: business.business_name || '',
          average_rating: stats.totalRating / stats.count,
          review_count: stats.count
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null) || []
    
    // Sort by average rating and review count
    const processedData = filteredData
      .sort((a, b) => b.average_rating - a.average_rating || b.review_count - a.review_count)
      .slice(0, 20)
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}