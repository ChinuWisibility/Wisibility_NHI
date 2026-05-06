import fs from 'fs';
import path from 'path';

const mappings = [
  { hex: '#b8cfe6', replacement: 'main', cssVar: 'var(--color-text-main)' },
  { hex: '#5a7a9a', replacement: 'muted', cssVar: 'var(--color-text-muted)' },
  { hex: '#e2eeff', replacement: 'bright', cssVar: 'var(--color-text-bright)' },
  { hex: '#3a5a7a', replacement: 'muted', cssVar: 'var(--color-text-muted)' },
  { hex: '#0c1a2e', replacement: null, cssVar: 'var(--color-surface-2)' },
  { hex: '#162840', replacement: null, cssVar: 'var(--color-surface-border)' },
  { hex: '#1a2b3b', replacement: null, cssVar: 'var(--color-surface-3)' }, // Close enough to surface-3
  { hex: '#0d151d', replacement: null, cssVar: 'var(--color-surface-2)' }, // Close enough to surface-2
];

const files = [
  'src/components/layout/AppShell.tsx',
  'src/components/layout/PageHeader.tsx',
  'src/components/ui/Badge.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ui/ConfirmDialog.tsx',
  'src/components/ui/EmptyState.tsx',
  'src/components/ui/ErrorState.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/StatCard.tsx',
  'src/components/ui/Switch.tsx',
  'src/pages/admin/AuditLog.tsx',
  'src/pages/admin/Policies.tsx',
  'src/pages/admin/SystemConfig.tsx',
  'src/pages/admin/UserManagement.tsx',
  'src/pages/auth/Login.tsx',
  'src/pages/auth/MFA.tsx',
  'src/pages/auth/Unauthorized.tsx',
  'src/pages/compliance/CertificationCampaigns.tsx',
  'src/pages/compliance/CertificationReview.tsx',
  'src/pages/compliance/ComplianceMapping.tsx',
  'src/pages/compliance/ExportCenter.tsx',
  'src/pages/dashboard/AdminDashboard.tsx',
  'src/pages/dashboard/AuditDashboard.tsx',
  'src/pages/dashboard/DevPortalDashboard.tsx',
  'src/pages/dashboard/ProgramDashboard.tsx',
  'src/pages/dashboard/SecurityOpsDashboard.tsx',
  'src/pages/dashboard/ViewerDashboard.tsx',
  'src/pages/discovery/ConnectorDetail.tsx',
  'src/pages/discovery/ConnectorHub.tsx',
  'src/pages/discovery/DiscoveryDetail.tsx',
  'src/pages/discovery/DiscoveryRuns.tsx',
  'src/pages/inventory/InventoryList.tsx',
  'src/pages/inventory/NHIDetail.tsx',
  'src/pages/inventory/NHIRequest.tsx',
  'src/pages/monitoring/AlertsCenter.tsx',
  'src/pages/monitoring/IncidentDetail.tsx',
  'src/pages/monitoring/ITDRDashboard.tsx',
  'src/pages/posture/IssueDetail.tsx',
  'src/pages/posture/IssueList.tsx',
  'src/pages/posture/PostureDashboard.tsx',
  'src/pages/security/CredentialHygiene.tsx',
  'src/pages/security/RotationCenter.tsx',
  'src/pages/security/VaultManagement.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Handle placeholders first
  if (content.includes('placeholder-[#3a5a7a]')) {
    content = content.replace(/placeholder-\[#3a5a7a\]/g, 'placeholder:text-muted/50');
    changed = true;
  }
  if (content.includes('placeholder:text-[#5a7a9a]')) {
    content = content.replace(/placeholder:text-\[#5a7a9a\]/g, 'placeholder:text-muted/50');
    changed = true;
  }

  mappings.forEach(({ hex, replacement, cssVar }) => {
    // 1. Replace Tailwind arbitrary values ONLY if replacement is provided
    // This avoids replacing [#hex] with nothing.
    if (replacement) {
      const tailwindRegex = new RegExp(`\\[${hex}\\]`, 'gi');
      if (tailwindRegex.test(content)) {
        content = content.replace(tailwindRegex, replacement);
        changed = true;
      }
    }

    // 2. Replace hex in other contexts (styles, strings)
    // We look for the hex code itself.
    // To avoid double-replacing or replacing inside a var(), we check context.
    const hexRegex = new RegExp(`(?<!var\\(--color-[a-z0-9-]+\\))${hex}`, 'gi');
    if (hexRegex.test(content)) {
      // If it's inside a className like text-[#hex], and we already handled it in step 1, 
      // this might match again if step 1 didn't find it.
      // But step 1 specifically looks for [#hex].
      
      // We'll replace it with the CSS variable.
      content = content.replace(hexRegex, cssVar);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
