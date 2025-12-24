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
// import VerificationModal from '@/components/verification-modal'
// import { requestEmailChange, requestPhoneChange } from '@/app/auth/actions'

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
    email: '',
    phone: ''
  })
  const [showPhoneVerification, setShowPhoneVerification] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, is_banned, profile_image_url, phone')
          .eq('id', user.id)
          .single()

        if (profileError || profileData.is_banned) {
          router.push('/auth/login?message=banned')
          return
        }

        setProfile(profileData)
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
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

    try {
      let needsPhoneVerification = false
      let phoneToVerify: string | null = null

      // // Email change → send link
      // if (formData.email !== profile.email && formData.email.trim()) {
      //   const result = await requestEmailChange(formData.email.trim())
      //   if (result.success) {
      //     toast.success('Verification email sent! Check your inbox.')
      //   } else {
      //     toast.error(result.error || 'Failed to send verification email')
      //     setUpdating(false)
      //     return
      //   }
      // }

      // Phone change → send OTP
      // if (formData.phone !== profile.phone && formData.phone.trim()) {
      //   const result = await requestPhoneChange(formData.phone.trim())
      //   if (result.success) {
      //     needsPhoneVerification = true
      //     phoneToVerify = formData.phone.trim()
      //     toast.success('OTP sent to your new phone!')
      //   } else {
      //     toast.error(result.error || 'Failed to send OTP')
      //     setUpdating(false)
      //     return
      //   }
      // }

      // Update name immediately
      const nameChanged = formData.name !== profile.name
      if (nameChanged) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) throw error

        setProfile(prev => prev ? { ...prev, name: formData.name } : null)
        toast.success('Name updated successfully!')
      }

      // Show phone verification modal if needed
      if (needsPhoneVerification && phoneToVerify) {
        setShowPhoneVerification(phoneToVerify)
      } else if (!needsPhoneVerification && !nameChanged) {
        toast.info('No changes to save')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handlePhoneVerificationSuccess = (newPhone: string) => {
    setProfile(prev => prev ? { ...prev, phone: newPhone } : null)
    setFormData(prev => ({ ...prev, phone: newPhone }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
              <CardDescription>
                Update your details. Email changes require clicking a link sent to your inbox. Phone changes require OTP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <ProfileImageUpload 
                  currentImageUrl={profile?.profile_image_url}
                  onImageUpdate={handleImageUpdate}
                  size="lg"
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    A confirmation link will be sent to the new email.
                  </p>
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
                    disabled={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    You will receive a 6-digit OTP to verify the new number.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Processing...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Phone Verification Modal Only
      {showPhoneVerification && (
        <VerificationModal
          phone={showPhoneVerification}
          onSuccess={handlePhoneVerificationSuccess}
          onClose={() => setShowPhoneVerification(null)}
        />
      )} */}
    </>
  )
}