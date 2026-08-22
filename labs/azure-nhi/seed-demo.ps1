# Cheap Azure demo identities for Compass. Run in Azure Cloud Shell (PowerShell).
$ErrorActionPreference = "Continue"

Write-Host "Subscriptions this login can use:"
az account list -o table

$sub = az account show --query id -o tsv
$tenant = az account show --query tenantId -o tsv
$location = "eastus"
$unique = ($sub -replace "-", "").Substring(0, 8)
$storage = "stnhidemo$unique"

Write-Host "Tenant:       $tenant"
Write-Host "Subscription: $sub"

az group create --name rg-nhi-demo --location $location --tags Environment=NHI-LAB Owner=Wisibility Purpose=NHI-Discovery | Out-Null
az storage account create --name $storage --resource-group rg-nhi-demo --location $location --sku Standard_LRS --kind StorageV2 --tags Environment=NHI-LAB Owner=Wisibility Purpose=NHI-Discovery | Out-Null
$storageId = az storage account show --name $storage --resource-group rg-nhi-demo --query id -o tsv

function Get-OrCreateApp([string]$name) {
  $appId = az ad app list --display-name $name --query "[0].appId" -o tsv
  if (-not $appId) { $appId = az ad app create --display-name $name --query appId -o tsv }
  $spId = az ad sp show --id $appId --query id -o tsv 2>$null
  if (-not $spId) { $spId = az ad sp create --id $appId --query id -o tsv }
  return @{ AppId = $appId; SpId = $spId }
}

function Add-Role([string]$spId, [string]$role, [string]$scope) {
  az role assignment create --assignee-object-id $spId --assignee-principal-type ServicePrincipal --role $role --scope $scope 2>$null | Out-Null
}

Write-Host "Creating Entra apps..."

$pay = Get-OrCreateApp "NHI-LAB-PaymentService"
az ad app credential reset --id $pay.AppId --append --display-name NHI-LAB-ClientSecret --years 1 | Out-Null
Add-Role $pay.SpId "Storage Blob Data Reader" $storageId
Add-Role $pay.SpId "Reader" "/subscriptions/$sub/resourceGroups/rg-nhi-demo"

$legacy = Get-OrCreateApp "NHI-LAB-LegacyService"
az ad app credential reset --id $legacy.AppId --append --display-name NHI-LAB-LegacySecret --years 2 | Out-Null
Add-Role $legacy.SpId "Contributor" "/subscriptions/$sub/resourceGroups/rg-nhi-demo"

$admin = Get-OrCreateApp "NHI-LAB-AdminAutomation"
az ad app credential reset --id $admin.AppId --append --display-name NHI-LAB-AdminSecret --years 1 | Out-Null
Add-Role $admin.SpId "Contributor" "/subscriptions/$sub"

$dormant = Get-OrCreateApp "NHI-LAB-DormantService"
Add-Role $dormant.SpId "Reader" "/subscriptions/$sub"

$github = Get-OrCreateApp "NHI-LAB-GitHubDeploy"
$fic = New-TemporaryFile
@'
{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:environment:production",
  "description": "Wisibility demo GitHub workload",
  "audiences": ["api://AzureADTokenExchange"]
}
'@ | Set-Content -Path $fic.FullName
az ad app federated-credential create --id $github.AppId --parameters $fic.FullName 2>$null | Out-Null
$broad = New-TemporaryFile
@'
{
  "name": "github-broad",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:ref:refs/heads/*",
  "description": "Broad demo federation subject",
  "audiences": ["api://AzureADTokenExchange"]
}
'@ | Set-Content -Path $broad.FullName
az ad app federated-credential create --id $github.AppId --parameters $broad.FullName 2>$null | Out-Null
Add-Role $github.SpId "Contributor" "/subscriptions/$sub/resourceGroups/rg-nhi-demo"

Write-Host ""
Write-Host "Done. In Entra look for NHI-LAB-* apps."
Write-Host "Then in Compass: Test Connection -> Force Re-scan."
