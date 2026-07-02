param([int]$Port = 5501)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "RPA Calculator at http://localhost:$Port/ (Ctrl+C to stop)"

$mime = @{
  ".html" = "text/html"; ".js" = "text/javascript"; ".css" = "text/css";
  ".json" = "application/json"; ".svg" = "image/svg+xml";
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
      $res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
      if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not found: $path")
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
    } finally { $res.OutputStream.Close() }
  }
} finally { $listener.Stop() }
