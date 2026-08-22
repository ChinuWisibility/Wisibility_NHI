# Wisibility Azure NHI Lab

Use this lab to validate the Compass Azure connector: Entra identities + Azure resources + RBAC + credentials + federation + risk.

## 1. Build the lab

You need Azure CLI, a subscription, and rights to create Entra apps, resource groups, and role assignments.

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
chmod +x labs/azure-nhi/setup.sh labs/azure-nhi/discover.sh
./labs/azure-nhi/setup.sh
```

Optional orphan test (deletes `vm-nhi-lab01`, keeps the shared UAMI):

```bash
ORPHAN_VM=true ./labs/azure-nhi/setup.sh
```

Storage and Key Vault names include a subscription suffix because those names are globally unique.

## 2. Connector app (what Compass uses)

Do **not** use a lab workload identity as the connector if you can avoid it. Create a dedicated reader app:

1. Entra → App registrations → New registration → `Wisibility NHI Compass`
2. Certificates & secrets → New client secret → copy the **Value**
3. API permissions → Microsoft Graph → **Application** permissions:
   - `Application.Read.All`
   - `Directory.Read.All`
   - `Organization.Read.All`
   - `RoleManagement.Read.Directory`
4. Grant admin consent
5. Subscription → IAM → assign **Reader** to this app

Compass never needs secret **values** from lab apps. It only reads credential metadata.

## 3. Scan from Compass

1. Discovery Sources → **Add Azure Connector**
2. Paste Tenant ID, Client ID, Client Secret, and Subscription ID
3. **Test Connection** — should show the tenant name and that the subscription is readable
4. **Force Re-scan**
5. Open Inventory, Findings, and each lab NHI profile (Access / Credentials / Lineage / Risk)

## 4. Expected results

See `expected-inventory.csv`. After the scan you should see approximately:

| Identity | Expected risk | Why |
|---|---|---|
| NHI-LAB-AdminAutomation | Critical | Subscription Contributor |
| NHI-LAB-LegacyService | High | Long secret + RG Contributor |
| uami-nhi-shared01 | High | Shared UAMI + KV + Storage |
| NHI-LAB-GitHubDeploy | High | External federation + Contributor |
| NHI-LAB-BroadFederation | High | Broad FIC subject |
| NHI-LAB-PaymentService | Medium/High | Secret + KV + Storage |
| NHI-LAB-DormantService | Medium | Standing Reader, unused |
| VM / App system MIs | Low | Secretless + resource-scoped |

Rules emitted: `NHI-AZ-001` … `NHI-AZ-015` (see Findings). Secretless managed identities can also get the positive `NHI-AZ-013` posture note.

## 5. Export Azure’s view of the lab

```bash
./labs/azure-nhi/discover.sh
```

Writes JSON under `labs/azure-nhi/export/` for comparison with Compass inventory.

## 6. Acceptance checklist

- [ ] Customer apps and `NHI-LAB-*` identities appear (Microsoft first-party SPs are skipped)
- [ ] Managed identities are distinct from app SPs
- [ ] System vs user-assigned MI is labeled
- [ ] VM / App Service / Function attachments show on Lineage
- [ ] Client-secret metadata exists without secret values
- [ ] GitHub federated issuer/subject/audience are visible
- [ ] RBAC roles and scopes show on Access
- [ ] Key Vault and Storage access are flagged
- [ ] AdminAutomation is Critical
- [ ] Shared UAMI is High
- [ ] DormantService is Dormant / Medium
- [ ] Broad federation subject is High
