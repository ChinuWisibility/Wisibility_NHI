export type ConnectorType =
  | 'AD'
  | 'CLOUD_AWS'
  | 'CLOUD_AZURE'
  | 'CLOUD_GCP'
  | 'CLOUD_OCI'
  | 'VAULT_HASHICORP'
  | 'VAULT_CYBERARK'
  | 'VAULT_AWS_SM'
  | 'GITHUB'
  | 'GITLAB'
  | 'KUBERNETES'
  | 'DATABASE'
  | 'CICD_JENKINS'
  | 'CICD_AZURE_DEVOPS'
  | 'SAAS'
  | 'DEMO'

export type ConnectorStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING' | 'PENDING'

export interface ConnectorConfig {
  connectorId:     string
  connectorType:   ConnectorType
  displayName:     string
  status:          ConnectorStatus
  config:          Record<string, string>
  lastTestAt?:     string
  lastRunAt?:      string
  createdAt:       string
  nhiCount?:       number
  totalIdentities?: number
}

export interface DiscoveryRun {
  runId:          string
  connectorType:  ConnectorType
  startedAt:      string
  completedAt?:   string
  status:         'RUNNING' | 'COMPLETED' | 'FAILED'
  nhisDiscovered: number
  nhisNew:        number
  nhisUpdated:    number
  nhisRemoved:    number
  errors:         string[]
  triggeredBy:    string
}
