#!/usr/bin/env bash
# Wisibility Azure NHI Lab — creates the identities and resources in the build sheet.
# Requires Azure CLI, an Entra tenant, and rights to create apps, RGs, and RBAC.
set -euo pipefail

LOCATION="${LOCATION:-eastus}"
ORPHAN_VM="${ORPHAN_VM:-false}"

need() { command -v "$1" >/dev/null || { echo "Missing $1"; exit 1; }; }
need az

az account show >/dev/null
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
UNIQUE=$(printf '%s' "$SUBSCRIPTION_ID" | tr -d '-' | cut -c1-8)
STORAGE="${STORAGE:-stwisib${UNIQUE}}"
DATA_STORAGE="${DATA_STORAGE:-stndata${UNIQUE}}"
FUNC_STORAGE="${FUNC_STORAGE:-stnfunc${UNIQUE}}"
KEYVAULT="${KEYVAULT:-kv-wisib-${UNIQUE}}"
WEBAPP="${WEBAPP:-app-nhi-lab-${UNIQUE}}"
FUNAPP="${FUNAPP:-func-nhi-lab-${UNIQUE}}"

echo "Tenant:       $TENANT_ID"
echo "Subscription: $SUBSCRIPTION_ID"
echo "Storage:      $STORAGE"
echo "Key Vault:    $KEYVAULT"

TAG_ARGS=(--tags Environment=NHI-LAB Owner=Wisibility Purpose=NHI-Discovery)

az group create --name rg-nhi-compute --location "$LOCATION" "${TAG_ARGS[@]}" >/dev/null
az group create --name rg-nhi-apps --location "$LOCATION" "${TAG_ARGS[@]}" >/dev/null
az group create --name rg-nhi-security --location "$LOCATION" "${TAG_ARGS[@]}" >/dev/null

az storage account create --name "$STORAGE" --resource-group rg-nhi-security \
  --location "$LOCATION" --sku Standard_LRS --kind StorageV2 "${TAG_ARGS[@]}" >/dev/null
STORAGE_ID=$(az storage account show --name "$STORAGE" --resource-group rg-nhi-security --query id -o tsv)

az storage account create --name "$DATA_STORAGE" --resource-group rg-nhi-security \
  --location "$LOCATION" --sku Standard_LRS --kind StorageV2 "${TAG_ARGS[@]}" >/dev/null
az storage container create --name production-data --account-name "$DATA_STORAGE" --auth-mode login >/dev/null || true
DATA_STORAGE_ID=$(az storage account show --name "$DATA_STORAGE" --resource-group rg-nhi-security --query id -o tsv)

az keyvault create --name "$KEYVAULT" --resource-group rg-nhi-security \
  --location "$LOCATION" --enable-rbac-authorization true "${TAG_ARGS[@]}" >/dev/null
KV_ID=$(az keyvault show --name "$KEYVAULT" --resource-group rg-nhi-security --query id -o tsv)
az keyvault secret set --vault-name "$KEYVAULT" --name TestDatabaseCredential \
  --value "NHI-LAB-NOT-A-REAL-CREDENTIAL" >/dev/null || true

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
  local object_id="$1" role="$2" scope="$3"
  az role assignment create \
    --assignee-object-id "$object_id" \
    --assignee-principal-type ServicePrincipal \
    --role "$role" \
    --scope "$scope" >/dev/null || true
}

read -r PAYMENT_APP PAYMENT_SP < <(create_app NHI-LAB-PaymentService)
az ad app credential reset --id "$PAYMENT_APP" --append --display-name NHI-LAB-ClientSecret --years 1 >/dev/null
assign_role "$PAYMENT_SP" "Storage Blob Data Reader" "$STORAGE_ID"
assign_role "$PAYMENT_SP" "Key Vault Secrets User" "$KV_ID"

read -r LEGACY_APP LEGACY_SP < <(create_app NHI-LAB-LegacyService)
az ad app credential reset --id "$LEGACY_APP" --append --display-name NHI-LAB-LegacySecret --years 2 >/dev/null
assign_role "$LEGACY_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-apps"

read -r ADMIN_APP ADMIN_SP < <(create_app NHI-LAB-AdminAutomation)
az ad app credential reset --id "$ADMIN_APP" --append --display-name NHI-LAB-AdminSecret --years 1 >/dev/null
assign_role "$ADMIN_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID"
assign_role "$ADMIN_SP" "Storage Blob Data Contributor" "$DATA_STORAGE_ID"

read -r DORMANT_APP DORMANT_SP < <(create_app NHI-LAB-DormantService)
assign_role "$DORMANT_SP" Reader "/subscriptions/$SUBSCRIPTION_ID"

read -r GITHUB_APP GITHUB_SP < <(create_app NHI-LAB-GitHubDeploy)
FIC_FILE=$(mktemp)
cat > "$FIC_FILE" <<'JSON'
{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:environment:production",
  "description": "Wisibility NHI Lab GitHub production workload",
  "audiences": ["api://AzureADTokenExchange"]
}
JSON
az ad app federated-credential create --id "$GITHUB_APP" --parameters "$FIC_FILE" >/dev/null || true

