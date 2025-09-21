"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import PropertyForm from "@/components/property-form"
import { getPropertyById } from "@/lib/firebase-operations"
import type { Property } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/ui/back-button"

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const id = params.id as string
        if (!id) {
          toast({
            title: "Error",
            description: "Property ID is required",
            variant: "destructive",
          })
          router.push("/properties")
          return
        }

        const propertyData = await getPropertyById(id)
        if (!propertyData) {
          toast({
            title: "Error",
            description: "Property not found",
            variant: "destructive",
          })
          router.push("/properties")
          return
        }

        setProperty(propertyData)
      } catch (error) {
        console.error("Error loading property:", error)
        toast({
          title: "Error",
          description: "Failed to load property",
          variant: "destructive",
        })
        router.push("/properties")
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [params.id, router, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/properties" label="Back to Properties" />
        <PropertyForm initialData={property} isEditing={true} />
      </div>
    </div>
  )
}
