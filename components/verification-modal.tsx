'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface VerificationModalProps {
  phone: string
  onSuccess: (newPhone: string) => void
  onClose: () => void
}

export default function VerificationModal({ phone, onSuccess, onClose }: VerificationModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      // Verify OTP client-side
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'phone_change'
      })

      if (error) {
        console.error('OTP verification error:', error)
        toast.error(error.message || 'Invalid or expired code')
        setLoading(false)
        return
      }

      if (data.user) {
        toast.success('Phone number verified and updated!')
        onSuccess(phone)  // Pass the verified phone back
        onClose()
      } else {
        toast.error('Verification failed')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-sm w-full p-6">
        <h2 className="text-xl font-bold mb-2">Verify Your New Phone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          We sent a 6-digit code to <strong>{phone}</strong>
        </p>

        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="mb-6 text-center text-lg tracking-widest"
          disabled={loading}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="flex-1">
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>
    </div>
  )
}