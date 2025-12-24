'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const supabase = createClient()

  // Determine user role for redirect after setting password
  const [userRole, setUserRole] = useState<'user' | 'business' | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        setUserRole(profile.role as 'user' | 'business')
      }
    }

    checkUser()
  }, [router, supabase])

  // Show toast based on message
  useEffect(() => {
    if (message === 'email_changed' || message === 'email_added_set_password') {
      toast.success("Your new email has been confirmed!")
    } else if (message === 'password_recovery') {
      toast.info("Please set a new password for your account.")
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) throw error

      toast.success("Password set successfully! You can now log in with your email.")

      // Redirect based on role
      if (userRole === 'business') {
        router.push('/business/setting')
      } else {
        router.push('/user/setting')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to set password")
    } finally {
      setLoading(false)
    }
  }

  const getDescription = () => {
    if (message === 'email_changed' || message === 'email_added_set_password') {
      return "Your new email has been confirmed! Set a password below to enable email login."
    }
    if (message === 'password_recovery') {
      return "Set a new password to regain access to your account."
    }
    return "Set a password to enable email + password login."
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Set Password</CardTitle>
            <CardDescription className="text-center">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting Password..." : "Set Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  )
}