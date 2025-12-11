import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { ServiceClientWrapper } from "@/components/service-client-wrapper"
import { Review } from '@/types/review'

// Create a public client for read-only operations
const createPublicClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Define types for our business data
type Business = {
  id: string
  name: string
  location: string | null
  address: string | null
  phone: string | null
  website: string | null
  google_map_embed: string | null
  businessHours: any | null
  description: string | null
  rating: number
  reviewCount: number
  createdAt: string | null
  updatedAt: string | null
  categories: { id: string; name: string; icon: string | null; bg_color: string | null }[]
  subcategories: { id: string; name: string }[]
  images: { id: string; image_url: string; is_primary: boolean }[]
}

// Fetch business data
async function getBusinessData(slug: string): Promise<{business: Business | null, reviews: Review[]}> {
  try {
    const supabase = createPublicClient()
    
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        location,
        description,
        website,
        phone,
        address,
        google_map_embed,
        business_hours,
        created_at,
        updated_at,
        business_owner_id,
        is_banned,
        business_categories(
          category_id,
          categories(
            id,
            name,
            icon,
            bg_color
          )
        ),
        business_subcategories(
          subcategory_id,
          subcategories(
            id,
            name
          )
        )
      `)
      .eq('id', slug)
      .eq('is_banned', false)
      .single()
    
    if (businessError) {
      console.error('Error fetching business:', businessError)
      return {business: null, reviews: []}
    }
    
    // Fetch average rating and review count
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        is_verified,
        profiles(name, profile_image_url)
      `)
      .eq('reviewee_id', slug)
      .order('created_at', { ascending: false })
    
    let averageRating = 0
    let reviewCount = 0
    let reviews: Review[] = []
    
    if (!reviewsError && reviewsData) {
      reviewCount = reviewsData.length
      if (reviewCount > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0)
        averageRating = Math.round((totalRating / reviewCount) * 10) / 10 // Round to 1 decimal place
        
        // Process reviews
        reviews = reviewsData.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          reviewer_name: review.profiles?.name || 'Anonymous User',
          reviewer_avatar: review.profiles?.profile_image_url || null,
          created_at: review.created_at || null,
          is_verified: review.is_verified || false,
          likes: 0,  // Initial likes from server (will be updated client-side)
          replies: []  // No replies from server fetch
        }))
      }
    }
    
    // Process the business data
    const processedBusiness: Business = {
      id: business.id,
      name: business.business_name,
      location: business.location,
      address: business.address,
      phone: business.phone,
      website: business.website,
      google_map_embed: business.google_map_embed,
      businessHours: business.business_hours,
      description: business.description,
      rating: averageRating,
      reviewCount: reviewCount,
      createdAt: business.created_at,
      updatedAt: business.updated_at,
      categories: business.business_categories.map((bc: any) => bc.categories),
      subcategories: business.business_subcategories.map((bs: any) => bs.subcategories),
      images: [] // Will be populated below
    }
    
    // Fetch business images
    const { data: imagesData, error: imagesError } = await supabase
      .from('business_images')
      .select('id, image_url, is_primary')
      .eq('business_id', slug)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (!imagesError && imagesData) {
      processedBusiness.images = imagesData
    }
    
    return {business: processedBusiness, reviews}
  } catch (error) {
    console.error('Error fetching business details:', error)
    return {business: null, reviews: []}
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params to get the actual values
  const { slug } = await params
  
  const { business, reviews } = await getBusinessData(slug)
  
  // If business not found, show a 404-like message
  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground">The business you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  // Format business hours for display
  const formatBusinessHours = () => {
    if (!business.businessHours) {
      // Return default hours if not set
      return [
        { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Friday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
        { day: 'Sunday', hours: 'Closed' },
      ]
    }
    
    // Parse and format business hours from JSON
    try {
      const hours = typeof business.businessHours === 'string' 
        ? JSON.parse(business.businessHours) 
        : business.businessHours
      
      // Define the correct order of days
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      
      // Convert to array and sort by the correct day order
      const sortedHours = Object.entries(hours)
        .map(([day, hours]) => ({
          day,
          hours: hours as string
        }))
        .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
      
      return sortedHours
    } catch (e) {
      // Fallback to default hours if parsing fails
      return [
        { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Friday', hours: '8:00 AM - 6:00 PM' },
        { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
        { day: 'Sunday', hours: 'Closed' },
      ]
    }
  }

  const businessHours = formatBusinessHours()

  // Pass data to client wrapper
  return <ServiceClientWrapper business={business} reviews={reviews} businessHours={businessHours} />
}
