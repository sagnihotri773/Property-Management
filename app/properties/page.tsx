import PropertiesListing from "@/components/properties-listing"
import { BackButton } from "@/components/ui/back-button"

export default function PropertiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/" label="Back to Dashboard" />
        <PropertiesListing />
      </div>
    </div>
  )
}
