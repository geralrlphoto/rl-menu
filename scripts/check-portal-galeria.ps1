# Diagnóstico via Supabase REST API (PostgREST)
# Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local

$ErrorActionPreference = 'Stop'

# ── Carregar .env.local ───────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot '..\.env.local'
$envVars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$') {
    $envVars[$matches[1]] = $matches[2].Trim('"').Trim("'")
  }
}
$url = $envVars['NEXT_PUBLIC_SUPABASE_URL']
$key = $envVars['SUPABASE_SERVICE_ROLE_KEY']
if (-not $url -or -not $key) { Write-Host '✗ Faltam credenciais'; exit 1 }

$headers = @{
  'apikey' = $key
  'Authorization' = "Bearer $key"
  'Accept' = 'application/json'
}

$REF      = 'CAS_060_26_RL'
$EVENT_ID = '32922011-6d8a-8107-8932-e55b431772ba'

function Banner($t) { Write-Host ''; Write-Host ('═' * 72); Write-Host "  $t"; Write-Host ('═' * 72) }

# 1) portais
Banner "1. portais WHERE referencia ILIKE '$REF'"
try {
  $r = Invoke-RestMethod -Uri "$url/rest/v1/portais?referencia=ilike.$REF&select=*" -Headers $headers
  if ($r.Count -eq 0) { Write-Host '  ✗ Nenhuma row encontrada' }
  else {
    $p = $r[0]
    Write-Host "  id                       : $($p.id)"
    Write-Host "  referencia (col)         : $($p.referencia)"
    Write-Host "  updated_at               : $($p.updated_at)"
    $s = $p.settings
    Write-Host "  settings.galerias_url    : $($s.galerias_url)"
    Write-Host "  settings.galerias_enviada: $($s.galerias_enviada)"
    Write-Host "  settings.selecao_url     : $($s.selecao_url)"
    Write-Host "  settings.prewedding_url  : $($s.prewedding_url)"
    Write-Host "  settings.fotos_finais_url: $($s.fotos_finais_url)"
    Write-Host "  settings.maquete_url     : $($s.maquete_url)"
    if ($s.calloutLinks) {
      Write-Host "  settings.calloutLinks    : $((($s.calloutLinks | Get-Member -MemberType NoteProperty).Name) -join ', ')"
    }
  }
} catch { Write-Host "  ERRO: $($_.Exception.Message)" }

# 2) eventos_2026
Banner "2. eventos_2026 WHERE notion_id=$EVENT_ID OR id=$EVENT_ID"
try {
  $r = Invoke-RestMethod -Uri "$url/rest/v1/eventos_2026?or=(notion_id.eq.$EVENT_ID,id.eq.$EVENT_ID)&select=id,notion_id,referencia,cliente,data_evento,tipo_evento" -Headers $headers
  if ($r.Count -eq 0) { Write-Host '  ✗ Não encontrado em eventos_2026' }
  else {
    $e = $r[0]
    Write-Host "  id              : $($e.id)"
    Write-Host "  notion_id       : $($e.notion_id)"
    Write-Host "  referencia      : $($e.referencia)"
    Write-Host "  cliente         : $($e.cliente)"
    Write-Host "  data_evento     : $($e.data_evento)"
    Write-Host "  tipo_evento     : $($e.tipo_evento)"
  }
} catch { Write-Host "  ERRO: $($_.Exception.Message)" }

# 3) eventos_2026 por referência
Banner "3. eventos_2026 WHERE referencia=$REF"
try {
  $r = Invoke-RestMethod -Uri "$url/rest/v1/eventos_2026?referencia=eq.$REF&select=id,notion_id,referencia,cliente,data_evento" -Headers $headers
  if ($r.Count -eq 0) { Write-Host '  ✗ Nenhum evento com esta ref em eventos_2026' }
  else {
    $e = $r[0]
    Write-Host "  id              : $($e.id)"
    Write-Host "  notion_id       : $($e.notion_id)"
    Write-Host "  cliente         : $($e.cliente)"
  }
} catch { Write-Host "  ERRO: $($_.Exception.Message)" }

Write-Host ''
