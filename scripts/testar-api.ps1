# Teste rapido da API: percorre o fluxo completo e mostra PASS/FAIL em cada passo.
# Uso (com a aplicacao a correr):
#   powershell -ExecutionPolicy Bypass -File .\scripts\testar-api.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\testar-api.ps1 -Base http://localhost:8081
# Cada execucao cria contas e utilizadores novos, por isso pode repetir-se sem limpar a base de dados.
param([string]$Base = "http://localhost:8081")

$ok = 0
$ko = 0

# Espera ate a API responder (o arranque do Spring demora alguns segundos)
$pronta = $false
for ($i = 0; $i -lt 30; $i++) {
  try { Invoke-WebRequest -Uri "$Base/api/ping" -UseBasicParsing | Out-Null; $pronta = $true; break }
  catch { Start-Sleep -Seconds 2 }
}
if (-not $pronta) {
  Write-Host "A API nao respondeu em $Base (60 s). Verifique se a aplicacao esta a correr." -ForegroundColor Red
  exit 1
}

function Call($method, $path, $body, $token) {
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $params = @{ Method = $method; Uri = "$Base$path"; Headers = $headers; UseBasicParsing = $true }
  if ($body) { $params.Body = ($body | ConvertTo-Json); $params.ContentType = "application/json" }
  try {
    $r = Invoke-WebRequest @params
    return @{ Status = [int]$r.StatusCode; Json = ($r.Content | ConvertFrom-Json) }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { return @{ Status = 0; Json = $null } }
    return @{ Status = [int]$resp.StatusCode; Json = $null }
  }
}

function Check($name, $actual, $expected) {
  if ($actual -eq $expected) { Write-Host "PASS  $name" -ForegroundColor Green; $script:ok++ }
  else { Write-Host "FAIL  $name (esperado $expected, obtido $actual)" -ForegroundColor Red; $script:ko++ }
}

$id = (Get-Date).ToString("HHmmssff")
$accA = "1${id}1"; $accB = "1${id}2"; $uA = "maria$id"; $uB = "joao$id"

$r = Call POST "/api/auth/login" @{ username = "admin"; password = "Admin@123" } $null
Check "Login ADMIN" $r.Status 200
$adm = $r.Json.token

$r = Call POST "/api/accounts" @{ customerName = "Maria Silva"; nuit = "123456789"; accountNumber = $accA; accountType = "ORDEM"; initialBalance = 1000; username = $uA; password = "maria123" } $adm
Check "Criar conta Maria" $r.Status 201
$r = Call POST "/api/accounts" @{ customerName = "Joao Machava"; nuit = "987654321"; accountNumber = $accB; accountType = "POUPANCA"; initialBalance = 500; username = $uB; password = "joao123" } $adm
Check "Criar conta Joao" $r.Status 201
$r = Call POST "/api/accounts" @{ customerName = "Duplicada"; nuit = "111111111"; accountNumber = $accA; accountType = "ORDEM"; initialBalance = 10; username = "dup$id"; password = "dup123" } $adm
Check "Conta duplicada (409)" $r.Status 409
$r = Call GET "/api/accounts" $null $adm
Check "Listar contas (ADMIN)" $r.Status 200

$r = Call POST "/api/auth/login" @{ username = $uA; password = "maria123" } $null
Check "Login CLIENTE" $r.Status 200
$mar = $r.Json.token
$r = Call GET "/api/accounts/me" $null $mar
Check "A minha conta" $r.Status 200
$r = Call GET "/api/accounts/$accA/balance" $null $mar
Check "O meu saldo" $r.Status 200
$r = Call GET "/api/accounts/$accA/statement?page=0&size=20" $null $mar
Check "O meu extracto" $r.Status 200
$r = Call GET "/api/accounts/$accB" $null $mar
Check "Conta alheia (403)" $r.Status 403
$r = Call GET "/api/accounts" $null $mar
Check "Listar contas como cliente (403)" $r.Status 403

$r = Call POST "/api/transfers" @{ fromAccount = $accA; toAccount = $accB; amount = 100; description = "Renda de Outubro" } $mar
Check "Transferencia valida" $r.Status 201
Check "Saldo resultante 900" $r.Json.sourceBalanceAfter 900
$r = Call POST "/api/transfers" @{ fromAccount = $accA; toAccount = $accB; amount = 999999; description = "x" } $mar
Check "Saldo insuficiente (422)" $r.Status 422
$r = Call POST "/api/transfers" @{ fromAccount = $accA; toAccount = $accB; amount = -5; description = "x" } $mar
Check "Valor negativo (400)" $r.Status 400
$r = Call POST "/api/transfers" @{ fromAccount = $accB; toAccount = $accA; amount = 10; description = "x" } $mar
Check "Origem alheia (403)" $r.Status 403
$r = Call POST "/api/transfers" @{ fromAccount = $accA; toAccount = $accB; amount = 10; description = "x" } $adm
Check "ADMIN a transferir (403)" $r.Status 403

Write-Host ""
Write-Host "Resultado: $ok passaram, $ko falharam"
exit $ko
