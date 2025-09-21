// Excel import/export utilities
import * as XLSX from "xlsx"
import type { Property } from "./types"

// Column mapping for Excel files
const EXCEL_COLUMNS = {
  "Property Type": "propertyType",
  "Kothi Number": "kothiNumber",
  "Plot Number": "plotNumber",
  Project: "project",
  Floor: "floor",
  BHK: "bhk",
  "Commercial Type": "commercialType",
  Area: "area",
  "Sector/Phase": "sectorPhase",
  "Plot Size": "plotSize",
  Marla: "marla",
  PLC: "plc",
  Road: "road",
  "CP Name": "cpName",
  "Contact Number": "contactNumber",
  "CP Firm Name": "cpFirmName",
  Demand: "demand",
  Expectations: "expectations",
  Date: "date",
  Facing: "facing",
}

// Export properties to Excel
export function exportToExcel(properties: Property[], filename = "properties.xlsx") {
  // Transform properties to Excel format
  const excelData = properties.map((property) => {
    const row: any = {}

    // Map all fields to Excel columns
    Object.entries(EXCEL_COLUMNS).forEach(([excelCol, propKey]) => {
      row[excelCol] = (property as any)[propKey] || ""
    })

    return row
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Set column widths
  const colWidths = [
    { wch: 15 }, // Property Type
    { wch: 12 }, // Kothi Number
    { wch: 12 }, // Plot Number
    { wch: 20 }, // Project
    { wch: 8 }, // Floor
    { wch: 8 }, // BHK
    { wch: 15 }, // Commercial Type
    { wch: 10 }, // Area
    { wch: 15 }, // Sector/Phase
    { wch: 12 }, // Plot Size
    { wch: 8 }, // Marla
    { wch: 10 }, // PLC
    { wch: 15 }, // Road
    { wch: 20 }, // CP Name
    { wch: 15 }, // Contact Number
    { wch: 20 }, // CP Firm Name
    { wch: 15 }, // Demand
    { wch: 30 }, // Expectations
    { wch: 12 }, // Date
    { wch: 12 }, // Facing
  ]
  ws["!cols"] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Properties")

  // Save file
  XLSX.writeFile(wb, filename)
}

// Import properties from Excel
export function importFromExcel(file: File): Promise<Omit<Property, "id">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        console.log("[v0] Workbook sheets:", workbook.SheetNames)

        // Get first worksheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        console.log("[v0] Worksheet range:", worksheet["!ref"])

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Get raw array data first
          defval: "", // Default value for empty cells
        })

        console.log("[v0] Raw sheet data (first 3 rows):", jsonData.slice(0, 3))

        if (jsonData.length === 0) {
          reject(new Error("The Excel file is empty or has no data rows"))
          return
        }

        const headers = jsonData[0] as string[]
        const dataRows = jsonData.slice(1) as any[][]

        console.log("[v0] Headers found:", headers)
        console.log("[v0] Data rows count:", dataRows.length)

        if (dataRows.length === 0) {
          reject(new Error("No data rows found in Excel file"))
          return
        }

        const objectData = dataRows.map((row, index) => {
          const obj: any = {}
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              obj[header.toString().trim()] = row[colIndex]
            }
          })
          console.log(`[v0] Row ${index + 2} converted:`, obj)
          return obj
        })

        console.log("[v0] Converted to objects:", objectData.length, "rows")

        // Transform to Property objects
        const properties: Omit<Property, "id">[] = objectData.map((row: any, index: number) => {
          console.log(`[v0] Processing row ${index + 2}:`, row)

          const property: any = {}

          Object.entries(EXCEL_COLUMNS).forEach(([excelCol, propKey]) => {
            let value = undefined

            // Try exact match first
            if (row[excelCol] !== undefined) {
              value = row[excelCol]
            } else {
              // Try case-insensitive and trimmed match
              const foundKey = Object.keys(row).find(
                (key) => key.toLowerCase().trim() === excelCol.toLowerCase().trim(),
              )
              if (foundKey) {
                value = row[foundKey]
              }
            }

            if (value !== undefined && value !== "" && value !== null) {
              property[propKey] = String(value).trim()
            }
          })

          if (!property.date) {
            property.date = new Date().toISOString().split("T")[0]
          }

          if (property.propertyType) {
            const normalizedType = property.propertyType.toLowerCase().trim()
            if (normalizedType === "kothi") property.propertyType = "Kothi"
            else if (normalizedType === "flat") property.propertyType = "Flat"
            else if (normalizedType === "commercial") property.propertyType = "Commercial"
            else if (normalizedType === "plot") property.propertyType = "Plot"
          }

          console.log(`[v0] Processed property ${index + 2}:`, property)
          return property as Omit<Property, "id">
        })

        console.log("[v0] Total properties processed:", properties.length)

        const validProperties = properties.filter((p, index) => {
          const hasPropertyType = p.propertyType && ["Kothi", "Flat", "Commercial", "Plot"].includes(p.propertyType)

          if (!hasPropertyType) {
            console.log(`[v0] Row ${index + 2} filtered out - missing or invalid property type:`, p.propertyType)
            console.log(`[v0] Available keys in row:`, Object.keys(p))
          }

          return hasPropertyType
        })

        console.log(`[v0] Valid properties after filtering: ${validProperties.length} out of ${properties.length}`)

        if (validProperties.length === 0) {
          const sampleRow = properties[0] || {}
          const availableKeys = Object.keys(sampleRow)
          reject(
            new Error(
              `No valid properties found. Please ensure your Excel file has a 'Property Type' column with values: Kothi, Flat, Commercial, or Plot. 
              
Found ${properties.length} rows but none had valid property types.
Available columns in your file: ${availableKeys.join(", ")}
Expected 'Property Type' column with one of: Kothi, Flat, Commercial, Plot`,
            ),
          )
          return
        }

        resolve(validProperties)
      } catch (error) {
        console.error("[v0] Excel parsing error:", error)
        reject(
          new Error(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}. Please check the format and ensure it's a valid Excel file.`,
          ),
        )
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Generate Excel template
export function downloadTemplate() {
  const templateData = [
    {
      "Property Type": "Kothi",
      "Kothi Number": "123",
      "Plot Number": "",
      Project: "",
      Floor: "",
      BHK: "",
      "Commercial Type": "",
      Area: "",
      "Sector/Phase": "Sector 1",
      "Plot Size": "200 sq yards",
      Marla: "5",
      PLC: "10%",
      Road: "30 feet",
      "CP Name": "John Doe",
      "Contact Number": "9876543210",
      "CP Firm Name": "ABC Realty",
      Demand: "50 Lakh",
      Expectations: "Ready to move",
      Date: new Date().toISOString().split("T")[0],
      Facing: "North",
    },
    {
      "Property Type": "Flat",
      "Kothi Number": "",
      "Plot Number": "",
      Project: "Green Valley Apartments",
      Floor: "3",
      BHK: "3BHK",
      "Commercial Type": "",
      Area: "",
      "Sector/Phase": "Sector 2",
      "Plot Size": "1200 sq ft",
      Marla: "3",
      PLC: "5%",
      Road: "24 feet",
      "CP Name": "Jane Smith",
      "Contact Number": "9876543211",
      "CP Firm Name": "XYZ Properties",
      Demand: "35 Lakh",
      Expectations: "Immediate possession",
      Date: new Date().toISOString().split("T")[0],
      Facing: "East",
    },
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(templateData)

  // Set column widths
  const colWidths = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
  ]
  ws["!cols"] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, "Properties Template")
  XLSX.writeFile(wb, "properties_template.xlsx")
}
