import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { historyAPI, chatAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  Activity, Image, Brain, Microscope, Stethoscope, MessageCircle,
  ChevronRight, Bell, FileText,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
  AreaChart, Area, ComposedChart,
} from 'recharts'

const TEAL = '#006666'
const TEAL_SOFT = 'rgba(0,102,102,0.15)'
const TEXT = '#1E2938'

const RISK_COLORS = { low: '#00A63D', moderate: '#FE9900', high: '#FF2157' }
const BAR_PALETTE = ['#006666', '#0F766E', '#14B8A6', '#5EEAD4', '#FE9900', '#FF2157', '#1E2938', '#A78BFA']

const TEST_LABELS = {
  xray: 'Chest X-Ray', ecg: 'ECG', ct: 'CT Scan', skin: 'Skin', symptoms: 'Disease Checkup',
}

const QUICK_ACTIONS = [
  { to: '/patient/symptoms',          icon: Stethoscope,   label: 'Symptoms' },
  { to: '/patient/analyze?test=xray', icon: Image,         label: 'X-Ray' },
  { to: '/patient/analyze?test=ecg',  icon: Activity,      label: 'ECG' },
  { to: '/patient/analyze?test=skin', icon: Brain,         label: 'Skin' },
  { to: '/patient/analyze?test=ct',   icon: Microscope,    label: 'CT Scan' },
  { to: '/patient/chat',              icon: MessageCircle, label: 'AI Chat' },
]

