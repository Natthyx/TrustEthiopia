"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { loginUser, sendPhoneOTP, verifyPhoneOTP } from "@/app/auth/actions"
import { Footer } from "@/components/footer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const urlMessage = searchParams.get("message")
    const urlError = searchParams.get("error")

    if (urlMessage === "check_email") {
      setSuccess("Account created! Please check your email and confirm your account before logging in.")
    } else if (urlMessage === "email_verified") {
      setSuccess("Your email has been verified. Please log in.")
    } else if (urlMessage === "banned") {
      setError("Your account has been banned. Please contact support for assistance.")
    } else if (urlMessage === "phone_verified") {
      setSuccess("Your phone has been verified. Please log in.")
    } else if (urlMessage === "password_updated") {
      setSuccess("Your password has been updated successfully. You can now log in with your new password.")
    }

    if (urlError === "invalid_token") {
      setError("Invalid or expired verification link. Please try again.")
    } else if (urlError === "profile_not_found") {
      setError("User profile not found. Please contact support.")
    } else if (urlError === "verification_failed") {
      setError("Email verification failed. Please try again.")
    }
  }, [searchParams])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      const result = await loginUser(email, password)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result.redirectPath) {
        router.push(result.redirectPath)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!phone) {
      setError("Please enter your phone number")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await sendPhoneOTP(phone)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess("OTP sent to your phone. Please enter the code below.")
        setShowOtpInput(true)
        setCountdown(60) // 60 second cooldown
      }
    } catch (err) {
      console.error("OTP send error:", err)
      setError("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !otp) {
      setError("Please enter both phone number and OTP")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await verifyPhoneOTP(phone, otp)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result.redirectPath) {
        router.push(result.redirectPath)
      }
    } catch (err) {
      console.error("OTP verification error:", err)
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    await handleSendOTP()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your ReviewTrust account</p>
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

            <Tabs defaultValue="email" className="w-full">
              {/* <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </TabsTrigger>
              </TabsList> */}

              <TabsContent value="email">
                <form className="space-y-4" onSubmit={handleEmailLogin}>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm cursor-pointer">
                        Remember me
                      </Label> */}
                    </div>
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* <TabsContent value="phone">
                {!showOtpInput ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        className="mt-2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your phone number in international format (E.164)
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleSendOTP} 
                      disabled={isLoading || countdown > 0}
                    >
                      {isLoading ? "Sending OTP..." : countdown > 0 ? `Resend OTP in ${countdown}s` : "Send OTP"}
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleVerifyOTP}>
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

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => {
                          setShowOtpInput(false)
                          setOtp("")
                        }}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1" 
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? "Verifying..." : "Verify"}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Button 
                        variant="link" 
                        className="text-sm p-0 h-auto"
                        onClick={handleResendOTP}
                        disabled={isLoading || countdown > 0}
                      >
                        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Didn't receive the code? Resend"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent> */}
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
            </div>
          </Card>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}