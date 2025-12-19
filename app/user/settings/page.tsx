'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ProfileImageUpload from '@/components/profile-image-upload'
import { Footer } from '@/components/footer'
import { toast } from 'sonner'

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  role: string | null
  profile_image_url: string | null
  phone: string | null
}

export default function UserSettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is banned by fetching profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, is_banned, profile_image_url, phone')
          .eq('id', user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        // Redirect banned users
        if (profileData.is_banned) {
          router.push('/auth/login?message=banned')
          return
        }

        setProfile(profileData)
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching profile:', error)
        router.push('/auth/login')
      }
    }

    fetchUserProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setUpdating(true)
    setUpdateSuccess(false)

    try {
      // Validate phone number format (E.164) if provided
      if (formData.phone && !/^\+[1-9][0-9]{1,14}$/.test(formData.phone)) {
        toast.error('Invalid phone number format. Please use E.164 format (e.g., +1234567890).')
        setUpdating(false)
        return
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update phone in auth user if changed
      if (formData.phone !== profile.phone) {
        const { error: authError } = await supabase.auth.updateUser({
          phone: formData.phone || undefined
        })
        
        if (authError) {
          console.error('Auth phone update error:', authError)
          toast.error('Profile updated but failed to update phone in authentication system.')
        }
      }

      // Show success message
      setUpdateSuccess(true)
      toast.success('Profile updated successfully!')

      // Refresh profile data
      setProfile({
        ...profile,
        name: formData.name,
        phone: formData.phone || null
      })

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
      setUpdateSuccess(false)
    } finally {
      setUpdating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpdate = (imageUrl: string | null) => {
    setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : null)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your settings...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                  Profile updated successfully!
                </div>
              )}
              
              <div className="flex flex-col items-center mb-6">
                <ProfileImageUpload 
                  currentImageUrl={profile?.profile_image_url}
                  onImageUpdate={handleImageUpdate}
                  size="lg"
                />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}