BROAD_FILE=$(mktemp)
cat > "$BROAD_FILE" <<'JSON'
{
  "name": "github-broad",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:ref:refs/heads/*",
  "description": "Deliberately broad lab federation subject",
  "audiences": ["api://AzureADTokenExchange"]
}
JSON
az ad app federated-credential create --id "$GITHUB_APP" --parameters "$BROAD_FILE" >/dev/null || true
rm -f "$FIC_FILE" "$BROAD_FILE"
assign_role "$GITHUB_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-apps"

read -r BROAD_APP BROAD_SP < <(create_app NHI-LAB-BroadFederation)
BROAD2=$(mktemp)
cat > "$BROAD2" <<'JSON'
{
  "name": "wildcard-federation",
  "issuer": "https://token.actions.githubusercontent.com/",
  "subject": "repo:wisbility/nhi-lab:ref:refs/heads/*",
  "description": "Broad lab subject for NHI-AZ-008",
  "audiences": ["api://AzureADTokenExchange"]
}
JSON
az ad app federated-credential create --id "$BROAD_APP" --parameters "$BROAD2" >/dev/null || true
rm -f "$BROAD2"
assign_role "$BROAD_SP" Contributor "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-nhi-apps"

if ! az vm show --resource-group rg-nhi-compute --name vm-nhi-lab01 >/dev/null 2>&1; then
  az vm create --resource-group rg-nhi-compute --name vm-nhi-lab01 \
    --image Ubuntu2204 --admin-username azureuser --generate-ssh-keys \
    --assign-identity --size Standard_B1s "${TAG_ARGS[@]}" >/dev/null
fi
VM_PRINCIPAL_ID=$(az vm show --resource-group rg-nhi-compute --name vm-nhi-lab01 --query identity.principalId -o tsv)
assign_role "$VM_PRINCIPAL_ID" "Storage Blob Data Reader" "$STORAGE_ID"

UAMI_ID=$(az identity show --name uami-nhi-shared01 --resource-group rg-nhi-apps --query id -o tsv 2>/dev/null || true)
if [[ -z "$UAMI_ID" ]]; then
  UAMI_ID=$(az identity create --name uami-nhi-shared01 --resource-group rg-nhi-apps --location "$LOCATION" "${TAG_ARGS[@]}" --query id -o tsv)
fi
UAMI_PRINCIPAL_ID=$(az identity show --name uami-nhi-shared01 --resource-group rg-nhi-apps --query principalId -o tsv)
az vm identity assign --resource-group rg-nhi-compute --name vm-nhi-lab01 --identities "$UAMI_ID" >/dev/null
assign_role "$UAMI_PRINCIPAL_ID" "Key Vault Secrets User" "$KV_ID"
assign_role "$UAMI_PRINCIPAL_ID" "Storage Blob Data Reader" "$STORAGE_ID"

az appservice plan create --name plan-nhi-lab --resource-group rg-nhi-apps --sku B1 --is-linux >/dev/null || true
az webapp create --resource-group rg-nhi-apps --plan plan-nhi-lab --name "$WEBAPP" --runtime "NODE:20-lts" >/dev/null || true
az webapp identity assign --resource-group rg-nhi-apps --name "$WEBAPP" >/dev/null
APP_PRINCIPAL_ID=$(az webapp identity show --resource-group rg-nhi-apps --name "$WEBAPP" --query principalId -o tsv)
assign_role "$APP_PRINCIPAL_ID" "Storage Blob Data Reader" "$STORAGE_ID"
az webapp identity assign --resource-group rg-nhi-apps --name "$WEBAPP" --identities "$UAMI_ID" >/dev/null

az storage account create --name "$FUNC_STORAGE" --resource-group rg-nhi-apps \
  --location "$LOCATION" --sku Standard_LRS >/dev/null
az functionapp create --resource-group rg-nhi-apps --consumption-plan-location "$LOCATION" \
  --runtime python --runtime-version 3.11 --functions-version 4 \
  --name "$FUNAPP" --storage-account "$FUNC_STORAGE" >/dev/null || true
az functionapp identity assign --resource-group rg-nhi-apps --name "$FUNAPP" >/dev/null
FUNC_PRINCIPAL_ID=$(az functionapp identity show --resource-group rg-nhi-apps --name "$FUNAPP" --query principalId -o tsv)
assign_role "$FUNC_PRINCIPAL_ID" "Key Vault Secrets User" "$KV_ID"
az functionapp identity assign --resource-group rg-nhi-apps --name "$FUNAPP" --identities "$UAMI_ID" >/dev/null || true

if [[ "$ORPHAN_VM" == "true" ]]; then
  az vm delete --resource-group rg-nhi-compute --name vm-nhi-lab01 --yes --no-wait
  echo "VM delete started. UAMI uami-nhi-shared01 was left in place for the orphan test."
fi

echo
echo "Lab created."
echo "Add this app as the Compass connector (or use a dedicated reader app):"
echo "  Tenant ID:       $TENANT_ID"
echo "  Subscription ID: $SUBSCRIPTION_ID"
echo "Then grant the Compass connector Graph application permissions + subscription Reader,"
echo "Test Connection, and Force Re-scan."
