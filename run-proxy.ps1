# run-proxy.ps1 - Servidor y Proxy Local para AdViral AI Studio
# No requiere Node.js, Python o dependencias externas. Ejecutar en PowerShell.

# Asegurar que se imprima la salida en UTF8 para compatibilidad
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Error "No se pudo iniciar el servidor en el puerto $port. Asegúrate de ejecutar esta consola en una ventana nueva y cerrar otras instancias del proxy."
    Write-Host "Intenta cerrar procesos en el puerto 3000 o ejecuta: Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess" -ForegroundColor Yellow
    exit
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AdViral AI Studio - Servidor Proxy Local Activo" -ForegroundColor Green
Write-Host "  Dirección: http://localhost:$port/" -ForegroundColor White
Write-Host "  Presiona Ctrl+C en esta consola para detener el servidor." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Definir Tipos MIME
$mimeTable = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico"  = "image/x-icon"
}

# Cargar ensamblados .NET requeridos para peticiones
[void][System.Reflection.Assembly]::LoadWithPartialName("System.Net.Http")

# Loop del Servidor
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Cabeceras CORS robustas
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, x-anthropic-key, x-deepseek-key, x-api-key, Authorization")

        # Manejar OPTIONS (Pre-flight) para navegadores
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.RawUrl
        # Ignorar consultas favicon repetitivas
        if ($rawUrl -eq "/favicon.ico") {
            $response.StatusCode = 404
            $response.Close()
            continue
        }

        Write-Host "[$($request.HttpMethod)] $rawUrl" -ForegroundColor Gray

        # --- ROUTING ---
        if ($rawUrl -match "^/api/anthropic") {
            # --- PROXY ANTHROPIC ---
            
            # Obtener API Key de las cabeceras personalizadas
            $apiKey = $request.Headers["x-anthropic-key"]
            if ([string]::IsNullOrEmpty($apiKey)) {
                $apiKey = $request.Headers["x-api-key"]
            }

            if ([string]::IsNullOrEmpty($apiKey)) {
                $response.StatusCode = 400
                $response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Falta la API Key de Anthropic en las cabeceras de AdViral (x-anthropic-key)"}')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            try {
                # Forzar TLS 1.2 para evitar fallos de conexión SSL/TLS en Windows PowerShell antiguo
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
                
                $client = New-Object System.Net.Http.HttpClient
                $client.DefaultRequestHeaders.Add("x-api-key", $apiKey)
                $client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01")
                
                # Tiempo de espera extendido para guiones largos
                $client.Timeout = [System.TimeSpan]::FromSeconds(90)
                
                if ($rawUrl -match "/models") {
                    Write-Host " -> Consultando lista de modelos de Anthropic..." -ForegroundColor DarkYellow
                    $apiResponse = $client.GetAsync("https://api.anthropic.com/v1/models").Result
                } else {
                    Write-Host " -> Redirigiendo petición a Anthropic Messages API..." -ForegroundColor DarkYellow
                    # Leer el cuerpo enviado por el cliente
                    $reader = New-Object System.IO.StreamReader($request.InputStream)
                    $requestBody = $reader.ReadToEnd()
                    $reader.Close()
                    $content = New-Object System.Net.Http.StringContent($requestBody, [System.Text.Encoding]::UTF8, "application/json")
                    $apiResponse = $client.PostAsync("https://api.anthropic.com/v1/messages", $content).Result
                }
                
                $responseBody = $apiResponse.Content.ReadAsStringAsync().Result
                
                $response.StatusCode = [int]$apiResponse.StatusCode
                $response.ContentType = "application/json"
                
                if ($response.StatusCode -ne 200) {
                    Write-Host " -> [ERROR] Anthropic API devolvió Código: $($response.StatusCode)" -ForegroundColor Red
                    Write-Host " -> Respuesta: $responseBody" -ForegroundColor Red
                } else {
                    Write-Host " -> Respuesta exitosa de Anthropic (200 OK)" -ForegroundColor Green
                }
                
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $errMessage = if ($_.Exception.InnerException) { $_.Exception.InnerException.Message } else { $_.Exception.Message }
                Write-Host " -> [ERROR GRAVE] Falló la petición a Anthropic: $errMessage" -ForegroundColor Red
                
                $response.StatusCode = 500
                $response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Falló la petición proxy a Anthropic: ' + $errMessage.Replace('"', '\"') + '"}')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()

        } elseif ($rawUrl -match "^/api/deepseek") {
            # --- PROXY DEEPSEEK ---
            
            # Obtener API Key
            $apiKey = $request.Headers["x-deepseek-key"]
            if ([string]::IsNullOrEmpty($apiKey)) {
                $authHeader = $request.Headers["Authorization"]
                if ($authHeader -match "Bearer\s+(.*)") {
                    $apiKey = $Matches[1]
                }
            }

            if ([string]::IsNullOrEmpty($apiKey)) {
                $response.StatusCode = 400
                $response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Falta la API Key de DeepSeek en las cabeceras de AdViral (x-deepseek-key)"}')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            try {
                # Forzar TLS 1.2
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

                $client = New-Object System.Net.Http.HttpClient
                $client.DefaultRequestHeaders.Add("Authorization", "Bearer $apiKey")
                $client.Timeout = [System.TimeSpan]::FromSeconds(90)
                
                if ($rawUrl -match "/models") {
                    Write-Host " -> Consultando lista de modelos de DeepSeek..." -ForegroundColor DarkCyan
                    $apiResponse = $client.GetAsync("https://api.deepseek.com/models").Result
                } else {
                    Write-Host " -> Redirigiendo petición a DeepSeek Chat API..." -ForegroundColor DarkCyan
                    # Leer el cuerpo de la petición
                    $reader = New-Object System.IO.StreamReader($request.InputStream)
                    $requestBody = $reader.ReadToEnd()
                    $reader.Close()
                    $content = New-Object System.Net.Http.StringContent($requestBody, [System.Text.Encoding]::UTF8, "application/json")
                    $apiResponse = $client.PostAsync("https://api.deepseek.com/chat/completions", $content).Result
                }
                
                $responseBody = $apiResponse.Content.ReadAsStringAsync().Result
                
                $response.StatusCode = [int]$apiResponse.StatusCode
                $response.ContentType = "application/json"
                
                if ($response.StatusCode -ne 200) {
                    Write-Host " -> [ERROR] DeepSeek API devolvió Código: $($response.StatusCode)" -ForegroundColor Red
                    Write-Host " -> Respuesta: $responseBody" -ForegroundColor Red
                } else {
                    Write-Host " -> Respuesta exitosa de DeepSeek (200 OK)" -ForegroundColor Green
                }
                
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $errMessage = if ($_.Exception.InnerException) { $_.Exception.InnerException.Message } else { $_.Exception.Message }
                Write-Host " -> [ERROR GRAVE] Falló la petición a DeepSeek: $errMessage" -ForegroundColor Red
                
                $response.StatusCode = 500
                $response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Falló la petición proxy a DeepSeek: ' + $errMessage.Replace('"', '\"') + '"}')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()

        } else {
            # --- SERVIR ARCHIVOS ESTÁTICOS ---
            # Limpiar los parámetros query string si existen (ej. ?v=1)
            $filePath = $rawUrl.Split('?')[0]
            if ($filePath -eq "/") { $filePath = "/index.html" }
            
            # Formatear la ruta de archivo localmente en Windows
            $cleanedPath = $filePath.Replace("/", "\")
            $localPath = Join-Path $PSScriptRoot $cleanedPath
            
            if (Test-Path $localPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $mime = $mimeTable[$ext]
                if ($null -eq $mime) { $mime = "application/octet-stream" }
                
                $response.ContentType = $mime
                $response.StatusCode = 200
                $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.AddHeader("Pragma", "no-cache")
                $response.AddHeader("Expires", "0")
                
                $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
                $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
            } else {
                Write-Host " -> 404 No encontrado: $localPath" -ForegroundColor Red
                $response.StatusCode = 404
                $response.ContentType = "text/plain; charset=utf-8"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Archivo no encontrado: El servidor proxy no pudo encontrar el archivo solicitado.")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
        }
    } catch {
        Write-Host "Error grave procesando petición en bucle: $_" -ForegroundColor Red
    }
}