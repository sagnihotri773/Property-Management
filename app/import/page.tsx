import ExcelImport from "@/components/excel-import"
import { BackButton } from "@/components/ui/back-button"

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/" label="Back to Dashboard" />
        <ExcelImport />
      </div>
    </div>
  )
}
