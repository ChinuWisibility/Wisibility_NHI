#!/usr/bin/env bash
# Creates tagged AWS lab IAM identities. Does not launch compute.
set -euo pipefail

aws sts get-caller-identity >/dev/null
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

tag() { echo "Key=$1,Value=$2"; }

ensure_user() {
  local name="$1"
  aws iam get-user --user-name "$name" >/dev/null 2>&1 || aws iam create-user --user-name "$name" \
    --tags "$(tag Environment NHI-LAB)" "$(tag Owner Wisibility)" "$(tag Purpose NHI-Discovery)" >/dev/null
}

ensure_role() {
  local name="$1" file="$2"
  aws iam get-role --role-name "$name" >/dev/null 2>&1 || aws iam create-role \
    --role-name "$name" --assume-role-policy-document "file://$file" \
    --tags "$(tag Environment NHI-LAB)" "$(tag Owner Wisibility)" "$(tag Purpose NHI-Discovery)" >/dev/null
}

TMP=$(mktemp -d)
cat > "$TMP/lambda-trust.json" <<JSON
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
JSON
cat > "$TMP/ec2-trust.json" <<JSON
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}
JSON
cat > "$TMP/github-trust.json" <<JSON
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"arn:aws:iam::${ACCOUNT}:oidc-provider/token.actions.githubusercontent.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com"},"StringLike":{"token.actions.githubusercontent.com:sub":"repo:wisbility/nhi-lab:*"}}}]}
JSON

ensure_user NHI-LAB-svc-backup
aws iam attach-user-policy --user-name NHI-LAB-svc-backup --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess >/dev/null || true

ensure_role NHI-LAB-PaymentProcessorRole "$TMP/lambda-trust.json"
aws iam attach-role-policy --role-name NHI-LAB-PaymentProcessorRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess >/dev/null || true
aws iam attach-role-policy --role-name NHI-LAB-PaymentProcessorRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite >/dev/null || true

ensure_role NHI-LAB-ProdWebRole "$TMP/ec2-trust.json"
aws iam attach-role-policy --role-name NHI-LAB-ProdWebRole --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess >/dev/null || true

ensure_role NHI-LAB-AdminAutomationRole "$TMP/lambda-trust.json"
aws iam attach-role-policy --role-name NHI-LAB-AdminAutomationRole --policy-arn arn:aws:iam::aws:policy/AdministratorAccess >/dev/null || true

aws iam get-role --role-name NHI-LAB-GitHubDeployRole >/dev/null 2>&1 || \
  aws iam create-role --role-name NHI-LAB-GitHubDeployRole --assume-role-policy-document "file://$TMP/github-trust.json" \
    --tags "$(tag Environment NHI-LAB)" "$(tag Owner Wisibility)" >/dev/null || \
  echo "GitHub OIDC role skipped (create token.actions.githubusercontent.com OIDC provider first)."
aws iam attach-role-policy --role-name NHI-LAB-GitHubDeployRole --policy-arn arn:aws:iam::aws:policy/PowerUserAccess >/dev/null || true

rm -rf "$TMP"
echo "Lab IAM identities ready in account $ACCOUNT"
echo "Optional: aws iam create-access-key --user-name NHI-LAB-svc-backup"
echo "Then add the Compass connector user and scan."
