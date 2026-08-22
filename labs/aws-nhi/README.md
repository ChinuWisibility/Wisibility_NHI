# Wisibility AWS NHI Lab

Compass treats AWS as a **workload-identity ecosystem**: IAM users/roles + trust + EC2/Lambda/ECS/EKS attachments + last-used + risk. It does not store secret values.

## 1. Create a read-only connector identity

In [AWS IAM](https://console.aws.amazon.com/iam):

1. **Users** → **Create user** → `wisibility-nhi-connector` → **Programmatic access only**
2. Attach AWS managed policies:
   - `SecurityAudit`
   - `ViewOnlyAccess`
3. If those are too narrow for EKS Pod Identity, also add an inline policy (see `connector-policy.json`)
4. **Security credentials** → **Create access key** → Application running outside AWS
5. Copy **Access key ID** and **Secret access key** once

Better pattern for Organizations: put `SecurityAudit` + `ViewOnlyAccess` on a role named `WisibilityNHIReadOnly` in each account, trust your management/connector account, and paste that role ARN + External ID into Compass.

## 2. Optional lab identities

```bash
aws sts get-caller-identity
chmod +x labs/aws-nhi/setup.sh
./labs/aws-nhi/setup.sh
```

Creates tagged lab users/roles only (no EC2/Lambda spend). Then create one access key on `NHI-LAB-svc-backup` if you want the long-lived key finding.

## 3. Scan from Compass

1. Redeploy frontend + backend
2. Discovery Sources → **Add AWS**
3. Paste Access Key ID, Secret, Region (`us-east-1` unless you use another)
4. Optional: Assume role ARN + External ID
5. **Test Connection** → should show account ID and ARN
6. **Force Re-scan**

## 4. What you should see

| Identity | Expected |
|---|---|
| IAM user + active key + admin | Critical |
| IAM user + key | High |
| Role trusted by `*` | Critical |
| External AssumeRole without ExternalId | High |
| `AWSServiceRoleFor...` | Low / informational, not a ticket |
| Lambda/EC2/ECS-attached role | Workload shown on Lineage |
| GitHub OIDC role | Federated / CI/CD |

Rules: `NHI-AWS-001` … `NHI-AWS-023`. Service-linked roles are classified **AWS Managed NHI** and are not treated as customer-actionable Critical findings.
