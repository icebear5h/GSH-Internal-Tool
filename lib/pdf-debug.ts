export const diagnosePDFIssues = async (fileUrl: string) => {
  const issues: string[] = []

  try {
    // Test 1: Check if URL is accessible
    const response = await fetch(fileUrl, { method: "HEAD" })

    if (!response.ok) {
      issues.push(`HTTP Error: ${response.status} ${response.statusText}`)
    }

    // Test 2: Check content type
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/pdf")) {
      issues.push(`Invalid content type: ${contentType} (expected application/pdf)`)
    }

    // Test 3: Check content length
    const contentLength = response.headers.get("content-length")
    if (contentLength === "0") {
      issues.push("File is empty (0 bytes)")
    }

    // Test 4: Check CORS headers
    const corsHeader = response.headers.get("access-control-allow-origin")
    if (!corsHeader && window.location.origin !== new URL(fileUrl).origin) {
      issues.push("CORS policy may block PDF loading")
    }
  } catch (error) {
    issues.push(`Network error: ${error}`)
  }

  return issues
}

export const generateAlternativePDFUrls = (originalUrl: string) => {
  return {
    direct: originalUrl,
    googleViewer: `https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}&embedded=true`,
    mozillaViewer: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(originalUrl)}`,
    withParams: `${originalUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`,
  }
}
