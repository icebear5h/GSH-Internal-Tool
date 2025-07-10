"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileIcon } from "./file-icons"
import { Download, AlertTriangle, Bug, X, RefreshCw } from "lucide-react"
import * as XLSX from "xlsx"
import { diagnosePDFIssues, generateAlternativePDFUrls } from "@/lib/pdf-debug" // Import the debug utilities

export interface FileViewerProps {
  /** Unique document identifier to fetch metadata and signed URL */
  fileId: string
  /** Optional pre-fetched signed URL; if omitted, viewer will fetch from `/api/files/:id` */
  fileUrl?: string
  /** Callback to close the viewer */
  onClose: () => void
  /** Callback invoked with the signed URL to download the file */
  onDownload: (url: string) => void

  projectId: string
}

export function FileViewer({ fileId, fileUrl: initialUrl, onClose, onDownload, projectId }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialUrl)
  const [fileMetadata, setFileMetadata] = useState<any>(null) // To store name, size, type etc.
  const [debugMode, setDebugMode] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [pdfIssues, setPdfIssues] = useState<string[]>([])
  const [alternativePdfUrls, setAlternativePdfUrls] = useState<Record<string, string> | null>(null)

  // Fetch signed URL and metadata from backend if not provided or on reload
  useEffect(() => {
    async function fetchFileDetails() {
      setIsReloading(true)
      try {
        const response = await fetch(`/api/projects/${projectId}/files/${encodeURIComponent(fileId)}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setFileUrl(data.downloadUrl)
        setFileMetadata(data.metadata) // Assuming API returns metadata
      } catch (error) {
        console.error("Error fetching file details:", error)
        setFileUrl(undefined)
        setFileMetadata(null)
      } finally {
        setIsReloading(false)
      }
    }

    if (!fileUrl || isReloading) {
      // Fetch if no URL or explicitly reloading
      fetchFileDetails()
    }
  }, [fileId, fileUrl, isReloading])

  // Diagnose PDF issues when fileUrl is available and it's a PDF
  useEffect(() => {
    if (fileUrl && fileMetadata?.mimeType === "application/pdf") {
      diagnosePDFIssues(fileUrl).then(setPdfIssues)
      setAlternativePdfUrls(generateAlternativePDFUrls(fileUrl))
    } else {
      setPdfIssues([])
      setAlternativePdfUrls(null)
    }
  }, [fileUrl, fileMetadata?.mimeType])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleReload = () => {
    setIsReloading(true)
    setFileUrl(undefined) // Clear URL to force re-fetch
  }

  const renderPreview = () => {
    if (isReloading)
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
      )

    if (!fileUrl) return <NoPreview type={fileMetadata?.mimeType || "unknown"} />

    // Determine file type from mimeType or URL extension
    const mimeType = fileMetadata?.mimeType?.toLowerCase() || fileUrl.split(".").pop()?.toLowerCase() || ""

    if (mimeType.includes("pdf")) return <iframe src={fileUrl} className="w-full h-full" />
    if (mimeType.startsWith("image/"))
      return (
        <img
          src={fileUrl || "/placeholder.svg"}
          className="max-w-full max-h-full object-contain mx-auto"
          alt={fileMetadata?.name || "Image preview"}
        />
      )
    if (
      mimeType.startsWith("text/") ||
      mimeType.includes("json") ||
      mimeType.includes("xml") ||
      mimeType.includes("csv")
    )
      return <iframe src={fileUrl} className="w-full h-full border-0" />
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <ExcelViewer src={fileUrl} />
    if (mimeType.includes("presentation"))
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          className="w-full h-full"
        />
      )

    return <NoPreview type={mimeType} />
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.currentTarget === e.target && onClose()}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <FileIcon type="file" mimeType={fileMetadata?.mimeType} size="md" />
            <h2 className="text-lg font-semibold truncate">{fileMetadata?.name || "Document Viewer"}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setDebugMode(!debugMode)}>
              <Bug className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileUrl && onDownload(fileUrl)}
              disabled={!fileUrl || isReloading}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {debugMode && (
          <div className="p-4 border-b bg-gray-50">
            <Alert className="mb-2">
              <Bug className="mr-2" />
              <AlertDescription>
                <div>File ID: {fileId}</div>
                <div>URL: {fileUrl || "loading…"}</div>
                <div>Mime Type: {fileMetadata?.mimeType || "unknown"}</div>
                <div>Size: {fileMetadata?.size ? `${(fileMetadata.size / 1024).toFixed(2)} KB` : "unknown"}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReload}
                  disabled={isReloading}
                  className="mt-2 bg-transparent"
                >
                  {isReloading ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                  {isReloading ? "Reloading…" : "Reload URL"}
                </Button>
              </AlertDescription>
            </Alert>
            {fileMetadata?.mimeType === "application/pdf" && pdfIssues.length > 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="mr-2" />
                <AlertDescription>
                  <h4 className="font-semibold mb-1">PDF Loading Issues:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {pdfIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                  {alternativePdfUrls && (
                    <div className="mt-2">
                      <h5 className="font-semibold text-xs mb-1">Try alternative viewers:</h5>
                      <ul className="list-disc list-inside text-xs">
                        {Object.entries(alternativePdfUrls).map(([name, url]) => (
                          <li key={name}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600 hover:text-blue-800"
                            >
                              {name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">{renderPreview()}</div>
      </div>
    </div>
  )
}

const NoPreview: React.FC<{ type: string }> = ({ type }) => (
  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold">No preview available</h3>
    <p className="text-sm">Cannot preview files of type: {type || "unknown"}.</p>
    <p className="text-sm">Please download the file to view its content.</p>
  </div>
)

const ExcelViewer: React.FC<{ src: string }> = ({ src }) => {
  const [sheets, setSheets] = useState<string[]>([])
  const [active, setActive] = useState<string>("")
  const [htmlMap, setHtmlMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`)
        return r.arrayBuffer()
      })
      .then((data) => {
        const wb = XLSX.read(data, { type: "array", cellStyles: true })
        const names = wb.SheetNames
        setSheets(names)
        const map: Record<string, string> = {}
        names.forEach((n) => {
          map[n] = XLSX.utils.sheet_to_html(wb.Sheets[n], { id: n, editable: false })
        })
        setHtmlMap(map)
        setActive(names[0] || "")
      })
      .catch((e) => {
        console.error("Error loading Excel file:", e)
        setError(`Failed to load Excel file: ${e.message}`)
      })
      .finally(() => setLoading(false))
  }, [src])

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    )
  if (error)
    return (
      <div className="h-full flex items-center justify-center text-center text-red-600">
        <AlertTriangle className="w-8 h-8 mr-2" />
        {error}
      </div>
    )
  if (!sheets.length) return <NoPreview type="excel" />

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b overflow-x-auto">
        {sheets.map((name) => (
          <button
            key={name}
            onClick={() => setActive(name)}
            className={`px-4 py-2 whitespace-nowrap ${name === active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="overflow-auto flex-1 p-4" dangerouslySetInnerHTML={{ __html: htmlMap[active] }} />
    </div>
  )
}
