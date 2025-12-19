'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Footer } from '@/components/footer'

export default function VerifyPhonePage() {
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get phone number from URL params
    const phoneParam = searchParams.get('phone')
    if (phoneParam) {
      setPhone(phoneParam)
    } else {
      // If no phone param, redirect to register
      router.push('/auth/register')
    }
  }, [searchParams, router])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !otp) {
      setError('Please enter the verification code')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Phone verification successful! Redirecting to your account...')
        // Redirect to appropriate page after successful verification
        setTimeout(() => {
          router.push('/categories')
        }, 2000)
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: false // Don't create a new user, just resend OTP
        }
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('OTP resent to your phone!')
        setCountdown(60) // 60 second cooldown
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Verify Your Phone</h1>
            <p className="text-muted-foreground mt-2">Enter the code sent to your phone</p>
          </div>

          <Card className="p-8 mb-6">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleVerifyOTP}>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  {phone}
                </div>
              </div>

              <div>
                <Label htmlFor="otp" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="mt-2"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <Button 
                className="w-full" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Phone"}
              </Button>

              <div className="text-center pt-4">
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto"
                  onClick={handleResendOTP}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : "Didn't receive the code? Resend"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Wrong number?{" "}
              <a href="/auth/register" className="text-primary font-medium hover:underline">
                Go back to registration
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}