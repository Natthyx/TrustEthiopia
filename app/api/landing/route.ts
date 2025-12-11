import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { NextResponse } from 'next/server'

const createPublicClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const supabase = createPublicClient()
    
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '8')

    // Fetch statistics from the public stats table
    const { data: statsData, error: statsError } = await supabase
      .from('landing_stats')
      .select('user_count, business_count, review_count')
      .single()
      
    // Log error if there's an issue with stats
    if (statsError) {
      console.error('Error fetching landing stats:', statsError)
    }

    // Calculate monthly growth (last 30 days vs previous 30 days)
    const now = new Date()
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [{ count: recentUserCount, error: recentUserError }, { count: olderUserCount, error: olderUserError }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', lastMonth.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', twoMonthsAgo.toISOString()).lt('created_at', lastMonth.toISOString())
    ])

    // Log errors if there are issues with growth calculations
    if (recentUserError) {
      console.error('Error counting recent users:', recentUserError)
    }
    
    if (olderUserError) {
      console.error('Error counting older users:', olderUserError)
    }

    const monthlyGrowth = olderUserCount && olderUserCount > 0 
      ? Math.round(((recentUserCount! - olderUserCount!) / olderUserCount!) * 100)
      : 0

    // Fetch categories with business counts
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        icon,
        bg_color,
        business_categories(count)
      `)
      .order('name')
      
    // Log error if there's an issue with categories
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    const categoriesWithCounts = categories?.map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      bg_color: category.bg_color,
      count: category.business_categories?.[0]?.count || 0,
      description: `${category.name} services`
    })) || []

    // Fetch all businesses to calculate ratings
    const { data: allBusinesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id')
      .eq('is_banned', false)
      
    // Log error if there's an issue with businesses
    if (businessesError) {
      console.error('Error fetching businesses:', businessesError)
    }

    // Calculate average ratings for all businesses
    const businessRatings: Record<string, { average: number; count: number }> = {}
    
    if (allBusinesses) {
      const businessIds = allBusinesses.map(b => b.id)
      
      // Fetch reviews for all businesses
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('reviewee_id, rating')
        .in('reviewee_id', businessIds)
      
      // Log error if there's an issue with reviews
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
      }
      
      // Calculate average ratings
      if (reviews) {
        const ratingMap: Record<string, { total: number; count: number }> = {}
        
        reviews.forEach(review => {
          if (!ratingMap[review.reviewee_id]) {
            ratingMap[review.reviewee_id] = { total: 0, count: 0 }
          }
          ratingMap[review.reviewee_id].total += review.rating
          ratingMap[review.reviewee_id].count += 1
        })
        
        Object.keys(ratingMap).forEach(businessId => {
          const { total, count } = ratingMap[businessId]
          businessRatings[businessId] = {
            average: parseFloat((total / count).toFixed(1)),
            count
          }
        })
      }
    }

    // Get top 3 businesses by rating (with at least 3 reviews)
    const topBusinesses = Object.entries(businessRatings)
      .filter(([, rating]) => rating.count >= 3)
      .sort(([, a], [, b]) => b.average - a.average || b.count - a.count)
      .slice(0, 3)
      .map(([id]) => id)

    // Fetch featured services (top rated businesses with images)
    let featuredServices: any[] = []
    
    if (topBusinesses.length > 0) {
      const { data: featuredBusinesses, error: featuredBusinessesError } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          business_categories(
            categories(
              name
            )
          ),
          business_images(
            image_url,
            is_primary
          )
        `)
        .eq('is_banned', false)
        .in('id', topBusinesses)
        
      // Log error if there's an issue with featured businesses
      if (featuredBusinessesError) {
        console.error('Error fetching featured businesses:', featuredBusinessesError)
      }

      featuredServices = featuredBusinesses?.map(business => {
        // Get primary image or first image
        const primaryImage = business.business_images?.find(img => img.is_primary) || business.business_images?.[0]
        
        // Get first category name
        const categoryName = business.business_categories?.[0]?.categories?.name || "Service"
        
        // Get rating data
        const ratingData = businessRatings[business.id] || { average: 0, count: 0 }
        
        return {
          id: business.id,
          name: business.business_name || "Unnamed Business",
          category: categoryName,
          rating: ratingData.average || 5.0,
          reviewCount: ratingData.count || 0,
          imageUrl: primaryImage?.image_url || "/placeholder-service-image.svg"
        }
      }) || []
    }
    
    // Fetch recent reviews (with pagination)
    const offset = (page - 1) * limit
    
    const { data: reviewsData, error: reviewsDataError, count: totalReviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewee_id,
        businesses(business_name),
        profiles(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Log error if there's an issue with recent reviews
    if (reviewsDataError) {
      console.error('Error fetching recent reviews:', reviewsDataError)
    }
    
    const recentReviews = reviewsData?.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      businessName: review.businesses?.business_name || "Unknown Business",
      reviewerName: review.profiles?.name || "Anonymous User"
    })) || []
    
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil((totalReviews || 0) / limit),
      totalReviews: totalReviews || 0,
      hasNext: page < Math.ceil((totalReviews || 0) / limit),
      hasPrev: page > 1
    }

    // Return the response with all data
    return NextResponse.json({
      stats: {
        users: statsData?.user_count || 0,
        businesses: statsData?.business_count || 0,
        reviews: statsData?.review_count || 0,
        monthlyGrowth: monthlyGrowth
      },
      categories: categoriesWithCounts,
      featuredServices: featuredServices,
      recentReviews: recentReviews,
      pagination: pagination
    })
  } catch (error) {
    console.error('Error fetching landing page data:', error)
    return NextResponse.json({ error: 'Failed to load landing page data' }, { status: 500 })
  }
}