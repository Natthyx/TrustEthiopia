import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { NextResponse } from 'next/server'

const createPublicClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper function to group businesses by category
function groupBusinessesByCategory(businesses: any[]) {
  const categories: Record<string, any[]> = {}
  
  businesses.forEach(business => {
    const categoryName = business.category_name
    if (!categories[categoryName]) {
      categories[categoryName] = []
    }
    categories[categoryName].push(business)
  })
  
  return Object.entries(categories).map(([categoryName, businesses]) => ({
    categoryName,
    businesses: businesses.slice(0, 4) // Limit to 4 businesses per category
  }))
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
      .slice(0, 4)
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
        businesses(business_name, website),
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
      reviewerName: review.profiles?.name || "Anonymous User",
      businessWebsite: review.businesses?.website || null
    })) || []
    
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil((totalReviews || 0) / limit),
      totalReviews: totalReviews || 0,
      hasNext: page < Math.ceil((totalReviews || 0) / limit),
      hasPrev: page > 1
    }

    // Fetch featured subcategories data
    let featuredSubcategories: any[] = []
    
    try {
      // Fetch featured subcategories
      const { data: featuredData, error: featuredError } = await supabase
        .from('featured_subcategories')
        .select(`
          *,
          subcategories(
            name,
            category_id,
            categories(
              name,
              id
            )
          )
        `)
        .eq('is_active', true)
      
      if (featuredError) {
        console.error('Error fetching featured subcategories:', featuredError)
      } else {
        // For each featured subcategory, fetch top 4 businesses
        const subcategoryPromises = (featuredData || []).map(async (subcategory) => {
          // First, get all business IDs linked to this subcategory
          const { data: businessLinks, error: linksError } = await supabase
            .from('business_subcategories')
            .select('business_id')
            .eq('subcategory_id', subcategory.subcategory_id)
            
          if (linksError) {
            console.error(`Error fetching business links for subcategory ${subcategory.subcategory_id}:`, linksError)
            return {
              categoryName: `${subcategory.subcategories?.categories?.name || 'Unknown'} - ${subcategory.subcategories?.name || 'Unknown'}`,
              categoryId: subcategory.subcategories?.category_id || null,
              subcategoryId: subcategory.subcategory_id || null,
              subcategoryName: subcategory.subcategories?.name || null,
              businesses: []
            }
          }
          
          const businessIds = businessLinks?.map(link => link.business_id) || []
          
          if (businessIds.length === 0) {
            return {
              categoryName: `${subcategory.subcategories?.categories?.name || 'Unknown'} - ${subcategory.subcategories?.name || 'Unknown'}`,
              categoryId: subcategory.subcategories?.category_id || null,
              subcategoryId: subcategory.subcategory_id || null,
              subcategoryName: subcategory.subcategories?.name || null,
              businesses: []
            }
          }
          
          // Then, fetch the business details for these IDs
          const { data: businesses, error: businessesError } = await supabase
            .from('businesses')
            .select(`
              id,
              business_name,
              website
            `)
            .in('id', businessIds)
            .eq('is_banned', false)

          if (businessesError) {
            console.error(`Error fetching businesses for subcategory ${subcategory.subcategory_id}:`, businessesError)
            return {
              categoryName: `${subcategory.subcategories?.categories?.name || 'Unknown'} - ${subcategory.subcategories?.name || 'Unknown'}`,
              categoryId: subcategory.subcategories?.category_id || null,
              subcategoryId: subcategory.subcategory_id || null,
              subcategoryName: subcategory.subcategories?.name || null,
              businesses: []
            }
          }
          
          // Fetch reviews for these businesses
          const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('reviewee_id, rating')
            .in('reviewee_id', businessIds)
            
          if (reviewsError) {
            console.error(`Error fetching reviews for businesses in subcategory ${subcategory.subcategory_id}:`, reviewsError)
            return {
              categoryName: `${subcategory.subcategories?.categories?.name || 'Unknown'} - ${subcategory.subcategories?.name || 'Unknown'}`,
              categoryId: subcategory.subcategories?.category_id || null,
              subcategoryId: subcategory.subcategory_id || null,
              subcategoryName: subcategory.subcategories?.name || null,
              businesses: []
            }
          }
          
          // Calculate average ratings and review counts
          const businessStats: Record<string, { totalRating: number, count: number }> = {}
          
          reviews?.forEach(review => {
            if (!businessStats[review.reviewee_id]) {
              businessStats[review.reviewee_id] = { totalRating: 0, count: 0 }
            }
            businessStats[review.reviewee_id].totalRating += review.rating
            businessStats[review.reviewee_id].count += 1
          })
          
          // Filter businesses with at least 3 reviews and calculate averages
          const filteredBusinesses = businesses
            ?.map(business => {
              const stats = businessStats[business.id]
              if (!stats || stats.count < 3) return null
              
              return {
                id: business.id,
                business_name: business.business_name || '',
                website: business.website || null,
                rating: stats.totalRating / stats.count,
                review_count: stats.count
              }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            ?.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count)
            .slice(0, 4) || [] // Limit to 4 businesses per subcategory
          
          return {
            categoryName: `${subcategory.subcategories?.categories?.name || 'Unknown'} - ${subcategory.subcategories?.name || 'Unknown'}`,
            categoryId: subcategory.subcategories?.category_id || null,
            subcategoryId: subcategory.subcategory_id || null,
            subcategoryName: subcategory.subcategories?.name || null,
            businesses: filteredBusinesses
          }
        })
        
        // Wait for all subcategory promises to resolve
        featuredSubcategories = await Promise.all(subcategoryPromises)
      }
    } catch (error) {
      console.error('Error processing featured subcategories:', error)
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
      bestInCategories: featuredSubcategories, // This is now the featured subcategories with top businesses
      pagination: pagination
    })
  } catch (error) {
    console.error('Error fetching landing page data:', error)
    return NextResponse.json({ error: 'Failed to load landing page data' }, { status: 500 })
  }
}
