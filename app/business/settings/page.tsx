"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import ProfileImageUpload from "@/components/profile-image-upload"

interface OwnerProfile {
  id: string
  name: string | null
  email: string | null
  profile_image_url: string | null
}

interface Review {
  id: string
  business_name: string | null
  reviewer_name: string | null
  rating: number | null
  comment: string | null
  created_at: string | null
}

export default function BusinessSettingsPage() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is business
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, profile_image_url')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData || profileData.role !== 'business') {
          router.push('/auth/login')
          return
        }

        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          profile_image_url: profileData.profile_image_url
        })

        // Fetch reviews written by this business owner
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            business:businesses(business_name)
          `)
          .eq('reviewer_id', user.id)
          .order('created_at', { ascending: false })

        if (!reviewsError) {
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            business_name: review.business?.business_name || 'Unknown Business',
            reviewer_name: null,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at
          }))
          setReviews(formattedReviews)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchProfileData()
  }, [router])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (profile) {
      setProfile({
        ...profile,
        [name]: value
      })
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success("Profile updated successfully.")
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }

    setChangingPassword(true)
    try {
      // Update password through Supabase auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success("Password updated successfully.")
      
      // Reset password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error("Failed to update password.")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleImageUpdate = (imageUrl: string | null) => {
    setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : null)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">Manage your account and reviews</p>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="business" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and reviews</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              <div className="flex flex-col items-center mb-6">
                <ProfileImageUpload 
                  currentImageUrl={profile?.profile_image_url}
                  onImageUpdate={handleImageUpdate}
                  size="lg"
                />
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile?.name || ""}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile?.email || ""}
                    onChange={handleProfileChange}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Reviews Section */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6">Reviews You've Written</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{review.business_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : "Unknown date"}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`text-lg ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">You haven't written any reviews yet</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}