"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { getAllProperties } from "@/lib/firebase-operations"
import { exportToExcel } from "@/lib/excel-utils"
import type { Property } from "@/lib/types"
import { Download, FileSpreadsheet, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"

export default function ExcelExport() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    propertyType: "all",
    sectorPhase: "all",
    dateRange: "all",
  })
  const [selectedFields, setSelectedFields] = useState({
    basic: true,
    contact: true,
    financial: true,
    additional: true,
  })

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const data = await getAllProperties()
      setProperties(data)
    } catch (error) {
      console.error("Error loading properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProperties = () => {
    let filtered = properties

    if (filters.propertyType !== "all") {
      filtered = filtered.filter((p) => p.propertyType === filters.propertyType)
    }

    if (filters.sectorPhase !== "all") {
      filtered = filtered.filter((p) => p.sectorPhase === filters.sectorPhase)
    }

    if (filters.dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (filters.dateRange) {
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter((p) => new Date(p.date) >= filterDate)
    }

    return filtered
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      const filteredProperties = getFilteredProperties()

      if (filteredProperties.length === 0) {
        toast({
          title: "No data to export",
          description: "No properties match your current filters",
          variant: "destructive",
        })
        return
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `properties_export_${timestamp}.xlsx`

      exportToExcel(filteredProperties, filename)

      toast({
        title: "Export successful",
        description: `Exported ${filteredProperties.length} properties to ${filename}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "Failed to export properties",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const getUniqueValues = (field: keyof Property) => {
    const values = properties.map((p) => p[field]).filter(Boolean)
    return [...new Set(values)] as string[]
  }

  const filteredCount = getFilteredProperties().length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Export Properties</h1>
          <p className="text-muted-foreground">Download your property data as an Excel file</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Options
              </CardTitle>
              <CardDescription>Configure your export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Label className="font-medium">Filters</Label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select
                      value={filters.propertyType}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, propertyType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="Kothi">Kothi</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Plot">Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sectorPhase">Sector/Phase</Label>
                    <Select
                      value={filters.sectorPhase}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, sectorPhase: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sectors</SelectItem>
                        {getUniqueValues("sectorPhase").map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="week">Last week</SelectItem>
                        <SelectItem value="month">Last month</SelectItem>
                        <SelectItem value="quarter">Last 3 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Export Summary */}
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Ready to export <strong>{filteredCount}</strong> properties out of {properties.length} total
                </AlertDescription>
              </Alert>

              <Button onClick={handleExport} disabled={exporting || filteredCount === 0} className="w-full">
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Info */}
          <Card>
            <CardHeader>
              <CardTitle>Export Information</CardTitle>
              <CardDescription>Details about the exported data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Included Fields:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Property Type & Type-specific details</li>
                    <li>• Location (Sector/Phase, Plot Size, etc.)</li>
                    <li>• Contact Information (CP Name, Phone, Firm)</li>
                    <li>• Financial Details (Demand, PLC)</li>
                    <li>• Additional Info (Facing, Expectations, Date)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">File Format:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Excel (.xlsx) format</li>
                    <li>• Properly formatted columns</li>
                    <li>• Ready for re-import</li>
                    <li>• Compatible with Excel, Google Sheets</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Property Breakdown:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Kothi:</span>
                      <span>{properties.filter((p) => p.propertyType === "Kothi").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flat:</span>
                      <span>{properties.filter((p) => p.propertyType === "Flat").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commercial:</span>
                      <span>{properties.filter((p) => p.propertyType === "Commercial").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plot:</span>
                      <span>{properties.filter((p) => p.propertyType === "Plot").length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
