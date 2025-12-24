"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { registerUser, registerBusiness, signupWithPhone } from "@/app/auth/actions"
import { Footer } from "@/components/footer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Phone, Mail } from "lucide-react"

export default function RegisterPage() {
  const [userType, setUserType] = useState<"user" | "business">("user")
  const [regMethod, setRegMethod] = useState<"email" | "phone">("email")
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    businessName: "",
    location: "",
    website: "",
    phone: ""
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContinue = () => {
    if (regMethod === "email") {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    } else {
      if (!formData.phone) {
        setError('Phone number is required')
        return
      }
      const phoneRegex = /^\+[1-9][0-9]{1,14}$/
      if (!phoneRegex.test(formData.phone)) {
        setError('Invalid phone number format. Use E.164 format (e.g., +1234567890)')
        return
      }
    }
    setError(null)
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.fullName) {
      setError('Full name is required')
      setIsLoading(false)
      return
    }

    try {
      let result

      if (regMethod === "email") {
        if (userType === "user") {
          result = await registerUser({
            email: formData.email,
            password: formData.password,
            name: formData.fullName,
            role: "user"
          })
        } else {
          result = await registerBusiness({
            email: formData.email,
            password: formData.password,
            name: formData.fullName,
            businessName: formData.businessName,
            location: formData.location,
            website: formData.website,
            role: "business"
          })
        }

        if (result?.success) {
          router.push('/auth/login?message=check_email')
        }
      } else {
        // Phone registration
        result = await signupWithPhone(
          formData.phone,
          formData.fullName,
          userType,
          undefined,
          userType === "business" ? formData.businessName : undefined,
          userType === "business" ? formData.location : undefined,
          userType === "business" ? formData.website : undefined
        )

        if (result?.success) {
          router.push(`/auth/verify-phone?phone=${encodeURIComponent(formData.phone)}`)
        }
      }

      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const ProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          Account Info
        </span>
        <span className={`text-sm font-medium ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          Profile Details
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full transition-all duration-300" 
             style={{ width: step === 1 ? '50%' : '100%' }} />
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground mt-2">Join ReviewTrust today</p>
          </div>

          <Card className="p-8 mb-6">
            <ProgressBar />
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* User Type */}
            <div className="flex gap-3 mb-6 p-1 bg-muted rounded-lg">
              {(["user", "business"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setUserType(type)
                    setStep(1)
                    setError(null)
                    setFormData(prev => ({ ...prev, email: "", password: "", confirmPassword: "", businessName: "", location: "", website: "" }))
                  }}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                    userType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {type === "user" ? "User" : "Business"}
                </button>
              ))}
            </div>

            {/* Registration Method */}
            {/* <div className="flex gap-3 mb-6 p-1 bg-muted rounded-lg">
              <button
                onClick={() => { setRegMethod("email"); setStep(1); setError(null) }}
                className={`flex-1 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 ${
                  regMethod === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                onClick={() => { setRegMethod("phone"); setStep(1); setError(null) }}
                className={`flex-1 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 ${
                  regMethod === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Phone className="w-4 h-4" /> Phone
              </button>
            </div> */}

            <form className="space-y-4" onSubmit={handleRegister}>
              {step === 1 ? (
                <>
                  {regMethod === "email" ? (
                    <>
                      <div>
                        <Label>Email Address *</Label>
                        <Input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <Label>Password *</Label>
                        <Input name="password" type="password" placeholder="********" value={formData.password} onChange={handleInputChange} required minLength={6} />
                        <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                      </div>
                      <div>
                        <Label>Confirm Password *</Label>
                        <Input name="confirmPassword" type="password" placeholder="********" value={formData.confirmPassword} onChange={handleInputChange} required />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label>Phone Number *</Label>
                      <Input name="phone" type="tel" placeholder="+1234567890" value={formData.phone} onChange={handleInputChange} required />
                      <p className="text-xs text-muted-foreground mt-1">International format (E.164)</p>
                    </div>
                  )}
                  <Button type="button" className="w-full" onClick={handleContinue} disabled={isLoading}>
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>{userType === "user" ? "Full Name" : "Contact Person Name"} *</Label>
                    <Input name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleInputChange} required />
                  </div>

                  {userType === "business" && (
                    <>
                      <div>
                        <Label>Business Name *</Label>
                        <Input name="businessName" placeholder="Acme Inc." value={formData.businessName} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <Label>Location (Optional)</Label>
                        <Input name="location" placeholder="New York, NY" value={formData.location} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label>Website (Optional)</Label>
                        <Input name="website" type="url" placeholder="https://example.com" value={formData.website} onChange={handleInputChange} />
                      </div>
                    </>
                  )}

                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the Terms of Service and <Link href="/terms">Privacy Policy</Link>
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isLoading}>
                      Back
                    </Button>
                    <Button className="flex-1" type="submit" disabled={isLoading}>
                      {isLoading ? "Creating..." : regMethod === "phone" ? "Send Code" : "Create Account"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}