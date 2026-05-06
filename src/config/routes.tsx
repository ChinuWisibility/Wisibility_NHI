import { lazy, type ReactNode } from 'react'
import type { UserRole } from '@/types/user.types'

// Auth
const Login        = lazy(() => import('@/pages/auth/Login'))
const MFA          = lazy(() => import('@/pages/auth/MFA'))
const Unauthorized = lazy(() => import('@/pages/auth/Unauthorized'))

// Dashboards
const AdminDashboard       = lazy(() => import('@/pages/dashboard/AdminDashboard'))
const ProgramDashboard     = lazy(() => import('@/pages/dashboard/ProgramDashboard'))
const SecurityOpsDashboard = lazy(() => import('@/pages/dashboard/SecurityOpsDashboard'))
const DevPortalDashboard   = lazy(() => import('@/pages/dashboard/DevPortalDashboard'))
const AuditDashboard       = lazy(() => import('@/pages/dashboard/AuditDashboard'))
const ViewerDashboard      = lazy(() => import('@/pages/dashboard/ViewerDashboard'))

// Inventory
const InventoryList = lazy(() => import('@/pages/inventory/InventoryList'))
const NHIDetail     = lazy(() => import('@/pages/inventory/NHIDetail'))
const NHIRequest    = lazy(() => import('@/pages/inventory/NHIRequest'))

// Discovery
const ConnectorHub    = lazy(() => import('@/pages/discovery/ConnectorHub'))
const ConnectorDetail = lazy(() => import('@/pages/discovery/ConnectorDetail'))
const DiscoveryRuns   = lazy(() => import('@/pages/discovery/DiscoveryRuns'))
const DiscoveryDetail = lazy(() => import('@/pages/discovery/DiscoveryDetail'))

// Posture
const PostureDashboard = lazy(() => import('@/pages/posture/PostureDashboard'))
const IssueList        = lazy(() => import('@/pages/posture/IssueList'))
const IssueDetail      = lazy(() => import('@/pages/posture/IssueDetail'))

// Security
const VaultManagement   = lazy(() => import('@/pages/security/VaultManagement'))
const RotationCenter    = lazy(() => import('@/pages/security/RotationCenter'))
const CredentialHygiene = lazy(() => import('@/pages/security/CredentialHygiene'))

// Monitoring
const ITDRDashboard = lazy(() => import('@/pages/monitoring/ITDRDashboard'))
const AlertsCenter  = lazy(() => import('@/pages/monitoring/AlertsCenter'))
const IncidentDetail = lazy(() => import('@/pages/monitoring/IncidentDetail'))

// Compliance
const ComplianceMapping       = lazy(() => import('@/pages/compliance/ComplianceMapping'))
const CertificationCampaigns  = lazy(() => import('@/pages/compliance/CertificationCampaigns'))
const CertificationReview     = lazy(() => import('@/pages/compliance/CertificationReview'))
const ExportCenter            = lazy(() => import('@/pages/compliance/ExportCenter'))

// Admin
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'))
const SystemConfig   = lazy(() => import('@/pages/admin/SystemConfig'))
const AuditLog       = lazy(() => import('@/pages/admin/AuditLog'))
const Policies       = lazy(() => import('@/pages/admin/Policies'))

export interface RouteConfig {
  path:      string
  element:   ReactNode
  minRole?:  UserRole
  isPublic?: boolean
}

export const routes: RouteConfig[] = [
  // Public
  { path: '/login',       element: <Login />,        isPublic: true },
  { path: '/mfa',         element: <MFA />,           isPublic: true },
  { path: '/403',         element: <Unauthorized />,  isPublic: true },

  // Dashboards
  { path: '/admin/dashboard',    element: <AdminDashboard />,       minRole: 'L0' },
  { path: '/program/dashboard',  element: <ProgramDashboard />,     minRole: 'L1' },
  { path: '/security/dashboard', element: <SecurityOpsDashboard />, minRole: 'L2' },
  { path: '/dev/dashboard',      element: <DevPortalDashboard />,   minRole: 'L3' },
  { path: '/audit/dashboard',    element: <AuditDashboard />,       minRole: 'L4' },
  { path: '/view/dashboard',     element: <ViewerDashboard />,      minRole: 'L5' },

  // Inventory
  { path: '/inventory',          element: <InventoryList />, minRole: 'L2' },
  { path: '/inventory/:id',      element: <NHIDetail />,     minRole: 'L2' },
  { path: '/dev/request',        element: <NHIRequest />,    minRole: 'L3' },

  // Discovery
  { path: '/discovery/connectors',     element: <ConnectorHub />,    minRole: 'L0' },
  { path: '/discovery/connectors/:id', element: <ConnectorDetail />, minRole: 'L0' },
  { path: '/discovery/runs',           element: <DiscoveryRuns />,   minRole: 'L2' },
  { path: '/discovery/runs/:id',       element: <DiscoveryDetail />, minRole: 'L2' },

  // Posture
  { path: '/posture',           element: <PostureDashboard />, minRole: 'L2' },
  { path: '/posture/issues',    element: <IssueList />,        minRole: 'L2' },
  { path: '/posture/issues/:id', element: <IssueDetail />,     minRole: 'L2' },

  // Security
  { path: '/security/vaults',   element: <VaultManagement />,   minRole: 'L0' },
  { path: '/security/rotation', element: <RotationCenter />,    minRole: 'L2' },
  { path: '/security/hygiene',  element: <CredentialHygiene />, minRole: 'L2' },

  // Monitoring
  { path: '/monitoring/itdr',        element: <ITDRDashboard />,  minRole: 'L2' },
  { path: '/monitoring/alerts',      element: <AlertsCenter />,   minRole: 'L2' },
  { path: '/monitoring/incidents/:id', element: <IncidentDetail />, minRole: 'L2' },

  // Compliance
  { path: '/compliance/mapping',          element: <ComplianceMapping />,      minRole: 'L4' },
  { path: '/compliance/campaigns',        element: <CertificationCampaigns />, minRole: 'L1' },
  { path: '/compliance/campaigns/:id',    element: <CertificationReview />,    minRole: 'L4' },
  { path: '/compliance/export',           element: <ExportCenter />,           minRole: 'L4' },

  // Admin
  { path: '/admin/users',    element: <UserManagement />, minRole: 'L0' },
  { path: '/admin/config',   element: <SystemConfig />,   minRole: 'L0' },
  { path: '/admin/audit',    element: <AuditLog />,       minRole: 'L4' },
  { path: '/admin/policies', element: <Policies />,       minRole: 'L0' },
]

export const ROLE_HOME: Record<UserRole, string> = {
  L0: '/admin/dashboard',
  L1: '/program/dashboard',
  L2: '/security/dashboard',
  L3: '/dev/dashboard',
  L4: '/audit/dashboard',
  L5: '/view/dashboard',
}
