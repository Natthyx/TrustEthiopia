'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  role: string | null
}

export default function UserSettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
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
          .select('id, name, email, role, is_banned')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          router.push('/auth/login')
          return
        }

        // If user is banned, redirect to public page
        if (profileData.is_banned) {
          // Sign out the user
          await supabase.auth.signOut()
          router.push('/?message=banned')
          return
        }

        // Fetch profile data
        setProfile(profileData)
        setFormData({
          name: profileData.name || '',
        })

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchUserProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setUpdateSuccess(false)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      // Show success message
      setUpdateSuccess(true)

      // Refresh profile data
      setProfile({
        ...profile!,
        name: formData.name,
      })

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
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
    </>
  )
}