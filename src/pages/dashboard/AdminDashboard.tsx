import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

// ── Types ─────────────────────────────────────────────────────────────────────
type Risk = 'critical' | 'high' | 'medium' | 'low' | 'veryLow'

interface SphereNode {
  id: string; theta: number; phi: number; risk: Risk; size: number
  label?: string; sublabel?: string
}

interface NodeDetail {
  identities: number; riskScore: number; entitlements: number
  applications: string[]; violations: string[]
  lastActivity: string; trend: string
}

// ── Colours ───────────────────────────────────────────────────────────────────
const RC: Record<Risk, string> = {
  critical: '#FF4560', high: '#FF7A45', medium: '#FFB020', low: '#00C8F0', veryLow: '#00E887',
}
const RISK_LABEL: Record<Risk, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', veryLow: 'Very Low',
}

// ── Node detail data ──────────────────────────────────────────────────────────
const NODE_DETAILS: Record<string, NodeDetail> = {
  da:  { identities: 12,   riskScore: 94, entitlements: 234, applications: ['Active Directory', 'Azure AD', 'DNS Server'],       violations: ['SoD Violation', 'Excessive Privilege', 'Stale Access'],         lastActivity: '2 hours ago',   trend: '+3 this week' },
  fs:  { identities: 8,    riskScore: 78, entitlements: 156, applications: ['SAP Finance', 'Oracle ERP', 'Workday'],              violations: ['Excessive Privilege', 'Policy Breach'],                          lastActivity: '4 hours ago',   trend: 'No change' },
  ca:  { identities: 6,    riskScore: 91, entitlements: 312, applications: ['AWS Console', 'Azure Portal', 'GCP Admin'],          violations: ['SoD Violation', 'MFA Bypass', 'Excessive Privilege'],            lastActivity: '1 hour ago',    trend: '+1 this week' },
  sap: { identities: 15,   riskScore: 72, entitlements: 89,  applications: ['SAP S/4HANA', 'SAP BW', 'Fiori Apps'],              violations: ['Excessive Privilege'],                                           lastActivity: '6 hours ago',   trend: '-2 this week' },
  hr:  { identities: 1,    riskScore: 98, entitlements: 445, applications: ['AD', 'Azure AD', 'Okta', 'Salesforce', 'AWS'],       violations: ['SoD Violation', 'MFA Disabled', 'Stale Access', 'Policy Breach'],lastActivity: '30 min ago',    trend: '⚠ Immediate Action' },
  pv:  { identities: 34,   riskScore: 81, entitlements: 178, applications: ['HRIS', 'Payroll', 'Benefits Portal'],               violations: ['Excessive Privilege', 'SoD Violation'],                          lastActivity: '3 hours ago',   trend: '+5 this month' },
  ct:  { identities: 89,   riskScore: 55, entitlements: 43,  applications: ['SharePoint', 'Jira', 'Confluence'],                  violations: ['Stale Access'],                                                  lastActivity: '1 day ago',     trend: '-12 this month' },
  se:  { identities: 3240, riskScore: 28, entitlements: 18,  applications: ['M365', 'Salesforce', 'Slack'],                      violations: [],                                                                lastActivity: '1 hour ago',    trend: 'Stable' },
  du:  { identities: 456,  riskScore: 62, entitlements: 67,  applications: ['AD', 'M365', 'VPN'],                                violations: ['Stale Access', 'Dormant Account'],                               lastActivity: '94 days ago',   trend: '+23 this month' },
  va:  { identities: 234,  riskScore: 48, entitlements: 12,  applications: ['Vendor Portal', 'Procurement'],                     violations: [],                                                                lastActivity: '2 days ago',    trend: 'Stable' },
  svc: { identities: 678,  riskScore: 35, entitlements: 8,   applications: ['Internal APIs', 'Monitoring'],                      violations: ['Unused Access'],                                                  lastActivity: '12 hours ago',  trend: '+34 this month' },
}

