"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { bulkAddProperties } from "@/lib/firebase-operations"
import { importFromExcel, downloadTemplate } from "@/lib/excel-utils"
import type { Property } from "@/lib/types"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ExcelImport() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<Omit<Property, "id">[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [totalProperties, setTotalProperties] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setErrors([])
    setPreviewData([])
    setTotalProperties(0)

    try {
      console.log("[v0] Processing Excel file:", selectedFile.name)
      const properties = await importFromExcel(selectedFile)
      console.log("[v0] Parsed properties:", properties.length)

      if (properties.length === 0) {
        toast({
          title: "No data found",
          description: "The Excel file appears to be empty or has no valid data rows",
          variant: "destructive",
        })
        return
      }

      setTotalProperties(properties.length)
      setPreviewData(properties.slice(0, 5)) // Show first 5 for preview

      const validationErrors: string[] = []
      properties.forEach((property, index) => {
        const rowNum = index + 2 // Excel row number (accounting for header)

        if (!property.propertyType) {
          validationErrors.push(`Row ${rowNum}: Property Type is required`)
        } else if (!["Kothi", "Flat", "Commercial", "Plot"].includes(property.propertyType)) {
          validationErrors.push(
            `Row ${rowNum}: Invalid Property Type '${property.propertyType}'. Must be: Kothi, Flat, Commercial, or Plot`,
          )
        }

        if (!property.sectorPhase) {
          console.log(`[v0] Warning - Row ${rowNum}: Missing Sector/Phase`)
        }

        if (!property.cpName) {
          console.log(`[v0] Warning - Row ${rowNum}: Missing CP Name`)
        }

        if (!property.contactNumber) {
          console.log(`[v0] Warning - Row ${rowNum}: Missing Contact Number`)
        }

        // Type-specific validation - only for critical fields
        if (property.propertyType === "Flat" && !property.project) {
          validationErrors.push(`Row ${rowNum}: Project is required for Flat properties`)
        }
      })

      setErrors(validationErrors)

      if (validationErrors.length === 0) {
        toast({
          title: "File validated successfully",
          description: `Found ${properties.length} valid properties ready for import`,
        })
      } else {
        toast({
          title: "Validation issues found",
          description: `Found ${validationErrors.length} errors that need to be fixed`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error processing Excel file:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to read Excel file"
      toast({
        title: "Error reading file",
        description: errorMessage,
        variant: "destructive",
      })

      setErrors([errorMessage])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      console.log("[v0] Starting import process")
      const properties = await importFromExcel(file)

      const validProperties = properties.filter((p) => p.propertyType)

      if (validProperties.length === 0) {
        throw new Error(
          "No valid properties found. Please ensure your Excel file has a 'Property Type' column with valid values (Kothi, Flat, Commercial, Plot)",
        )
      }

      console.log("[v0] Importing", validProperties.length, "valid properties")

      const batchSize = 5 // Reduced batch size for better reliability
      const batches = []
      for (let i = 0; i < validProperties.length; i += batchSize) {
        batches.push(validProperties.slice(i, i + batchSize))
      }

      for (let i = 0; i < batches.length; i++) {
        console.log("[v0] Processing batch", i + 1, "of", batches.length)
        await bulkAddProperties(batches[i])
        setProgress(((i + 1) / batches.length) * 100)

        // Small delay between batches to avoid overwhelming Firebase
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      toast({
        title: "Import successful",
        description: `Successfully imported ${validProperties.length} properties`,
      })

      // Reset form
      setFile(null)
      setPreviewData([])
      setErrors([])
      setTotalProperties(0)

      // Navigate to properties page
      router.push("/properties")
    } catch (error) {
      console.error("[v0] Import error:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import properties",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Import Properties</h1>
          <p className="text-muted-foreground">Upload an Excel file to import multiple properties at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Excel File
              </CardTitle>
              <CardDescription>Select an Excel file (.xlsx or .xls) containing property data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="excel-file">Excel File</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </div>

              {file && (
                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription>
                    File selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    {totalProperties > 0 && ` - Found ${totalProperties} properties`}
                  </AlertDescription>
                </Alert>
              )}

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Validation Errors ({errors.length}):</div>
                    <ul className="list-disc list-inside space-y-1 text-sm max-h-32 overflow-y-auto">
                      {errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {errors.length > 10 && <li>... and {errors.length - 10} more errors</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Importing properties... {Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!file || importing || errors.length > 0} className="flex-1">
                  {importing ? `Importing... ${Math.round(progress)}%` : "Import Properties"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Excel Template
              </CardTitle>
              <CardDescription>Download a template file to see the required format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  The template includes sample data for different property types (Kothi, Flat, Commercial, Plot) with
                  all required fields properly formatted.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Required Fields:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Property Type (Kothi, Flat, Commercial, Plot)</li>
                  <li>• Sector/Phase</li>
                  <li>• Plot Size, Marla, PLC, Road</li>
                  <li>• CP Name, Contact Number, CP Firm Name</li>
                  <li>• Demand, Date, Facing</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Type-Specific Fields:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Kothi: Kothi Number</li>
                  <li>• Plot: Plot Number</li>
                  <li>• Flat: Project, Floor, BHK</li>
                  <li>• Commercial: Commercial Type, Area</li>
                </ul>
              </div>

              <Button onClick={downloadTemplate} variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        {previewData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                First 5 rows from your Excel file (showing {previewData.length} of {totalProperties} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Sector/Phase</th>
                      <th className="text-left p-2">CP Name</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Demand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((property, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{property.propertyType}</td>
                        <td className="p-2">{property.sectorPhase}</td>
                        <td className="p-2">{property.cpName}</td>
                        <td className="p-2">{property.contactNumber}</td>
                        <td className="p-2">{property.demand}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
