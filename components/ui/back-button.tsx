"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
}

export function BackButton({ href, label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className={`mb-6 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
