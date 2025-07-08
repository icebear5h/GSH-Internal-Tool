import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileIcon } from "./file-icons"
import { Download, AlertTriangle, Bug, Eye, X } from "lucide-react"
import * as XLSX from 'xlsx'

export interface FileViewerProps {
  /** Unique document identifier to fetch metadata and signed URL */
  fileId: string
  /** Optional pre-fetched signed URL; if omitted, viewer will fetch from `/api/files/:id` */
  fileUrl?: string
  /** Callback to close the viewer */
  onClose: () => void
  /** Callback invoked with the signed URL to download the file */
  onDownload: (url: string) => void
}

export function FileViewer({ fileId, fileUrl: initialUrl, onClose, onDownload }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialUrl)
  const [debugMode, setDebugMode] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  // Fetch signed URL from backend if not provided
  useEffect(() => {
    if (!fileUrl) {
      fetch(`/api/files/${encodeURIComponent(fileId)}`)
        .then((res) => res.json())
        .then(({ downloadUrl }) => setFileUrl(downloadUrl))
        .catch(() => setFileUrl(undefined))
    }
  }, [fileId, fileUrl])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleReload = async () => {
    setIsReloading(true)
    setFileUrl(undefined)
    await new Promise((r) => setTimeout(r, 300))
    setIsReloading(false)
  }

  const renderPreview = () => {
    if (!fileUrl) return <div>Loading preview…</div>

    // Determine file type from URL extension
    const lower = fileUrl.toLowerCase()
    if (lower.endsWith('.pdf')) return <iframe src={fileUrl} className="w-full h-full" />
    if (lower.match(/\.(jpe?g|png|gif|webp|svg)$/)) return <img src={fileUrl} className="max-w-full max-h-full object-contain" />
    if (lower.match(/\.(txt|md|json|csv|xml|html|css)$/)) return <iframe src={fileUrl} className="w-full h-full border-0" />
    if (lower.match(/\.(xlsx?|xlsb?)$/)) return <ExcelViewer src={fileUrl} />
    if (lower.match(/\.(pptx?)$/)) return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="w-full h-full" />

    return <NoPreview />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <FileIcon type="file" mimeType="" size="md" />
            <h2 className="text-lg font-semibold truncate">Document Viewer</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setDebugMode(!debugMode)}><Bug /></Button>
            <Button variant="outline" size="sm" onClick={() => fileUrl && onDownload(fileUrl)}><Download /></Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
          </div>
        </div>
        {debugMode && (
          <div className="p-4 border-b">
            <Alert>
              <Bug className="mr-2" />
              <AlertDescription>
                <div>URL: {fileUrl || 'loading…'}</div>
                <Button size="sm" variant="outline" onClick={handleReload}>{isReloading ? 'Reloading…' : 'Reload'}</Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="flex-1 p-4 overflow-auto">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

const NoPreview = () => (
  <div className="h-full flex items-center justify-center text-center p-4">
    <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto" />
    <div><h3>No preview available</h3><p>Download to view.</p></div>
  </div>
)

const ExcelViewer: React.FC<{ src: string }> = ({ src }) => {
  const [sheets, setSheets] = useState<string[]>([])
  const [active, setActive] = useState<string>('')
  const [htmlMap, setHtmlMap] = useState<Record<string,string>>({})
  useEffect(() => {
    fetch(src).then(r=>r.arrayBuffer()).then(data=>{
      const wb = XLSX.read(data, { type:'array', cellStyles:true })
      setSheets(wb.SheetNames)
      const m: Record<string,string> = {}
      wb.SheetNames.forEach(n=> m[n]= XLSX.utils.sheet_to_html(wb.Sheets[n], { id:n, editable:false }))
      setHtmlMap(m)
      setActive(wb.SheetNames[0]||'')
    })
  }, [src])
  if(!sheets.length) return <div>Loading...</div>
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b">{sheets.map(n=><button key={n} onClick={()=>setActive(n)} className={`px-4 py-2 ${n===active?'border-b-2':''}`}>{n}</button>)}</div>
      <div className="overflow-auto flex-1 p-4" dangerouslySetInnerHTML={{ __html: htmlMap[active] }} />
    </div>
  )
}
