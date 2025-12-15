"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface BusinessHour {
  day: string
  openTime: string
  closeTime: string
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
]

interface BusinessHoursInputProps {
  value: string // JSON string
  onChange: (value: string) => void
}

export function BusinessHoursInput({ value, onChange }: BusinessHoursInputProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const lastValueRef = useRef<string>(value)

  // Parse initial value and update when value prop changes from parent
  useEffect(() => {
    // Only update if the value has actually changed from the parent
    if (value !== lastValueRef.current) {
      lastValueRef.current = value
      if (value) {
        try {
          const parsed = JSON.parse(value)
          const hoursArray = Object.entries(parsed).map(([day, hours]) => {
            if (typeof hours === 'string') {
              const [openTime, closeTime] = hours.split(' - ')
              return { day, openTime: openTime || '', closeTime: closeTime || '' }
            }
            return { day, openTime: '', closeTime: '' }
          })
          setBusinessHours(hoursArray)
        } catch (e) {
          // If parsing fails, initialize with empty hours
          setBusinessHours(DAYS_OF_WEEK.map(day => ({
            day,
            openTime: '',
            closeTime: ''
          })))
        }
      } else {
        // Initialize with empty hours
        setBusinessHours(DAYS_OF_WEEK.map(day => ({
          day,
          openTime: '',
          closeTime: ''
        })))
      }
    }
  }, [value]) // Run when value prop changes

  // Handle time change
  const handleTimeChange = (day: string, timeType: 'openTime' | 'closeTime', newValue: string) => {
    const updatedHours = businessHours.map(hour => 
      hour.day === day ? { ...hour, [timeType]: newValue } : hour
    )
    
    setBusinessHours(updatedHours)
    
    // Convert to JSON and notify parent
    const hoursObject: Record<string, string> = {}
    updatedHours.forEach(({ day, openTime, closeTime }) => {
      if (openTime && closeTime) {
        hoursObject[day] = `${openTime} - ${closeTime}`
      } else if (openTime || closeTime) {
        hoursObject[day] = openTime || closeTime || 'Closed'
      } else {
        hoursObject[day] = 'Closed'
      }
    })
    
    const jsonString = JSON.stringify(hoursObject)
    lastValueRef.current = jsonString
    onChange(jsonString)
  }

  const resetToDefault = () => {
    const defaultHours = [
      { day: "Monday", openTime: "08:00", closeTime: "18:00" },
      { day: "Tuesday", openTime: "08:00", closeTime: "18:00" },
      { day: "Wednesday", openTime: "08:00", closeTime: "18:00" },
      { day: "Thursday", openTime: "08:00", closeTime: "18:00" },
      { day: "Friday", openTime: "08:00", closeTime: "18:00" },
      { day: "Saturday", openTime: "09:00", closeTime: "14:00" },
      { day: "Sunday", openTime: "", closeTime: "" }
    ]
    
    setBusinessHours(defaultHours)
    
    // Convert to JSON and notify parent
    const hoursObject: Record<string, string> = {}
    defaultHours.forEach(({ day, openTime, closeTime }) => {
      if (openTime && closeTime) {
        hoursObject[day] = `${openTime} - ${closeTime}`
      } else if (openTime || closeTime) {
        hoursObject[day] = openTime || closeTime || 'Closed'
      } else {
        hoursObject[day] = 'Closed'
      }
    })
    
    const jsonString = JSON.stringify(hoursObject)
    lastValueRef.current = jsonString
    onChange(jsonString)
  }

  const clearAll = () => {
    const emptyHours = DAYS_OF_WEEK.map(day => ({
      day,
      openTime: '',
      closeTime: ''
    }))
    
    setBusinessHours(emptyHours)
    
    // Convert to JSON and notify parent
    const hoursObject: Record<string, string> = {}
    emptyHours.forEach(({ day, openTime, closeTime }) => {
      hoursObject[day] = 'Closed'
    })
    
    const jsonString = JSON.stringify(hoursObject)
    lastValueRef.current = jsonString
    onChange(jsonString)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Label className="text-sm font-medium">Business Hours</Label>
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={resetToDefault}
          >
            Default Hours
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessHours.map(({ day, openTime, closeTime }) => (
            <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <Label htmlFor={`hours-${day}`} className="w-full sm:w-24 text-sm font-medium">
                {day}
              </Label>
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full">
                <Input
                  id={`hours-${day}-open`}
                  type="time"
                  value={openTime}
                  onChange={(e) => handleTimeChange(day, 'openTime', e.target.value)}
                  className="w-full sm:w-28"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  id={`hours-${day}-close`}
                  type="time"
                  value={closeTime}
                  onChange={(e) => handleTimeChange(day, 'closeTime', e.target.value)}
                  className="w-full sm:w-28"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Leave times empty for days when you are closed. Use 24-hour format (HH:MM).
      </p>
    </div>
  )
}