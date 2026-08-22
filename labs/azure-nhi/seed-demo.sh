#!/usr/bin/env bash
# Cheap Azure demo identities for Compass. No VMs, App Services, or Functions.
set -euo pipefail

need() { command -v "$1" >/dev/null || { echo "Install Azure CLI: https://aka.ms/installazurecli"; exit 1; }; }
need az
az account show >/dev/null || { echo "Run: az login"; exit 1; }

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
LOCATION="${LOCATION:-eastus}"
UNIQUE=$(printf '%s' "$SUBSCRIPTION_ID" | tr -d '-' | cut -c1-8)
STORAGE="${STORAGE:-stnhidemo${UNIQUE}}"

echo "Tenant:       $TENANT_ID"
echo "Subscription: $SUBSCRIPTION_ID"

az group create --name rg-nhi-demo --location "$LOCATION" \
  --tags Environment=NHI-LAB Owner=Wisibility Purpose=NHI-Discovery >/dev/null

az storage account create --name "$STORAGE" --resource-group rg-nhi-demo \
  --location "$LOCATION" --sku Standard_LRS --kind StorageV2 \
  --tags Environment=NHI-LAB Owner=Wisibility Purpose=NHI-Discovery >/dev/null
STORAGE_ID=$(az storage account show --name "$STORAGE" --resource-group rg-nhi-demo --query id -o tsv)

create_app() {
  local name="$1"
  local app_id
  app_id=$(az ad app list --display-name "$name" --query "[0].appId" -o tsv)
  if [[ -z "$app_id" ]]; then
    app_id=$(az ad app create --display-name "$name" --query appId -o tsv)
  fi
  local sp_id
  sp_id=$(az ad sp show --id "$app_id" --query id -o tsv 2>/dev/null || true)
  if [[ -z "$sp_id" ]]; then
    sp_id=$(az ad sp create --id "$app_id" --query id -o tsv)
  fi
  printf '%s %s\n' "$app_id" "$sp_id"
}

assign_role() {
  az role assignment create \
    --assignee-object-id "$1" \
    --assignee-principal-type ServicePrincipal \
    --role "$2" \
    --scope "$3" >/dev/null 2>&1 || true
}

echo "Creating Entra apps…"

read -r PAYMENT_APP PAYMENT_SP < <(create_app NHI-LAB-PaymentService)
az ad app credential reset --id "$PAYMENT_APP" --append --display-name NHI-LAB-ClientSecret --years 1 >/dev/null
assign_role "$PAYMENT_SP" "Storage Blob Data Reader" "$STORAGE_ID"
assign_role "$PAYMENT_SP" Reader "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-demo"

read -r LEGACY_APP LEGACY_SP < <(create_app NHI-LAB-LegacyService)
az ad app credential reset --id "$LEGACY_APP" --append --display-name NHI-LAB-LegacySecret --years 2 >/dev/null
assign_role "$LEGACY_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-demo"

read -r ADMIN_APP ADMIN_SP < <(create_app NHI-LAB-AdminAutomation)
az ad app credential reset --id "$ADMIN_APP" --append --display-name NHI-LAB-AdminSecret --years 1 >/dev/null
assign_role "$ADMIN_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID"

read -r DORMANT_APP DORMANT_SP < <(create_app NHI-LAB-DormantService)
assign_role "$DORMANT_SP" Reader "/subscriptions/$SUBSCRIPTION_ID"

read -r GITHUB_APP GITHUB_SP < <(create_app NHI-LAB-GitHubDeploy)
FIC=$(mktemp)
cat > "$FIC" <<'JSON'
{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:environment:production",
  "description": "Wisibility demo GitHub workload",
  "audiences": ["api://AzureADTokenExchange"]
}
JSON
az ad app federated-credential create --id "$GITHUB_APP" --parameters "$FIC" >/dev/null 2>&1 || true
BROAD=$(mktemp)
cat > "$BROAD" <<'JSON'
{
  "name": "github-broad",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:ref:refs/heads/*",
  "description": "Broad demo federation subject",
  "audiences": ["api://AzureADTokenExchange"]
}
JSON
az ad app federated-credential create --id "$GITHUB_APP" --parameters "$BROAD" >/dev/null 2>&1 || true
rm -f "$FIC" "$BROAD"
assign_role "$GITHUB_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-demo"

echo
echo "Demo data is in Azure. Look for apps named NHI-LAB-* in Entra."
echo
echo "  NHI-LAB-PaymentService     secret + Storage Reader     Medium/High"
echo "  NHI-LAB-LegacyService      2-year secret + RG Contributor  High"
echo "  NHI-LAB-AdminAutomation    secret + Subscription Contributor  Critical"
echo "  NHI-LAB-DormantService     unused + Subscription Reader  Medium"
echo "  NHI-LAB-GitHubDeploy       GitHub federation + RG Contributor  High"
echo
echo "In Compass: Test Connection → Force Re-scan. Filter inventory for NHI-LAB."