// ── Static dashboard data ─────────────────────────────────────────────────────
const IDENTITY_CONTEXT = [
  { label: 'Employees',        count: 12580, color: '#00C8F0' },
  { label: 'Contractors',      count: 2345,  color: '#A855F7' },
  { label: 'Vendors',          count: 1089,  color: '#FFB020' },
  { label: 'Service Accounts', count: 2134,  color: '#00E887' },
  { label: 'Bots',             count: 320,   color: '#FF7A45' },
]
const LIFECYCLE = [
  { label: 'Joiners (30 days)',  count: 1234, delta: '+8% vs last month',  color: '#00E887' },
  { label: 'Movers (30 days)',   count: 2345, delta: '+12% vs last month', color: '#00C8F0' },
  { label: 'Leavers (30 days)', count: 532,  delta: '-3% vs last month',  color: '#FFB020' },
  { label: 'Dormant (90+ days)',count: 1897, delta: '+5% vs last month',  color: '#FF4560' },
]
const RISK_DIST = [
  { name: 'Critical', value: 1245, color: '#FF4560' },
  { name: 'High',     value: 2640, color: '#FF7A45' },
  { name: 'Medium',   value: 6125, color: '#FFB020' },
  { name: 'Low',      value: 5280, color: '#00C8F0' },
  { name: 'Very Low', value: 1178, color: '#00E887' },
]
const ACCESS_COMPLEXITY = [
  { label: 'Very High', value: 2153, color: '#FF4560' },
  { label: 'High',      value: 3328, color: '#FF7A45' },
  { label: 'Medium',    value: 5688, color: '#FFB020' },
  { label: 'Low',       value: 3876, color: '#00C8F0' },
  { label: 'Very Low',  value: 1423, color: '#00E887' },
]
const TOP_DRIVERS = [
  { label: 'SoD Violations',              count: 1234, color: '#FF4560' },
  { label: 'Excessive Privileges',        count: 987,  color: '#FF7A45' },
  { label: 'Dormant Privileged Accounts', count: 765,  color: '#FFB020' },
  { label: 'Unused Access',              count: 2134, color: '#00C8F0' },
  { label: 'Critical App Access',        count: 1098, color: '#A855F7' },
]
const INSIGHTS = [
  { label: 'High Risk Identities',     value: 1245, sub: '7.6% of Total',  delta: '+12% vs last month', color: '#FF4560' },
  { label: 'Toxic Access Combinations',value: 892,  sub: 'Identities',     delta: '+8% vs last month',  color: '#FF7A45' },
  { label: 'Dormant Accounts',         value: 1987, sub: '12.1% of Total', delta: '+5% vs last month',  color: '#FFB020' },
  { label: 'Excess Access',            value: 2134, sub: '13.0% of Total', delta: '+10% vs last month', color: '#00C8F0' },
]
const BIZ_IMPACT = [
  { label: 'Est. Financial Exposure',              value: '$3.2M',  color: '#FF4560', icon: '💰' },
  { label: 'Critical Identities Requiring Action', value: '1,245',  color: '#FF7A45', icon: '⚠️' },
  { label: 'SoD Violations Identified',            value: '287',    color: '#FFB020', icon: '🔒' },
  { label: 'Certification Completion',             value: '92%',    color: '#00E887', icon: '✅' },
]

