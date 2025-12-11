// components/profile-image-upload.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  onImageUpdate?: (imageUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
  size = 'md'
}: ProfileImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, GIF, or WebP.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setImagePreview(data.imageUrl)
      onImageUpdate?.(data.imageUrl)
      toast.success(data.message)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      // Reset to previous image on error
      setImagePreview(currentImageUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async () => {
    if (!imagePreview) return

    setIsUploading(true)
    
    try {
      const response = await fetch('/api/profile/image', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove image')
      }

      setImagePreview(null)
      onImageUpdate?.(null)
      toast.success(data.message)
    } catch (error) {
      console.error('Remove error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove image')
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={imagePreview || undefined} alt="Profile picture" />
          <AvatarFallback className={textSizeClasses[size]}>
            {imagePreview ? '' : 'U'}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className={`absolute inset-0 ${sizeClasses[size]} flex items-center justify-center bg-black/50 rounded-full`}>
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        
        {imagePreview && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
      />
      
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">
          Click camera to upload
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF, WebP (max 5MB)
        </p>
      </div>
    </div>
  )
}