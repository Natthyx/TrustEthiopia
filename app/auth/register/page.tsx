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
import { registerUser, registerBusiness } from "@/app/auth/actions"
import { Footer } from "@/components/footer"

export default function RegisterPage() {
  const [userType, setUserType] = useState<"user" | "business">("user")
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    businessName: "",
    location: "",
    website: ""
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContinue = () => {
    // Validate step 1 fields before continuing
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setError(null)
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    // Validate required fields for step 2
    if (!formData.fullName) {
      setError('Please fill in your full name')
      setIsLoading(false)
      return
    }
    
    try {
      if (userType === "user") {
        // Register user
        const userData = {
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          role: userType
        }
        
        const result = await registerUser(userData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          // Redirect to login page with success message
          window.location.href = '/auth/login?message=check_email'
        }
      } else {
        // Register business with business information
        const businessData = {
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          businessName: formData.businessName,
          location: formData.location,
          website: formData.website,
          role: userType
        }
        
        const result = await registerBusiness(businessData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          // Redirect to login page with success message
          window.location.href = '/auth/login?message=check_email'
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Progress bar component
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
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: step === 1 ? '50%' : '100%' }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Step 1 of 2</span>
        <span>{step === 1 ? '50%' : '100%'}</span>
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
            {/* Progress Bar */}
            <ProgressBar />
            
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
            
            {/* User Type Selector */}
            <div className="flex gap-3 mb-6 p-1 bg-muted rounded-lg">
              {(["user", "business"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setUserType(type)
                    setStep(1)
                    setError(null)
                    setSuccess(null)
                    // Reset form data when switching user types
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      fullName: "",
                      businessName: "",
                      location: "",
                      website: ""
                    })
                  }}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                    userType === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "user" ? "User" : "Business"}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              {step === 1 ? (
                <>
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
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="••••••••" 
                      className="mt-2" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      At least 6 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password" 
                      placeholder="••••••••" 
                      className="mt-2" 
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={handleContinue}
                    disabled={isLoading}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      {userType === "user" ? "Full Name" : "Contact Person Name"}
                    </Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      placeholder="John Doe" 
                      className="mt-2" 
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  
                  {userType === "business" && (
                    <>
                      <div>
                        <Label htmlFor="businessName" className="text-sm font-medium">
                          Business Name
                        </Label>
                        <Input 
                          id="businessName" 
                          name="businessName"
                          placeholder="Acme Inc." 
                          className="mt-2" 
                          value={formData.businessName}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location" className="text-sm font-medium">
                          Location
                        </Label>
                        <Input 
                          id="location" 
                          name="location"
                          placeholder="New York, NY" 
                          className="mt-2" 
                          value={formData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website" className="text-sm font-medium">
                          Website
                        </Label>
                        <Input 
                          id="website" 
                          name="website"
                          type="url"
                          placeholder="https://example.com" 
                          className="mt-2" 
                          value={formData.website}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" className="mt-1" required />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the Terms of Service and <Link href="/terms">Privacy Policy</Link>
                    </Label>
                  </div>
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-transparent" 
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
