// app/api/explore/route.ts
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
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')?.trim() || ''
    const categoryId = searchParams.get('category')
    const subcategoryName = searchParams.get('subcategory')?.trim()
    const sortBy = searchParams.get('sort') || 'rating'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12'))

    let businessIdsToFetch: string[] = []

    // Step 1: Determine which business IDs match all filters
    if (searchQuery) {
      // Text search on business fields
      const { data: textMatches } = await supabase
        .from('businesses')
        .select('id')
        .eq('is_banned', false)
        .or(
          `business_name.ilike.%${searchQuery}%,` +
          `location.ilike.%${searchQuery}%,` +
          `address.ilike.%${searchQuery}%`
        )

      const textMatchIds = textMatches?.map(b => b.id) || []

      // Category name search
      const { data: matchingCategories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', `%${searchQuery}%`)

      const catIds = matchingCategories?.map(c => c.id) || []

      let catMatchIds: string[] = []
      if (catIds.length > 0) {
        const { data: links } = await supabase
          .from('business_categories')
          .select('business_id')
          .in('category_id', catIds)
        catMatchIds = links?.map(l => l.business_id) || []
      }

      // Subcategory name search
      const { data: matchingSubcategories } = await supabase
        .from('subcategories')
        .select('id')
        .ilike('name', `%${searchQuery}%`)

      const subcatIds = matchingSubcategories?.map(s => s.id) || []

      let subcatMatchIds: string[] = []
      if (subcatIds.length > 0) {
        const { data: links } = await supabase
          .from('business_subcategories')
          .select('business_id')
          .in('subcategory_id', subcatIds)
        subcatMatchIds = links?.map(l => l.business_id) || []
      }

      // Combine all matching IDs (OR logic)
      businessIdsToFetch = Array.from(new Set([
        ...textMatchIds,
        ...catMatchIds,
        ...subcatMatchIds
      ]))
    } else {
      // No search query: start with all non-banned businesses
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('is_banned', false)

      businessIdsToFetch = data?.map(b => b.id) || []
    }

    // Apply category filter (if provided and not 'all')
    if (categoryId && categoryId !== 'all') {
      const { data: links } = await supabase
        .from('business_categories')
        .select('business_id')
        .eq('category_id', categoryId)

      const categoryBusinessIds = links?.map(l => l.business_id) || []
      businessIdsToFetch = businessIdsToFetch.filter(id => categoryBusinessIds.includes(id))
    }

    // Apply subcategory filter
    if (subcategoryName) {
      const { data: subcat } = await supabase
        .from('subcategories')
        .select('id')
        .ilike('name', subcategoryName)
        .single()

      if (subcat) {
        const { data: links } = await supabase
          .from('business_subcategories')
          .select('business_id')
          .eq('subcategory_id', subcat.id)

        const subcatBusinessIds = links?.map(l => l.business_id) || []
        businessIdsToFetch = businessIdsToFetch.filter(id => subcatBusinessIds.includes(id))
      } else {
        businessIdsToFetch = [] // No matching subcategory
      }
    }

    // If no businesses match filters
    if (businessIdsToFetch.length === 0) {
      return NextResponse.json({
        businesses: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    // Fetch full business data for matching IDs
    const { data: businesses, count: totalCount } = await supabase
      .from('businesses')
      .select(`
        id, 
        business_name, 
        location, 
        address,
        description,
        created_at,
        business_categories(
          category_id,
          categories(
            id,
            name
          )
        ),
        business_subcategories(
          subcategory_id,
          subcategories(
            id,
            name
          )
        )
      `, { count: 'exact' })
      .in('id', businessIdsToFetch)
      .eq('is_banned', false)

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        businesses: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    // Fetch review stats
    const { data: reviewCounts } = await supabase
      .from('reviews')
      .select('reviewee_id, rating')
      .in('reviewee_id', businesses.map(b => b.id))

    const statsMap = new Map<string, { total: number; count: number }>()
    reviewCounts?.forEach(r => {
      const entry = statsMap.get(r.reviewee_id) || { total: 0, count: 0 }
      entry.total += r.rating
      entry.count += 1
      statsMap.set(r.reviewee_id, entry)
    })

    // Sort businesses
    businesses.sort((a, b) => {
      const statsA = statsMap.get(a.id) || { total: 0, count: 0 }
      const statsB = statsMap.get(b.id) || { total: 0, count: 0 }
      const avgA = statsA.count > 0 ? statsA.total / statsA.count : 0
      const avgB = statsB.count > 0 ? statsB.total / statsB.count : 0

      if (sortBy === 'reviews') {
        return statsB.count - statsA.count
      }
      if (sortBy === 'recent') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      }
      // Default: rating
      if (avgB !== avgA) return avgB - avgA
      return statsB.count - statsA.count
    })

    // Paginate
    const totalPages = Math.ceil(businesses.length / limit)
    const startIndex = (page - 1) * limit
    const paginatedBusinesses = businesses.slice(startIndex, startIndex + limit)

    // Fetch primary images
    const { data: businessImages } = await supabase
      .from('business_images')
      .select('business_id, image_url')
      .in('business_id', paginatedBusinesses.map(b => b.id))
      .eq('is_primary', true)

    const imageMap = new Map<string, string>()
    businessImages?.forEach(img => imageMap.set(img.business_id, img.image_url))

    // Build final response
    const processed = paginatedBusinesses.map(business => {
      const stats = statsMap.get(business.id) || { total: 0, count: 0 }
      const averageRating = stats.count > 0
        ? Math.round((stats.total / stats.count) * 10) / 10
        : 0

      const categoryName = business.business_categories?.[0]?.categories?.name || 'Service'

      return {
        id: business.id,
        name: business.business_name,
        location: business.location || '',
        address: business.address || '',
        description: business.description || '',
        rating: averageRating,
        reviewCount: stats.count,
        imageUrl: imageMap.get(business.id) || '/placeholder-service-image.svg',
        category: categoryName
      }
    })

    return NextResponse.json({
      businesses: processed,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: businesses.length,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error in explore API:', error)
    return NextResponse.json(
      { error: 'Failed to load services' },
      { status: 500 }
    )
  }
}