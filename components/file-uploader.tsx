"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFilesSelected?: (files: File[]) => void
  maxSize?: number
  acceptedFormats?: string[]
  multiple?: boolean
}

export function FileUploader({
  onFilesSelected,
  maxSize = 5242880, // 5MB
  acceptedFormats = ["pdf", "doc", "docx", "jpg", "png"],
  multiple = true,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      return ext && acceptedFormats.includes(ext) && file.size <= maxSize
    })

    if (multiple) {
      setFiles((prev) => [...prev, ...validFiles])
    } else {
      setFiles(validFiles.slice(0, 1))
    }

    onFilesSelected?.(validFiles)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors w-full",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium mb-1 text-sm sm:text-base">Drag files here or click to browse</p>
        <p className="text-xs text-muted-foreground mb-4">
          Max size: 5MB • Formats: {acceptedFormats.join(", ").toUpperCase()}
        </p>
        <input
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          accept={acceptedFormats.map((f) => `.${f}`).join(",")}
        />
        <Button asChild variant="outline" size="sm">
          <label htmlFor="file-input" className="cursor-pointer">
            Select Files
          </label>
        </Button>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} file(s) selected</p>
          {files.map((file, idx) => (
            <Card key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