function buildChartData(reports) {
  const timeline = [...reports]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(r => ({
      date:      format(new Date(r.created_at), 'MMM d'),
      risk:      r.risk_score ?? 0,
      riskLevel: r.risk_level,
      type:      TEST_LABELS[r.test_type] || r.test_type,
    }))

  const condMap = {}
  for (const r of reports) {
    const p = r.prediction
    if (!p || p === 'Normal' || p === 'Unable to analyze') continue
    condMap[p] = (condMap[p] || 0) + 1
  }
  const conditions = Object.entries(condMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  const typeMap = {}
  for (const r of reports) {
    const label = TEST_LABELS[r.test_type] || r.test_type
    typeMap[label] = (typeMap[label] || 0) + 1
  }
  const types = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

  return { timeline, conditions, types }
}

// ── Line draw animation hook ────────────────────────────────────────────────
// Finds the rendered SVG path(s) for the line and animates strokeDashoffset
// from full-length → 0, producing a left-to-right drawing effect over ~2.4s.
// The area fill fades in afterwards so the line leads the reveal.
function useLineDrawAnimation(ref, deps = []) {
  useEffect(() => {
    if (!ref.current) return

    const id = setTimeout(() => {
      // Animate the line path(s)
      const paths = ref.current.querySelectorAll('.recharts-line-curve')
      paths.forEach(path => {
        const length = path.getTotalLength()
        // Reset without transition first
        path.style.transition = 'none'
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        // Force reflow so the browser registers the starting state
        path.getBoundingClientRect()
        // Now animate to drawn state
        path.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(0.4, 0, 0.2, 1)'
        path.style.strokeDashoffset = '0'
      })

      // Area fill fades in after the line is mostly drawn (~1.8s in)
      const areas = ref.current.querySelectorAll('.recharts-area-area')
      areas.forEach(area => {
        area.style.opacity = '0'
        area.style.transition = 'none'
        area.getBoundingClientRect()
        area.style.transition = 'opacity 0.9s ease 1.8s'
        area.style.opacity = '1'
      })

      // Dots pop in one by one, staggered along the timeline
      const dots = ref.current.querySelectorAll('.recharts-line .recharts-dot circle, .recharts-line .recharts-dot g')
      dots.forEach((dot, i) => {
        dot.style.opacity = '0'
        dot.style.transform = 'scale(0)'
        dot.style.transformOrigin = `${dot.getAttribute('cx') || 0}px ${dot.getAttribute('cy') || 0}px`
        dot.style.transition = 'none'
        dot.getBoundingClientRect()
        const delay = 0.3 + (i / Math.max(dots.length - 1, 1)) * 1.8
        dot.style.transition = `opacity 0.3s ease ${delay}s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`
        dot.style.opacity = '1'
        dot.style.transform = 'scale(1)'
      })
    }, 120) // slight delay so Recharts finishes painting the SVG

    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Bar draw animation hook ─────────────────────────────────────────────────
// Each bar rect scales in from scaleX(0) → scaleX(1), staggered top-to-bottom,
// completing the full sequence in ~2s.
function useBarDrawAnimation(ref, deps = []) {
  useEffect(() => {
    if (!ref.current) return

    const id = setTimeout(() => {
      const rects = ref.current.querySelectorAll('.recharts-bar-rectangle path, .recharts-bar-rectangle rect')
      rects.forEach((rect, i) => {
        // Get the x origin of the bar so we scale from the left edge
        const x = rect.getAttribute('x') || rect.getBoundingClientRect().x
        rect.style.transformOrigin = `${x}px center`
        rect.style.transition = 'none'
        rect.style.transform = 'scaleX(0)'
        rect.style.opacity = '0'
        rect.getBoundingClientRect() // force reflow
        const delay = 0.1 + i * 0.18 // stagger each bar 180ms apart
        rect.style.transition = `transform 0.55s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, opacity 0.2s ease ${delay}s`
        rect.style.transform = 'scaleX(1)'
        rect.style.opacity = '1'
      })
    }, 120)

    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Sub-components ──────────────────────────────────────────────────────────

function RiskDot({ cx, cy, payload, index, isLast }) {
  const color = RISK_COLORS[payload.riskLevel] || '#94a3b8'
  if (isLast) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={color} stroke="#E7E5E4" strokeWidth={2}>
          <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={5} fill="none" stroke={color} strokeWidth={2} opacity={0.6}>
          <animate attributeName="r" values="5;14;5" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
    )
  }
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#E7E5E4" strokeWidth={2} />
}

function RiskPill({ level, score }) {
  return (
    <span className="neu-pill text-[#1E2938]">
      <span className={`w-1.5 h-1.5 rounded-full risk-dot-${level || 'low'}`} />
      {level || 'low'} · {score ?? '—'}
    </span>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuthStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread]   = useState(0)

  const chartRef = useRef(null)
  const barRef   = useRef(null)

  useEffect(() => {
    historyAPI.list().then(r => setReports(r.data)).catch(() => {}).finally(() => setLoading(false))
    chatAPI.unreadCount().then(r => setUnread(r.data.count)).catch(() => {})
  }, [])

  const highRisk = reports.filter(r => r.risk_level === 'high').length
  const recent   = reports.slice(0, 5)
  const { timeline, conditions, types } = buildChartData(reports)

  // Trigger the draw animation whenever timeline data changes
  useLineDrawAnimation(chartRef, [timeline])
  useBarDrawAnimation(barRef, [conditions])

  return (
    <div className="neu-surface min-h-full p-6 lg:p-8 font-display">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
        <div>
          <p className="font-caps text-[10px] text-[#006666] mb-1">Patient Dashboard</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1E2938] leading-tight">
            Good day, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-sans">
            {reports.length === 0
              ? 'Run your first screening to get started.'
              : `${reports.length} report${reports.length !== 1 ? 's' : ''} on file · last activity ${
                  reports[0] ? formatDistanceToNow(new Date(reports[0].created_at), { addSuffix: true }) : '—'
                }`}
          </p>
        </div>
        {user?.display_id && (
          <span className="neu-pill text-[#006666]">{user.display_id}</span>
        )}
      </div>

      {/* ── Doctor message banner ──────────────────────────────────────── */}
      {unread > 0 && (
        <Link
          to="/patient/chat"
          className="neu-card flex items-center justify-between mb-6 p-4 group transition-all hover:scale-[1.005]"
        >
          <div className="flex items-center gap-3">
            <div className="neu-icon-tile-accent w-10 h-10 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E2938]">
                {unread} new message{unread !== 1 ? 's' : ''} from your doctor
              </p>
              <p className="font-caps text-[10px] text-slate-500 mt-0.5">Tap to read in AI Chat</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#006666] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 lg:gap-5 mb-7">
        <div className="neu-card p-5">
          <p className="font-caps text-[10px] text-slate-500 mb-2">Total tests</p>
          <p className="text-4xl font-bold text-[#006666]">{reports.length}</p>
        </div>
        <div className="neu-card p-5">
          <p className="font-caps text-[10px] text-slate-500 mb-2">High risk</p>
          <p className={`text-4xl font-bold ${highRisk > 0 ? 'text-[#FF2157]' : 'text-[#00A63D]'}`}>
            {highRisk}
          </p>
        </div>
        <div className="neu-card p-5">
          <p className="font-caps text-[10px] text-slate-500 mb-2">Latest risk</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-4xl font-bold text-[#1E2938]">{reports[0]?.risk_score ?? '—'}</p>
            {reports[0]?.risk_level && (
              <RiskPill level={reports[0].risk_level} score={null} />
            )}
          </div>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      {!loading && reports.length > 0 && (
        <div className="mb-7">
          <h2 className="font-caps text-[11px] text-slate-500 mb-4">Health trends</h2>
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">

            {/* Risk over time — line draw animation */}
            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#1E2938]">Risk score over time</p>
                <span className="flex items-center gap-1.5 font-caps text-[9px] text-[#00A63D]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A63D] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00A63D]" />
                  </span>
                  LIVE
                </span>
              </div>

              {timeline.length < 2 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-sans">
                  Run more tests to see your trend.
                </p>
              ) : (
                /* ref wrapper — the hook queries inside this div */
                <div ref={chartRef}>
                  <ResponsiveContainer width="100%" height={210}>
                    <ComposedChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="riskArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={TEAL} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,56,0.08)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      />
                      <Tooltip
                        cursor={{ stroke: TEAL, strokeWidth: 1, strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="neu-card-sm px-3 py-2 text-xs" style={{ background: '#E7E5E4' }}>
                              <p className="font-bold text-[#1E2938]">{d.date}</p>
                              <p className="text-slate-500">{d.type}</p>
                              <p className="text-slate-700">Score: <span className="font-bold">{d.risk}</span></p>
                            </div>
                          )
                        }}
                      />
                      {/* isAnimationActive={false} — we handle animation ourselves */}
                      <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="none"
                        fill="url(#riskArea)"
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke={TEAL}
                        strokeWidth={2.5}
                        dot={(props) => (
                          <RiskDot {...props} isLast={props.index === timeline.length - 1} />
                        )}
                        activeDot={{ r: 7, fill: TEAL, stroke: '#E7E5E4', strokeWidth: 3 }}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 justify-center">
                {Object.entries(RISK_COLORS).map(([lvl, color]) => (
                  <span key={lvl} className="flex items-center gap-1 font-caps text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            {/* Conditions OR test types */}
            {conditions.length > 0 ? (
              <div className="neu-card p-5">
                <p className="text-sm font-bold text-[#1E2938] mb-4">Detected conditions</p>
                <div ref={barRef}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={conditions} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                    <defs>
                      {BAR_PALETTE.map((c, i) => (
                        <linearGradient key={i} id={`patBar${i}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%"   stopColor={c} stopOpacity={0.55} />
                          <stop offset="100%" stopColor={c} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }}
                      width={130}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,102,102,0.06)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="neu-card-sm px-3 py-2 text-xs" style={{ background: '#E7E5E4' }}>
                            <p className="font-bold text-[#1E2938]">{payload[0].payload.name}</p>
                            <p className="text-slate-500">
                              Detected{' '}
                              <span className="font-bold text-[#006666]">{payload[0].value}</span>
                              {' '}time{payload[0].value !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 8, 8, 0]}
                      isAnimationActive={false}
                    >
                      {conditions.map((_, i) => (
                        <Cell key={i} fill={`url(#patBar${i % BAR_PALETTE.length})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="neu-card p-5">
                <p className="text-sm font-bold text-[#1E2938] mb-4">Tests by type</p>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={types}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={32}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      isAnimationActive
                      animationDuration={900}
                      animationBegin={150}
                      animationEasing="ease-out"
                    >
                      {types.map((_, i) => (
                        <Cell
                          key={i}
                          fill={BAR_PALETTE[i % BAR_PALETTE.length]}
                          stroke="#E7E5E4"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div className="mb-7">
        <h2 className="font-caps text-[11px] text-slate-500 mb-4">Quick actions</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label }) => (
            <Link
              key={label}
              to={to}
              className="neu-tile flex flex-col items-center justify-center gap-2 p-4 group"
            >
              <span className="neu-icon-tile-accent w-10 h-10">
                <Icon className="w-4 h-4" />
              </span>
              <span className="font-caps text-[10px] text-[#1E2938]">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent reports ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-caps text-[11px] text-slate-500">Recent reports</h2>
          <Link
            to="/patient/history"
            className="font-caps text-[10px] text-[#006666] hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="neu-card flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : recent.length === 0 ? (
          <div className="neu-card text-center py-12">
            <p className="text-slate-500 mb-4 font-sans text-sm">
              No reports yet. Run your first screening.
            </p>
            <Link
              to="/patient/analyze"
              className="neu-btn-primary inline-flex font-display"
            >
              Start analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(r => (
              <Link
                key={r.report_id}
                to="/patient/history"
                className="neu-card flex items-center justify-between p-4 group transition-all hover:scale-[1.003]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="neu-icon-tile w-11 h-11 shrink-0">
                    <FileText className="w-4 h-4 text-[#006666]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E2938] text-sm truncate">
                      {TEST_LABELS[r.test_type] || r.test_type} · {r.prediction}
                    </p>
                    <p className="font-caps text-[10px] text-slate-500 mt-0.5">
                      Confidence {Math.round(r.confidence * 100)}%
                      {' · '}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RiskPill level={r.risk_level} score={r.risk_score} />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006666] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}