import fs from 'fs';
import path from 'path';

const mappings = [
  { hex: '#5a7a9a', replacement: 'muted', cssVar: 'var(--color-text-muted)' },
  { hex: '#b8cfe6', replacement: 'main', cssVar: 'var(--color-text-main)' },
  { hex: '#e2eeff', replacement: 'bright', cssVar: 'var(--color-text-bright)' }
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
  'src/pages/dashboard/DevPortalDashboard.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  mappings.forEach(({ hex, replacement, cssVar }) => {
    // Replace Tailwind arbitrary values: [#hex] -> replacement
    const tailwindRegex = new RegExp(`\\[${hex}\\]`, 'gi');
    if (tailwindRegex.test(content)) {
      content = content.replace(tailwindRegex, replacement);
      changed = true;
    }

    // Replace hex in other contexts (styles, strings)
    // We look for the hex code itself. 
    // If it's in a string like '#5a7a9a', we replace it with the CSS variable.
    // We should be careful not to replace it if it's already part of a replacement.
    
    // Specifically looking for '#hex' or "#hex"
    const hexRegex = new RegExp(`(['"])${hex}\\1`, 'gi');
    if (hexRegex.test(content)) {
      content = content.replace(hexRegex, `$1${cssVar}$1`);
      changed = true;
    }
    
    // Also look for hex without quotes if it's in a JS object property like color: '#hex'
    // but the above regex handles that if it has quotes.
    // If it's like color: "#hex", it also handles it.
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
});
