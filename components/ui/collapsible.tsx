"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleContextType {
  open: boolean
  toggle: () => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

export function Collapsible({
  open,
  onOpenChange,
  children
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = open !== undefined
  const state = isControlled ? open : internalOpen

  const toggle = () => {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setInternalOpen(prev => !prev)
    }
  }

  return (
    <CollapsibleContext.Provider value={{ open: state, toggle }}>
      <div>{children}</div>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error("CollapsibleTrigger must be used inside Collapsible")

  return (
    <button
      type="button"
      onClick={ctx.toggle}
      className={cn("w-full text-left", className)}
    >
      {children}
    </button>
  )
}

export function CollapsibleContent({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error("CollapsibleContent must be used inside Collapsible")

  if (!ctx.open) return null

  return (
    <div className={cn("pt-1", className)}>
      {children}
    </div>
  )
}