// ── Sphere nodes ──────────────────────────────────────────────────────────────
const FEATURE_NODES: SphereNode[] = [
  { id: 'da',  theta: 0.3,  phi: -0.8, risk: 'critical', size: 14, label: 'Domain Admin',      sublabel: 'IT · Infrastructure'  },
  { id: 'fs',  theta: 1.2,  phi: -0.5, risk: 'high',     size: 12, label: 'Finance Super User', sublabel: 'Finance'              },
  { id: 'ca',  theta: -0.5, phi: -0.4, risk: 'critical', size: 13, label: 'Cloud Admin',        sublabel: 'IT · Cloud'           },
  { id: 'sap', theta: 1.6,  phi: -0.3, risk: 'high',     size: 11, label: 'SAP Power User',     sublabel: 'Finance'              },
  { id: 'hr',  theta: 0.8,  phi: 0.1,  risk: 'critical', size: 15, label: 'High Risk User',     sublabel: 'Multiple Violations'  },
  { id: 'pv',  theta: 0.1,  phi: -0.1, risk: 'high',     size: 12, label: 'Privileged User',    sublabel: 'HR'                   },
  { id: 'ct',  theta: 1.4,  phi: -0.6, risk: 'medium',   size: 10, label: 'Contractor',         sublabel: 'Third Party'          },
  { id: 'se',  theta: 0.6,  phi: 0.3,  risk: 'low',      size: 9,  label: 'Standard Employee',  sublabel: 'Sales'                },
  { id: 'du',  theta: -0.2, phi: 0.5,  risk: 'medium',   size: 10, label: 'Dormant User',       sublabel: 'Inactive 90+ Days'    },
  { id: 'va',  theta: 1.8,  phi: 0.4,  risk: 'medium',   size: 9,  label: 'Vendor Account',     sublabel: 'External'             },
  { id: 'svc', theta: 0.0,  phi: 0.8,  risk: 'low',      size: 8,  label: 'Service Account',    sublabel: 'Non Human'            },
]

function genBgNodes(n: number): SphereNode[] {
  const risks: Risk[] = ['critical', 'high', 'medium', 'low', 'veryLow']
  const weights = [0.075, 0.16, 0.37, 0.32, 0.075]
  let s = 42
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  return Array.from({ length: n }, (_, i) => {
    const r = rnd(); let ri = 0, cum = 0
    for (let j = 0; j < weights.length; j++) { cum += weights[j]; if (r < cum) { ri = j; break } }
    return { id: `b${i}`, theta: (rnd() - 0.5) * Math.PI * 2, phi: (rnd() - 0.5) * Math.PI, risk: risks[ri], size: 2.5 + rnd() * 4 }
  })
}

const ALL_NODES: SphereNode[] = [...FEATURE_NODES, ...genBgNodes(110)]
const TOTAL_IDS  = RISK_DIST.reduce((s, d) => s + d.value, 0)
const MAX_ACCESS = Math.max(...ACCESS_COMPLEXITY.map((a) => a.value))

