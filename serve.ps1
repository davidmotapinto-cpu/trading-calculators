# Minimal static file server for local preview (no Node/Python installed).
# ES modules need http:// (not file://) to resolve relative imports, so this
# is required just to open index.html during development. Once Node is
# available, replace this with a real dev server (e.g. Vite).
param(
  [int]$Port = 5500
)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/ (Ctrl+C to stop)"

$mime = @{
  ".html" = "text/html"; ".js" = "text/javascript"; ".css" = "text/css";
  ".json" = "application/json"; ".svg" = "image/svg+xml"; ".md" = "text/plain";
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    try {
      $path = $req.Url.LocalPath
      if ($path -eq "/") { $path = "/index.html" }
      $filePath = Join-Path $root ($path.TrimStart("/"))
      # Always disabled caching: this server only exists for active local
      # iteration, and a stale cached module/CSS file looks identical to a
      # fix "not working" — not worth the perf trade-off here.
      $res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
      $res.Headers.Add("Pragma", "no-cache")
      if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $res.ContentType = $mime[$ext]
        if (-not $res.ContentType) { $res.ContentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not found: $path")
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
    } finally {
      $res.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
}
