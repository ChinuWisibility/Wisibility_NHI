import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { usePostureReport } from '@/hooks/usePosture'
import { 
  ShieldCheckIcon, 
  MagnifyingGlassIcon, 
  TagIcon, 
  SparklesIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'

type TabType = 'discovery' | 'classification' | 'hygiene'

export default function PostureDashboard() {
  const { data, isLoading } = usePostureReport()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('discovery')

  const tabs = [
    { id: 'discovery', label: 'Discovery', icon: <MagnifyingGlassIcon className="w-4 h-4" /> },
    { id: 'classification', label: 'Classification', icon: <TagIcon className="w-4 h-4" /> },
    { id: 'hygiene', label: 'Hygiene', icon: <SparklesIcon className="w-4 h-4" /> },
  ]

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!data) return <div className="text-center py-24 text-muted">No posture data available.</div>

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Posture Management"
        subtitle="NHI lifecycle management, hygiene metrics, and classification insights."
        breadcrumbs={[{ label: 'Posture' }, { label: 'Dashboard' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/posture/issues')}>
            View Open Issues
          </Button>
        }
      />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Overall Posture"
          value={`${data.score}%`}
          sub={`${data.delta > 0 ? '+' : ''}${data.delta}% vs last week`}
          icon={<ShieldCheckIcon className="w-5 h-5" />}
          accent={data.score > 70 ? 'green' : data.score > 50 ? 'amber' : 'red'}
        />
        <StatCard label="Open Issues" value={data.open} sub="Requires attention" accent={data.open > 0 ? 'red' : 'green'} />
        <StatCard label="Connectors" value={data.discovery.connectorsCount} sub="Identity sources" accent="cyan" />
        <StatCard label="NHI Assets" value={data.discovery.totalAccounts} sub="Total discovered" accent="purple" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
                : 'border-transparent text-muted hover:text-main hover:bg-surface-light/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'discovery' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card accent="cyan">
              <CardHeader>NHI Distribution by Connector</CardHeader>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.discovery.byConnector}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                    <XAxis dataKey="id" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)', fontSize: '12px' }}
                      cursor={{ fill: 'rgba(0, 242, 255, 0.05)' }}
                    />
                    <Bar dataKey="count" fill="#00f2ff" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardHeader>Discovery Status</CardHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center p-3 bg-surface-light rounded-lg border border-surface-border">
                  <div className="flex items-center gap-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-cyber-cyan" />
                    <div>
                      <p className="text-xs font-bold text-bright">Continuous Discovery</p>
                      <p className="text-[10px] text-muted">Active on {data.discovery.connectorsCount} sources</p>
                    </div>
                  </div>
                  <Badge color="green">Active</Badge>
                </div>
                <div className="p-4 border border-surface-border rounded-lg">
                  <p className="text-xs text-muted mb-2 uppercase tracking-wider font-bold">Account Scenarity</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-main">Recent ( &lt; 30 days)</span>
                      <span className="text-cyber-cyan">65%</span>
                    </div>
                    <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyber-cyan h-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-main">Legacy ( &gt; 1 year)</span>
                      <span className="text-amber-400">12%</span>
                    </div>
                    <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'classification' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="flex flex-col items-center py-6">
              <p className="text-xs font-bold text-muted uppercase mb-4">Ownership</p>
              <div className="relative h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Assigned', value: data.classification.ownership.assigned },
                        { name: 'Unassigned', value: data.classification.ownership.unassigned },
                      ]}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#00f2ff" />
                      <Cell fill="var(--color-surface-3)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-bold text-bright">
                    {Math.round((data.classification.ownership.assigned / (data.classification.ownership.assigned + data.classification.ownership.unassigned)) * 100)}%
                  </p>
                  <p className="text-[8px] text-muted">MAPPED</p>
                </div>
              </div>
              <p className="text-[10px] text-main mt-4 text-center px-4">
                Assigning NHIs to applications ensures accountability.
              </p>
            </Card>

            <Card className="flex flex-col py-6 px-4">
              <p className="text-xs font-bold text-muted uppercase mb-4 text-center">Privilege Levels</p>
              <div className="space-y-3">
                {[
                  { label: 'Admin', value: data.classification.privilege.admin, color: 'bg-red-500' },
                  { label: 'Elevated', value: data.classification.privilege.elevated, color: 'bg-orange-500' },
                  { label: 'Standard', value: data.classification.privilege.standard, color: 'bg-blue-500' },
                  { label: 'Read-only', value: data.classification.privilege.readonly, color: 'bg-green-500' },
                ].map((p) => (
                  <div key={p.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-main">{p.label}</span>
                      <span className="text-muted font-mono">{p.value}</span>
                    </div>
                    <div className="w-full bg-surface-light h-1 rounded-full overflow-hidden">
                      <div 
                        className={p.color} 
                        style={{ width: `${(p.value / data.discovery.totalAccounts) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col py-6 px-4">
              <p className="text-xs font-bold text-muted uppercase mb-4 text-center">Breadth of Access</p>
              <div className="h-40 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Low', val: data.classification.breadth.low },
                    { name: 'Med', val: data.classification.breadth.medium },
                    { name: 'High', val: data.classification.breadth.high },
                  ]}>
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)', fontSize: '10px' }}
                    />
                    <Bar dataKey="val" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted mt-2 text-center">Number of assets accessible per NHI</p>
            </Card>

            <Card className="flex flex-col py-6 px-4">
              <p className="text-xs font-bold text-muted uppercase mb-4 text-center">Account Usage</p>
              <div className="space-y-4">
                <div className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg text-center">
                  <p className="text-xl font-mono font-bold text-green-400">{data.classification.usage.active}</p>
                  <p className="text-[9px] text-green-500/70 uppercase">Active NHIs</p>
                </div>
                <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-center">
                  <p className="text-xl font-mono font-bold text-amber-400">{data.classification.usage.dormant}</p>
                  <p className="text-[9px] text-amber-500/70 uppercase">Dormant (Stale)</p>
                </div>
                <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-xl font-mono font-bold text-blue-400">{data.classification.usage.pending}</p>
                  <p className="text-[9px] text-blue-500/70 uppercase">Pending Review</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'hygiene' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <HygieneMetric 
                label="Excessive Permissions" 
                value={data.hygiene.excessivePermissions} 
                icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
                description="Admin accounts with low usage or breadth."
              />
              <HygieneMetric 
                label="Inactive Accounts" 
                value={data.hygiene.inactiveAccounts} 
                icon={<ClockIcon className="w-5 h-5 text-amber-500" />}
                description="NHIs not used in the last 90 days."
              />
              <HygieneMetric 
                label="Shared Accounts" 
                value={data.hygiene.sharedAccounts} 
                icon={<UsersIcon className="w-5 h-5 text-purple-500" />}
                description="Used by multiple apps or services."
              />
            </div>

            <Card accent="amber" className="lg:col-span-2">
              <CardHeader>Environment Segregation</CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                <div className="flex flex-col items-center">
                  <div className="relative h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Prod', value: data.hygiene.envSegregation.prod },
                            { name: 'Non-Prod', value: data.hygiene.envSegregation.nonProd },
                          ]}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-[10px] text-muted">PROD ({data.hygiene.envSegregation.prod})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-[10px] text-muted">NON-PROD ({data.hygiene.envSegregation.nonProd})</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-main leading-relaxed">
                    Prevent lateral movement by ensuring NHIs are not shared across production and non-production environments.
                  </p>
                  <div className="p-3 bg-surface-light rounded border border-surface-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-bright">Cross-Env Risks</span>
                      <span className="text-[10px] text-red-500">3 Identified</span>
                    </div>
                    <p className="text-[9px] text-muted">NHIs used in both PROD and STAGING discovered in 2 connectors.</p>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">
                    Run Segregation Audit
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function HygieneMetric({ label, value, icon, description }: { label: string, value: number, icon: React.ReactNode, description: string }) {
  return (
    <Card className="p-4 hover:border-surface-border/80 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-light rounded-lg border border-surface-border">
            {icon}
          </div>
          <div>
            <p className="text-xs font-bold text-bright">{label}</p>
            <p className="text-[9px] text-muted">{description}</p>
          </div>
        </div>
        <p className="text-xl font-mono font-bold text-cyber-cyan">{value}</p>
      </div>
      <div className="flex justify-end">
        <button className="text-[9px] text-cyber-cyan hover:underline uppercase font-bold tracking-wider">
          Fix Now →
        </button>
      </div>
    </Card>
  )
}
