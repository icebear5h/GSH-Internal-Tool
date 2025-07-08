"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileIcon } from "./file-icons"
import { Download, AlertTriangle, Bug, RefreshCw, Eye, X } from "lucide-react"
import * as XLSX from 'xlsx'

interface FileViewerProps {
  fileName: string
  fileSize: number
  fileType: string
  createdDate: string
  modifiedDate: string
  fileUrl: string
  onClose: () => void
  onDownload: () => void
}

export function FileViewer({
  fileName,
  fileSize,
  fileType,
  createdDate,
  modifiedDate,
  fileUrl,
  onClose,
  onDownload,
}: FileViewerProps) {
  const [debugMode, setDebugMode] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  // Early return if no URL
  if (!fileUrl) return null

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const handleReload = async () => {
    setIsReloading(true)
    await new Promise((r) => setTimeout(r, 500))
    setIsReloading(false)
  }

  const safeFileType = fileType.toLowerCase()
  const isCorrupted = fileSize === 0
  const isPDF = safeFileType.includes('pdf')
  const isImage = safeFileType.startsWith('image/')
  const isText = safeFileType.startsWith('text/') || safeFileType.includes('json')
  const isExcel = safeFileType.includes('spreadsheetml')
  const isPptx = safeFileType.includes('presentation')

  const renderContent = () => {
    if (isCorrupted) return <Corrupted />
    if (isPDF) return <iframe src={fileUrl} className="w-full h-full" />
    if (isImage) return <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain" />
    if (isText) return <iframe src={fileUrl} className="w-full h-full border-0" />
    if (isExcel) return <ExcelViewer src={fileUrl} />
    if (isPptx) return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="w-full h-full" />
    return <NoPreview type={safeFileType} />
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.currentTarget === e.target && onClose()}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <FileIcon type="file" mimeType={safeFileType} size="md" />
            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setDebugMode(!debugMode)}>
              <Bug />
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} disabled={isCorrupted}>
              <Download />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X />
            </Button>
          </div>
        </div>
        {debugMode && (
          <div className="p-4 border-b">
            <Alert>
              <Bug className="mr-2" />
              <AlertDescription>
                <div>Size: {formatFileSize(fileSize)}</div>
                <div>Type: {fileType}</div>
                <div>URL: {fileUrl}</div>
                <div>Created: {formatDate(createdDate)}</div>
                <div>Modified: {formatDate(modifiedDate)}</div>
                <Button size="sm" variant="outline" onClick={handleReload}>
                  {isReloading ? <RefreshCw className="animate-spin" /> : 'Reload'}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="flex-1 p-4 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

const Corrupted = () => (
  <div className="h-full flex items-center justify-center text-center p-4">
    <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto" />
    <div>
      <h3 className="font-semibold">Corrupted file</h3>
      <p>This file is 0 bytes.</p>
    </div>
  </div>
)

const NoPreview: React.FC<{ type: string }> = ({ type }) => (
  <div className="h-full flex items-center justify-center text-center p-4">
    <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto" />
    <div>
      <h3>No preview</h3>
      <p>Cannot preview files of type {type}.</p>
    </div>
  </div>
)

const ExcelViewer: React.FC<{ src: string }> = ({ src }) => {
  const [sheets, setSheets] = useState<string[]>([])
  const [active, setActive] = useState<string>('')
  const [htmlMap, setHtmlMap] = useState<Record<string,string>>({})

  useEffect(() => {
    fetch(src)
      .then(r=>r.arrayBuffer())
      .then(data=>{
        const wb = XLSX.read(data, { type:'array', cellStyles:true })
        const names = wb.SheetNames
        setSheets(names)
        const map: Record<string,string> = {}
        names.forEach(n=>{ map[n] = XLSX.utils.sheet_to_html(wb.Sheets[n], { id:n, editable:false }) })
        setHtmlMap(map)
        setActive(names[0] || '')
      })
  }, [src])

  if(!sheets.length) return <div>Loading...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b">
        {sheets.map(name=>(
          <button key={name} onClick={()=>setActive(name)} className={`px-4 py-2 ${name===active? 'border-b-2':''}`}>
            {name}
          </button>
        ))}
      </div>
      <div className="overflow-auto flex-1 p-4" dangerouslySetInnerHTML={{ __html: htmlMap[active] }} />
    </div>
  )
}
