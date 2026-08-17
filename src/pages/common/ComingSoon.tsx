import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BRANDING } from '@/constants/branding'
import {
  SparklesIcon, ShieldCheckIcon, CubeTransparentIcon, BoltIcon,
} from '@heroicons/react/24/outline'

interface ModuleMeta {
  title: string
  phase: 1 | 2 | 3 | 4 | 5
  pillar: string
  summary: string
  outcomes: string[]
}

const PHASE_LABEL: Record<number, string> = {
  1: 'Phase 1 · See',
  2: 'Phase 2 · Understand',
  3: 'Phase 3 · Control',
  4: 'Phase 4 · Protect',
  5: 'Phase 5 · Govern AI',
}

const MODULES: Record<string, ModuleMeta> = {
  '/discovery/unmanaged': {
    title: 'Unmanaged & Shadow NHIs',
    phase: 1,
    pillar: 'Discover',
    summary: 'Surface NHIs that exist outside approved connectors, vaults, and application onboarding.',
    outcomes: ['Shadow NHI queue', 'Unmanaged credential list', 'Source attribution'],
  },
  '/intelligence/lineage': {
    title: 'NHI Lineage',
    phase: 2,
    pillar: 'Understand',
    summary: 'Map creator → identity → vault → consumer → application → data so every NHI has a complete origin story.',
    outcomes: ['Creator and owner chain', 'Secret storage location', 'Consuming workloads', 'Downstream data stores'],
  },
  '/intelligence/ownership': {
    title: 'Workforce Attribution',
    phase: 2,
    pillar: 'Govern',
    summary: 'Require creator, owner, business owner, technical owner and approver on every NHI. Orphans raise risk automatically.',
    outcomes: ['Owner coverage score', 'Orphan queue', 'Departed-employee linkage'],
  },
  '/governance/lifecycle': {
    title: 'NHI Lifecycle',
    phase: 2,
    pillar: 'Govern',
    summary: 'Track Requested → Created → Active → Review → Rotation → Suspended → Decommissioned → Archived.',
    outcomes: ['Lifecycle policies', 'Expiration and review SLAs', 'Safe decommissioning'],
  },
  '/governance/sod': {
    title: 'SoD for NHIs',
    phase: 2,
    pillar: 'Govern',
    summary: 'Detect toxic combinations where a non-human identity spans conflicting duties or systems.',
    outcomes: ['SoD policy library', 'Violation queue', 'Certification of exceptions'],
  },
  '/risk/dormant': {
    title: 'Dormant NHIs',
    phase: 2,
    pillar: 'Reduce',
    summary: 'Find identities with no usage beyond policy thresholds and queue them for disablement.',
    outcomes: ['Dormancy findings', 'Grace-period workflow', 'Disable and verify'],
  },
  '/risk/orphaned': {
    title: 'Orphaned NHIs',
    phase: 2,
    pillar: 'Reduce',
    summary: 'NHIs with no identifiable owner, especially those with production access.',
    outcomes: ['Orphan inventory', 'Owner assignment campaign', 'Auto-risk uplift'],
  },
  '/risk/expiring': {
    title: 'Expiring Credentials',
    phase: 2,
    pillar: 'Reduce',
    summary: 'Certificates, keys and tokens approaching expiry, plus weak algorithms and missing owners.',
    outcomes: ['30/60/90-day expiry view', 'Weak certificate findings', 'Owner notification'],
  },
  '/remediation/recommendations': {
    title: 'Remediation Recommendations',
    phase: 3,
    pillar: 'Reduce',
    summary: 'Explainable, auto-remediable actions for dormant, excess, expired and orphaned NHIs.',
    outcomes: ['Playbook catalog', 'Owner approval', 'Evidence capture'],
  },
  '/remediation/workflows': {
    title: 'Remediation Workflows',
    phase: 3,
    pillar: 'Reduce',
    summary: 'Reuse Identity Sphere remediation: notify → grace period → disable/revoke/rotate → verify → audit.',
    outcomes: ['Orphaned, excess privilege, expired and dormant playbooks', 'SLA and escalation'],
  },
  '/threat/attack-paths': {
    title: 'NHI Attack Paths',
    phase: 3,
    pillar: 'Protect',
    summary: 'Show how a compromised key or account can reach production data through roles, pods and clouds.',
    outcomes: ['Path visualization', 'Blast-radius overlay', 'Containment actions'],
  },
  '/threat/response': {
    title: 'Threat Response',
    phase: 4,
    pillar: 'Protect',
    summary: 'Contain compromised NHIs: revoke credentials, suspend accounts, open incidents and push to SIEM/SOAR.',
    outcomes: ['Automated containment', 'Incident workflows', 'SIEM / SOAR integration'],
  },
  '/ai/agents': {
    title: 'AI Agent Inventory',
    phase: 5,
    pillar: 'Discover',
    summary: 'Discover agents, their credentials, MCP servers and the NHIs and data they can reach.',
    outcomes: ['Agent catalog', 'Agent → NHI mapping', 'Shadow AI discovery'],
  },
  '/ai/mapping': {
    title: 'Agent → NHI & Resource Mapping',
    phase: 5,
    pillar: 'Understand',
    summary: 'Connect each agent to the tokens, service accounts and systems it uses at runtime.',
    outcomes: ['Credential inventory for agents', 'Resource reachability', 'Guardrail gaps'],
  },
  '/ai/risk': {
    title: 'AI Agent Risk',
    phase: 5,
    pillar: 'Protect',
    summary: 'Score agents for over-permission, shadow deployment and abnormal tool use.',
    outcomes: ['Agent risk scores', 'Access certification for AI', 'Attack paths through agents'],
  },
}

const PHASE_COLOR: Record<number, 'cyan' | 'amber' | 'purple' | 'green' | 'red'> = {
  1: 'cyan',
  2: 'green',
  3: 'amber',
  4: 'red',
  5: 'purple',
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const meta = MODULES[pathname] ?? {
    title: 'Roadmap capability',
    phase: 2 as const,
    pillar: 'Govern',
    summary: 'This module is on the Wisibility NHI Compass roadmap.',
    outcomes: ['Planned for a later release'],
  }

  return (
    <div className="animate-fade-up max-w-4xl">
      <PageHeader
        title={meta.title}
        subtitle={meta.summary}
        breadcrumbs={[{ label: BRANDING.product }, { label: meta.title }]}
        actions={<Badge color={PHASE_COLOR[meta.phase]}>{PHASE_LABEL[meta.phase]}</Badge>}
      />

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand shrink-0">
            <SparklesIcon className="w-6 h-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">{meta.pillar}</p>
            <p className="text-slate-700 font-medium leading-relaxed">{meta.summary}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Planned outcomes</p>
          <ul className="space-y-2">
            {meta.outcomes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheckIcon className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Compass pillars</p>
          <div className="grid grid-cols-2 gap-2">
            {BRANDING.pillars.map((p) => (
              <div key={p.key} className={`rounded-lg border px-3 py-2 ${p.label === meta.pillar ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-xs font-extrabold text-slate-900">{p.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard"><Button variant="primary">Back to Command Center</Button></Link>
        <Link to="/inventory"><Button variant="secondary">Open NHI Inventory</Button></Link>
      </div>

      <p className="mt-8 text-xs text-slate-500 flex items-center gap-2">
        <CubeTransparentIcon className="w-4 h-4" />
        {BRANDING.productFull} ships this capability in {PHASE_LABEL[meta.phase]}. Current release focuses on discovery, inventory, posture and certification.
        <BoltIcon className="w-4 h-4 ml-1" />
      </p>
    </div>
  )
}
