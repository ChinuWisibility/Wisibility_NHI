#!/usr/bin/env bash
# Export the Azure objects the Wisibility connector should correlate.
set -euo pipefail

OUT_DIR="${1:-./labs/azure-nhi/export}"
mkdir -p "$OUT_DIR"

az account show >/dev/null
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "Writing exports to $OUT_DIR"

az ad app list --all \
  --query "[?starts_with(displayName, 'NHI-LAB-')].{name:displayName,appId:appId,id:id}" \
  -o json > "$OUT_DIR/applications.json"

az ad sp list --all \
  --query "[?starts_with(displayName, 'NHI-LAB-') || starts_with(displayName, 'uami-nhi') || starts_with(displayName, 'vm-nhi') || starts_with(displayName, 'app-nhi') || starts_with(displayName, 'func-nhi')].{name:displayName,appId:appId,id:id,type:servicePrincipalType}" \
  -o json > "$OUT_DIR/service-principals.json"

az ad sp list --all --filter "servicePrincipalType eq 'ManagedIdentity'" \
  -o json > "$OUT_DIR/managed-identities.json"

az identity list -o json > "$OUT_DIR/uami.json"

az resource list \
  --query "[?identity != null].{name:name,type:type,identity:identity}" \
  -o json > "$OUT_DIR/resources-with-identity.json"

az role assignment list --all --include-inherited -o json > "$OUT_DIR/role-assignments.json"

for app in NHI-LAB-PaymentService NHI-LAB-LegacyService NHI-LAB-AdminAutomation NHI-LAB-GitHubDeploy NHI-LAB-DormantService NHI-LAB-BroadFederation; do
  app_id=$(az ad app list --display-name "$app" --query "[0].appId" -o tsv || true)
  [[ -z "$app_id" ]] && continue
  az ad app credential list --id "$app_id" -o json > "$OUT_DIR/creds-$app.json" || true
  az ad app federated-credential list --id "$app_id" -o json > "$OUT_DIR/fic-$app.json" || true
done

echo "Subscription $SUBSCRIPTION_ID export complete."
echo "Compare names to expected-inventory.csv after a Compass Azure scan."
