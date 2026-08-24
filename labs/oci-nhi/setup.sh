#!/usr/bin/env bash
# Creates tagged OCI lab IAM identities. Does not launch compute.
set -euo pipefail

oci iam region list >/dev/null
TENANCY="${OCI_TENANCY:-$(oci iam region-subscription list --query 'data[0]."tenancy-id"' --raw-output 2>/dev/null || true)}"
if [[ -z "${OCI_TENANCY:-}" ]]; then
  echo "Set OCI_TENANCY to your tenancy OCID, then re-run."
  echo "  export OCI_TENANCY=ocid1.tenancy.oc1.."
  exit 1
fi
TENANCY="$OCI_TENANCY"

ensure_group() {
  local name="$1"
  local ocid
  ocid=$(oci iam group list --compartment-id "$TENANCY" --name "$name" --query 'data[0].id' --raw-output 2>/dev/null || true)
  if [[ -z "$ocid" || "$ocid" == "null" ]]; then
    ocid=$(oci iam group create --compartment-id "$TENANCY" --name "$name" --description "Wisibility NHI lab" --query data.id --raw-output)
  fi
  echo "$ocid"
}

ensure_user() {
  local name="$1"
  local ocid
  ocid=$(oci iam user list --compartment-id "$TENANCY" --name "$name" --query 'data[0].id' --raw-output 2>/dev/null || true)
  if [[ -z "$ocid" || "$ocid" == "null" ]]; then
    ocid=$(oci iam user create --compartment-id "$TENANCY" --name "$name" --description "Wisibility NHI lab" \
      --freeform-tags '{"Environment":"NHI-LAB","Owner":"Wisibility","Purpose":"NHI-Discovery"}' \
      --query data.id --raw-output)
  fi
  echo "$ocid"
}

ensure_membership() {
  local user_id="$1" group_id="$2"
  oci iam group list-users --group-id "$group_id" --query "data[?id=='$user_id'] | [0].id" --raw-output >/dev/null 2>&1 || \
    oci iam group add-user --group-id "$group_id" --user-id "$user_id" >/dev/null
}

ensure_policy() {
  local name="$1" statements="$2"
  local ocid
  ocid=$(oci iam policy list --compartment-id "$TENANCY" --name "$name" --query 'data[0].id' --raw-output 2>/dev/null || true)
  if [[ -z "$ocid" || "$ocid" == "null" ]]; then
    oci iam policy create --compartment-id "$TENANCY" --name "$name" --description "Wisibility NHI lab" \
      --statements "$statements" >/dev/null
  fi
}

ensure_dynamic_group() {
  local name="$1" rule="$2"
  local ocid
  ocid=$(oci iam dynamic-group list --compartment-id "$TENANCY" --name "$name" --query 'data[0].id' --raw-output 2>/dev/null || true)
  if [[ -z "$ocid" || "$ocid" == "null" ]]; then
    oci iam dynamic-group create --compartment-id "$TENANCY" --name "$name" --description "Wisibility NHI lab" \
      --matching-rule "$rule" \
      --freeform-tags '{"Environment":"NHI-LAB","Owner":"Wisibility"}' >/dev/null
  fi
}

PAY_GROUP=$(ensure_group NHI-LAB-Payment)
ADMIN_GROUP=$(ensure_group NHI-LAB-AdminAutomation)
PAY_USER=$(ensure_user NHI-LAB-PaymentService)
LEGACY_USER=$(ensure_user NHI-LAB-LegacyService)
ADMIN_USER=$(ensure_user NHI-LAB-AdminAutomation)
DORMANT_USER=$(ensure_user NHI-LAB-DormantService)

ensure_membership "$PAY_USER" "$PAY_GROUP"
ensure_membership "$LEGACY_USER" "$PAY_GROUP"
ensure_membership "$ADMIN_USER" "$ADMIN_GROUP"
ensure_membership "$DORMANT_USER" "$PAY_GROUP"

ensure_policy NHI-LAB-payment-policy "[\"Allow group NHI-LAB-Payment to read object-family in tenancy\"]"
ensure_policy NHI-LAB-admin-policy "[\"Allow group NHI-LAB-AdminAutomation to manage all-resources in tenancy\"]"
ensure_policy NHI-LAB-dg-policy "[\"Allow dynamic-group NHI-LAB-PaymentCompute to use secret-family in tenancy\",\"Allow dynamic-group NHI-LAB-AdminFleet to manage all-resources in tenancy\"]"

ensure_dynamic_group NHI-LAB-PaymentCompute "ANY {instance.compartment.id = '${TENANCY}'}"
ensure_dynamic_group NHI-LAB-AdminFleet "ANY {instance.compartment.id = '${TENANCY}'}"
ensure_dynamic_group NHI-LAB-GitHubDeploy "ANY {resource.type = 'devopsdeploypipeline'}"

echo "Lab IAM identities ready in tenancy $TENANCY"
echo "Optional: upload an API public key on NHI-LAB-PaymentService and NHI-LAB-AdminAutomation"
echo "  oci iam user api-key upload --user-id $PAY_USER --key-file ./lab.pub"
echo "Then add the Compass connector user and scan."
