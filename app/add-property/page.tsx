import PropertyForm from "@/components/property-form"
import { BackButton } from "@/components/ui/back-button"

export default function AddPropertyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/properties" label="Back to Properties" />
        <PropertyForm />
      </div>
    </div>
  )
}
