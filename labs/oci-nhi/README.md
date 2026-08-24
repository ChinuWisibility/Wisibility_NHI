# Wisibility OCI NHI Lab

Compass treats OCI as a **workload-identity ecosystem**: IAM users with API keys + groups/policies + dynamic groups (instance/resource principals) + compute attachments + risk. It does not store API key material, auth tokens, customer secret keys, or Vault secret values.

## 1. Create a read-only connector identity

In [OCI Console](https://cloud.oracle.com) → **Identity & Security** → **Domains** (or classic **Identity**) in the **home region**:

1. Create user `wisibility-nhi-connector` (no console password needed)
2. Create group `wisibility-nhi-readers` and add that user
3. Create policy `wisibility-nhi-read` in the root compartment:

```
Allow group wisibility-nhi-readers to inspect all-resources in tenancy
Allow group wisibility-nhi-readers to read users in tenancy
```

`inspect all-resources` is the SecurityAudit-style grant. `read users` is required to list API key / auth token / customer secret key **metadata**.

4. **Resources** → **API Keys** → **Add API Key** → generate or upload a public key
5. Copy **Tenancy OCID**, **User OCID**, **fingerprint**, and the matching **private key PEM**
6. Note the tenancy **home region** (Identity APIs fail in other regions)

## 2. Optional lab identities

```bash
oci iam tenancy get --tenancy-id "$OCI_TENANCY"
chmod +x labs/oci-nhi/setup.sh
./labs/oci-nhi/setup.sh
```

Creates tagged lab users, groups, policies, and dynamic groups (no compute spend). Optionally upload an API public key on `NHI-LAB-PaymentService` if you want the long-lived key finding.

## 3. Scan from Compass

1. Restart backend so `oci-identity` is loaded
2. Discovery Sources → **Add OCI**
3. Paste Tenancy OCID, User OCID, fingerprint, PEM, home region
4. **Test Connection** → should show the tenancy name
5. **Force Re-scan**

## 4. What you should see

| Identity | Expected |
|---|---|
| IAM user + API key + manage all-resources | Critical |
| IAM user + API key | High |
| Auth tokens / customer secret keys | Medium–High |
| Dynamic group matching the tenancy | High / Critical if privileged |
| Dynamic group + manage all-resources | Critical |
| Compute instance matching a dynamic group | Workload shown on Lineage |
| SAML identity provider | Federated |

Rules: `NHI-OCI-001` … `NHI-OCI-015`. Human IAM users without API keys, auth tokens, or customer secret keys are skipped unless the name looks like a service account (`NHI-LAB`, `svc-`, `sa-`, `bot-`).