// ── Node detail popup ─────────────────────────────────────────────────────────
function NodeDetailPopup({ node, x, y, containerW, containerH, onClose }: {
  node: SphereNode; x: number; y: number
  containerW: number; containerH: number; onClose: () => void
}) {
  const detail = NODE_DETAILS[node.id]
  const color  = RC[node.risk]
  const W = 260, H = detail ? 320 : 140

  // Keep popup inside the container
  const left = Math.min(Math.max(x - W / 2, 8), containerW - W - 8)
  const top  = y + 20 + H > containerH ? y - H - 12 : y + 20

  const scoreColor = (s: number) => s >= 80 ? '#FF4560' : s >= 60 ? '#FFB020' : s >= 40 ? '#00C8F0' : '#00E887'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 pointer-events-auto"
      style={{ left, top, width: W }}
    >
      <div className="bg-surface border rounded-lg shadow-2xl overflow-hidden" style={{ borderColor: color + '60' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-3 border-b" style={{ borderColor: color + '30', background: color + '12' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-mono text-[9px] uppercase tracking-[2px]" style={{ color }}>
                {RISK_LABEL[node.risk]} Risk
              </span>
            </div>
            <p className="text-sm font-bold text-bright">{node.label ?? `Identity Node`}</p>
            {node.sublabel && <p className="font-mono text-[10px] text-muted mt-0.5">{node.sublabel}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-bright transition-colors mt-0.5">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {detail ? (
          <div className="p-3 space-y-3">
            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Identities',    value: detail.identities.toLocaleString() },
                { label: 'Entitlements',  value: detail.entitlements.toLocaleString() },
                { label: 'Last Active',   value: detail.lastActivity },
              ].map((m) => (
                <div key={m.label} className="bg-surface-2 rounded p-2 text-center border border-surface-border">
                  <p className="font-mono text-[10px] font-bold text-bright">{m.value}</p>
                  <p className="font-mono text-[8px] text-muted mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Risk score bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[9px] text-muted uppercase tracking-[1px]">Risk Score</span>
                <span className="font-mono text-[10px] font-bold" style={{ color: scoreColor(detail.riskScore) }}>
                  {detail.riskScore}/100
                </span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detail.riskScore}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: scoreColor(detail.riskScore) }}
                />
              </div>
            </div>

            {/* Applications */}
            <div>
              <p className="font-mono text-[9px] text-muted uppercase tracking-[1px] mb-1">Applications</p>
              <div className="flex flex-wrap gap-1">
                {detail.applications.map((app) => (
                  <span key={app} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-2 border border-surface-border text-main">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Violations */}
            {detail.violations.length > 0 && (
              <div>
                <p className="font-mono text-[9px] text-muted uppercase tracking-[1px] mb-1">Violations</p>
                <div className="space-y-1">
                  {detail.violations.map((v) => (
                    <div key={v} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-cyber-red flex-shrink-0" />
                      <span className="text-[10px] text-cyber-red">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trend */}
            <div className="flex items-center justify-between pt-1 border-t border-surface-border">
              <span className="font-mono text-[9px] text-muted">Trend</span>
              <span className="font-mono text-[10px]" style={{ color }}>{detail.trend}</span>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-2 rounded p-2 text-center border border-surface-border">
                <p className="font-mono text-[11px] font-bold text-bright">
                  {RISK_LABEL[node.risk]}
                </p>
                <p className="font-mono text-[8px] text-muted mt-0.5">Risk Level</p>
              </div>
              <div className="bg-surface-2 rounded p-2 text-center border border-surface-border">
                <p className="font-mono text-[11px] font-bold" style={{ color }}>Active</p>
                <p className="font-mono text-[8px] text-muted mt-0.5">Status</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Canvas sphere ─────────────────────────────────────────────────────────────
function IdentitySphere() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const angleRef   = useRef(0)
  const rafRef     = useRef(0)
  const projRef    = useRef<Array<{ n: SphereNode; px: number; py: number; z: number; r: number }>>([])
  const hoveredRef = useRef<string | null>(null)

  const [selected, setSelected] = useState<{ node: SphereNode; x: number; y: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const p = container.getBoundingClientRect()
      canvas.width  = p.width
      canvas.height = p.height
      setContainerSize({ w: p.width, h: p.height })
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height
      const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy
      let found: string | null = null
      for (let i = projRef.current.length - 1; i >= 0; i--) {
        const { n, px, py, r } = projRef.current[i]
        if ((mx - px) ** 2 + (my - py) ** 2 < (r * 2) ** 2) { found = n.id; break }
      }
      hoveredRef.current = found
      canvas.style.cursor = found ? 'pointer' : 'default'
    }

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height
      const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy
      const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top
      for (let i = projRef.current.length - 1; i >= 0; i--) {
        const { n, px, py, r } = projRef.current[i]
        if ((mx - px) ** 2 + (my - py) ** 2 < (r * 2) ** 2) {
          setSelected((prev) => prev?.node.id === n.id ? null : { node: n, x: cssX, y: cssY })
          return
        }
      }
      setSelected(null)
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)

    function project(theta: number, phi: number, ang: number, cx: number, cy: number, R: number) {
      const x0 = Math.cos(phi) * Math.cos(theta)
      const y0 = Math.sin(phi)
      const z0 = Math.cos(phi) * Math.sin(theta)
      const x  = x0 * Math.cos(ang) + z0 * Math.sin(ang)
      const z  = -x0 * Math.sin(ang) + z0 * Math.cos(ang)
      const d  = z + 2.2
      return { px: cx + (x / d) * R, py: cy - (y0 / d) * R, z }
    }

    function draw() {
      const W = canvas.width, H = canvas.height
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return }
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.85
      const ang = angleRef.current

      ctx.clearRect(0, 0, W, H)

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3)
      bg.addColorStop(0, 'rgba(0,50,100,0.35)')
      bg.addColorStop(1, 'rgba(4,8,15,0)')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()
      for (const lat of [-60, -30, 0, 30, 60]) {
        const phi = (lat * Math.PI) / 180
        ctx.beginPath(); let f = true
        for (let lon = 0; lon <= 362; lon += 4) {
          const { px, py, z } = project((lon * Math.PI) / 180, phi, ang, cx, cy, R)
          const a = ((z + 1) / 2) * 0.15 + 0.03
          ctx.strokeStyle = `rgba(0,200,240,${a.toFixed(2)})`; ctx.lineWidth = 0.5
          f ? (ctx.moveTo(px, py), f = false) : ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath(); let f = true
        for (let lat = -90; lat <= 92; lat += 4) {
          const { px, py, z } = project((lon * Math.PI) / 180, (lat * Math.PI) / 180, ang, cx, cy, R)
          const a = ((z + 1) / 2) * 0.15 + 0.03
          ctx.strokeStyle = `rgba(0,200,240,${a.toFixed(2)})`; ctx.lineWidth = 0.5
          f ? (ctx.moveTo(px, py), f = false) : ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      ctx.restore()

      // Project + sort back-to-front
      const projected = ALL_NODES
        .map((n) => {
          const { px, py, z } = project(n.theta, n.phi, ang, cx, cy, R)
          const depth = (z + 1) / 2
          const r = n.size * (0.55 + depth * 0.65)
          return { n, px, py, z, r }
        })
        .sort((a, b) => a.z - b.z)

      projRef.current = projected

      const hovId = hoveredRef.current
      const selId = selected?.node.id

      for (const { n, px, py, z, r } of projected) {
        if ((px - cx) ** 2 + (py - cy) ** 2 > (R * 1.08) ** 2) continue
        const depth  = (z + 1) / 2
        const color  = RC[n.risk]
        const isHov  = n.id === hovId
        const isSel  = n.id === selId
        const alpha  = Math.round((0.35 + depth * 0.65) * 255).toString(16).padStart(2, '0')
        const glowR  = isHov || isSel ? r * 5 : (n.label ? r * 3.5 : 0)

        if (glowR > 0) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, glowR)
          g.addColorStop(0, color + (isHov || isSel ? '80' : '45'))
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2); ctx.fill()
        }

        const drawR = isHov || isSel ? r * 1.35 : r
        ctx.beginPath(); ctx.arc(px, py, drawR, 0, Math.PI * 2)
        ctx.fillStyle = color + alpha; ctx.fill()
        if (n.label || isHov || isSel) {
          ctx.strokeStyle = color; ctx.lineWidth = isHov || isSel ? 2 : 1.5; ctx.stroke()
        }
      }

      // Labels
      for (const { n, px, py, z } of projected) {
        if (!n.label) continue
        const depth = (z + 1) / 2
        if (depth < 0.45) continue
        const ta    = (depth - 0.45) / 0.55
        const right = px > cx
        const lx    = px + (right ? 24 : -24)
        const ly    = py - 18

        ctx.save(); ctx.globalAlpha = ta
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lx, ly)
        ctx.strokeStyle = RC[n.risk] + '90'; ctx.lineWidth = 0.8; ctx.stroke()
        ctx.font = 'bold 9px "IBM Plex Mono",monospace'
        ctx.fillStyle = '#e2eeff'; ctx.textAlign = right ? 'left' : 'right'
        ctx.fillText(n.label, lx + (right ? 3 : -3), ly)
        if (n.sublabel) {
          ctx.font = '8px "IBM Plex Mono",monospace'; ctx.fillStyle = '#5a7a9a'
          ctx.fillText(n.sublabel, lx + (right ? 3 : -3), ly + 11)
        }
        ctx.restore()
      }

      angleRef.current += 0.003
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
      ro.disconnect()
    }
  }, [selected])   // re-bind click so selectedId is current in draw highlight

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <AnimatePresence>
        {selected && (
          <NodeDetailPopup
            key={selected.node.id}
            node={selected.node}
            x={selected.x}
            y={selected.y}
            containerW={containerSize.w}
            containerH={containerSize.h}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="animate-fade-up space-y-3 pb-6">

      <div className="text-center pt-1">
        <p className="font-mono text-[9px] tracking-[4px] text-cyber-cyan opacity-60 uppercase mb-1">
          3 Dimensional Identity Intelligence View
        </p>
        <h1 className="font-display text-xl font-bold text-bright tracking-widest">
          WISBILITY <span className="text-cyber-cyan">IDENTITY SPHERE</span>
        </h1>
      </div>

      <div className="flex gap-3" style={{ height: 720 }}>

        {/* LEFT */}
        <div className="w-52 shrink-0 flex flex-col gap-2 overflow-y-auto pr-0.5">
          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-cyber-cyan uppercase mb-2">Identity Sphere Explorer</p>
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-2 top-2 w-3 h-3 text-muted" />
              <input placeholder="Search Identity" className="w-full bg-surface-2 border border-surface-border rounded pl-6 pr-2 py-1.5 text-[11px] text-main placeholder:text-muted focus:outline-none focus:border-cyber-cyan/50 transition-colors" />
            </div>
            <select className="w-full bg-surface-2 border border-surface-border rounded px-2 py-1.5 text-[11px] text-muted focus:outline-none">
              <option>All Identities</option>
            </select>
          </div>

          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-2">Identity Context (X)</p>
            {IDENTITY_CONTEXT.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-surface-border/40 last:border-0">
                <span className="text-[11px] text-main">{item.label}</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: item.color }}>{item.count.toLocaleString()}</span>
              </div>
            ))}
            <button className="mt-1.5 text-[10px] text-cyber-cyan hover:underline font-mono">View All ›</button>
          </div>

          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-2">Lifecycle Summary</p>
            {LIFECYCLE.map((item) => (
              <div key={item.label} className="flex items-start justify-between py-1.5 border-b border-surface-border/40 last:border-0">
                <div>
                  <p className="text-[11px] text-main">{item.label}</p>
                  <p className="font-mono text-[9px] mt-0.5" style={{ color: item.color }}>{item.delta}</p>
                </div>
                <span className="font-mono text-[13px] font-bold" style={{ color: item.color }}>{item.count.toLocaleString()}</span>
              </div>
            ))}
            <button className="mt-1.5 text-[10px] text-cyber-cyan hover:underline font-mono">View All ›</button>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 relative bg-surface border border-surface-border rounded-lg overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
            <p className="font-mono text-[7px] tracking-[2px] text-cyber-red uppercase">Z Axis · Risk &amp; Business Impact</p>
            <p className="font-mono text-[7px] text-cyber-red">▲ High Impact / High Risk</p>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
            <p className="font-mono text-[7px] text-cyber-green">Low Impact / Low Risk ▼</p>
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <p className="font-mono text-[7px] tracking-[2px] text-cyber-cyan uppercase" style={{ transform: 'rotate(180deg)' }}>X Axis · Identity Context</p>
          </div>
          <div className="absolute left-2 bottom-8 z-10 pointer-events-none">
            <p className="font-mono text-[7px] text-muted">Low Context</p>
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <p className="font-mono text-[7px] tracking-[2px] text-cyber-amber uppercase">Y Axis · Access Complexity</p>
          </div>
          <div className="absolute right-2 bottom-8 z-10 pointer-events-none">
            <p className="font-mono text-[7px] text-muted">Low Complexity</p>
          </div>
          <IdentitySphere />
        </div>

        {/* RIGHT */}
        <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pl-0.5">
          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-2">Identity Legend</p>
            <div className="space-y-1">
              {Object.entries(RC).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-main">{key === 'veryLow' ? 'Very Low Risk' : `${key[0].toUpperCase()}${key.slice(1)} Risk`}</span>
                </div>
              ))}
              <div className="border-t border-surface-border mt-1.5 pt-1.5 space-y-1">
                {[['Employee', '#00C8F0'], ['Contractor', '#A855F7'], ['Service Account', '#00E887'], ['Bot / Non Human', '#FF7A45']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm border flex-shrink-0" style={{ borderColor: color }} />
                    <span className="text-[11px] text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-2">Risk Distribution (Z)</p>
            <div className="flex items-center gap-2">
              <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={RISK_DIST} cx="50%" cy="50%" innerRadius={26} outerRadius={44} dataKey="value" strokeWidth={0}>
                      {RISK_DIST.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-[11px] font-bold text-bright leading-tight">{TOTAL_IDS.toLocaleString()}</span>
                  <span className="font-mono text-[7px] text-muted">Identities</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {RISK_DIST.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[10px] text-muted">{d.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-main">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mt-1.5 text-[10px] text-cyber-cyan hover:underline font-mono">View Risk Heatmap ›</button>
          </div>

          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-0.5">Access Complexity (Y)</p>
            <p className="text-[9px] text-muted mb-2">By Complexity Score</p>
            {ACCESS_COMPLEXITY.map((item) => (
              <div key={item.label} className="mb-2">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-muted">{item.label}</span>
                  <span className="font-mono text-[10px] text-main">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(item.value / MAX_ACCESS) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 }} style={{ background: item.color }} />
                </div>
              </div>
            ))}
            <button className="mt-0.5 text-[10px] text-cyber-cyan hover:underline font-mono">View Access Analytics ›</button>
          </div>

          <div className="bg-surface border border-surface-border rounded-lg p-3">
            <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-2">Top Risk Drivers</p>
            {TOP_DRIVERS.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-surface-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-[11px] text-main">{item.label}</span>
                </div>
                <span className="font-mono text-[11px] font-bold" style={{ color: item.color }}>{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-4">
          <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-3">Identity Sphere Insights</p>
          <div className="grid grid-cols-2 gap-2">
            {INSIGHTS.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-surface-2 border border-surface-border rounded-lg p-3">
                <p className="font-display text-2xl font-bold leading-none" style={{ color: item.color }}>{item.value.toLocaleString()}</p>
                <p className="text-[10px] text-main mt-1 leading-tight">{item.label}</p>
                <p className="font-mono text-[9px] text-muted mt-0.5">{item.sub}</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: item.color }}>{item.delta}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-lg p-4 flex flex-col">
          <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-3">Identity Trust Score Distribution</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="font-display text-5xl font-bold text-bright">54</p>
              <p className="text-[11px] text-muted mt-1">Average Trust Score</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative h-3 rounded-full overflow-hidden">
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #FF4560 0%, #FFB020 40%, #00C8F0 70%, #00E887 100%)' }} />
              <div className="absolute top-0 bottom-0 w-px bg-white/90" style={{ left: '54%' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[9px] text-cyber-red">0  High Risk</span>
              <span className="font-mono text-[9px] text-muted">25</span>
              <span className="font-mono text-[9px] text-muted">50</span>
              <span className="font-mono text-[9px] text-muted">75</span>
              <span className="font-mono text-[9px] text-cyber-green">100  High Trust</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-lg p-4">
          <p className="font-mono text-[9px] tracking-[2px] text-muted uppercase mb-3">Business Impact Preview</p>
          <div className="grid grid-cols-2 gap-2">
            {BIZ_IMPACT.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="bg-surface-2 border border-surface-border rounded-lg p-3 text-center">
                <p className="text-xl mb-1">{item.icon}</p>
                <p className="font-display text-lg font-bold leading-none" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[9px] text-muted mt-1 leading-tight">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 flex-wrap py-1 border-t border-surface-border/50 pt-3">
        {[
          { icon: '🔭', label: '360° Identity Visibility',  sub: 'Unified view of all identity types'   },
          { icon: '🤖', label: 'AI Powered Risk Scoring',   sub: 'Continuous risk evaluation'           },
          { icon: '🎯', label: 'Business Context Driven',   sub: 'Align identity with business impact'  },
          { icon: '⚡', label: 'Actionable Intelligence',   sub: 'Prioritize what matters most'         },
          { icon: '📡', label: 'Real-time Intelligence',    sub: 'Always up to date'                    },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="text-lg">{f.icon}</span>
            <div>
              <p className="font-mono text-[10px] text-main">{f.label}</p>
              <p className="font-mono text-[9px] text-muted">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
