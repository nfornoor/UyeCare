import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, FileText, AlertTriangle, ChevronRight, Activity } from 'lucide-react'
import { format } from 'date-fns'

const TEAL = '#006666'
const RISK_COLORS = { low: '#00A63D', moderate: '#FE9900', high: '#FF2157' }
const PIE_COLORS = [RISK_COLORS.low, RISK_COLORS.moderate, RISK_COLORS.high]

function RiskPill({ level, score }) {
  return (
    <span className="neu-pill text-[#1E2938]">
      <span className={`w-1.5 h-1.5 rounded-full risk-dot-${level || 'low'}`} />
      {level || 'low'}{score != null ? ` · ${score}` : ''}
    </span>
  )
}


export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const [patients, setPatients] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([doctorAPI.patients(), doctorAPI.stats()])
      .then(([p, s]) => { setPatients(p.data); setStats(s.data) })
      .finally(() => setLoading(false))
  }, [])

  const highRisk = patients.filter(p => p.risk_level === 'high')
  const riskPieData = stats ? [
    { name: 'Low',      value: stats.risk_distribution.low },
    { name: 'Moderate', value: stats.risk_distribution.moderate },
    { name: 'High',     value: stats.risk_distribution.high },
  ] : []
  const avgTests = stats?.total_patients > 0
    ? Math.round((stats.total_reports / stats.total_patients) * 10) / 10
    : 0

  return (
    <div className="neu-surface min-h-full p-6 lg:p-8 font-display">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
        <div>
          <p className="font-caps text-[10px] text-[#006666] mb-1">Doctor Dashboard</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1E2938] leading-tight">
            Dr. {user?.name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-sans">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} under your watch
            {stats?.total_reports != null && ` · ${stats.total_reports} reports total`}
          </p>
        </div>
        {user?.display_id && (
          <span className="neu-pill text-[#006666]">{user.display_id}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <>
          {/* ── Stat cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-7">
            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="neu-icon-tile-accent w-9 h-9">
                  <Users className="w-4 h-4" />
                </span>
                <span className="font-caps text-[9px] text-slate-500">Patients</span>
              </div>
              <p className="text-3xl font-bold text-[#1E2938]">{stats?.total_patients ?? 0}</p>
            </div>

            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="neu-icon-tile w-9 h-9">
                  <FileText className="w-4 h-4 text-[#006666]" />
                </span>
                <span className="font-caps text-[9px] text-slate-500">Reports</span>
              </div>
              <p className="text-3xl font-bold text-[#1E2938]">{stats?.total_reports ?? 0}</p>
            </div>

            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="neu-icon-tile w-9 h-9" style={{ background: '#E7E5E4' }}>
                  <AlertTriangle className="w-4 h-4 text-[#FF2157]" />
                </span>
                <span className="font-caps text-[9px] text-slate-500">High risk</span>
              </div>
              <p className={`text-3xl font-bold ${highRisk.length > 0 ? 'text-[#FF2157]' : 'text-[#00A63D]'}`}>
                {highRisk.length}
              </p>
            </div>

            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="neu-icon-tile w-9 h-9">
                  <Activity className="w-4 h-4 text-[#006666]" />
                </span>
                <span className="font-caps text-[9px] text-slate-500">Avg / patient</span>
              </div>
              <p className="text-3xl font-bold text-[#1E2938]">{avgTests}</p>
            </div>
          </div>

          {/* ── Charts row ────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5 mb-7">
            {/* Top conditions */}
            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1E2938]">Top conditions detected</h3>
                <span className="flex items-center gap-1.5 font-caps text-[9px] text-[#00A63D]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A63D] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00A63D]" />
                  </span>
                  LIVE
                </span>
              </div>
              {stats?.top_conditions?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.top_conditions.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="docCondBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"  stopColor={TEAL} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={TEAL} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} width={140} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,102,102,0.06)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="neu-card-sm px-3 py-2 text-xs" style={{ background: '#E7E5E4' }}>
                            <p className="font-bold text-[#1E2938]">{payload[0].payload.name}</p>
                            <p className="text-slate-500">
                              <span className="font-bold text-[#006666]">{payload[0].value}</span> case{payload[0].value !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="count" fill="url(#docCondBar)" radius={[0, 8, 8, 0]}
                      isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={120} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm font-sans py-12 text-center">No data yet</p>
              )}
            </div>

            {/* Risk distribution */}
            <div className="neu-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1E2938]">Risk distribution</h3>
                <span className="font-caps text-[9px] text-slate-500">across all reports</span>
              </div>
              {riskPieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={42} paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      isAnimationActive animationDuration={900} animationBegin={150} animationEasing="ease-out"
                    >
                      {riskPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} stroke="#E7E5E4" strokeWidth={3} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="neu-card-sm px-3 py-2 text-xs" style={{ background: '#E7E5E4' }}>
                            <p className="font-bold text-[#1E2938] capitalize">{payload[0].name}</p>
                            <p className="text-slate-500">
                              <span className="font-bold text-[#006666]">{payload[0].value}</span> report{payload[0].value !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm font-sans py-12 text-center">No data yet</p>
              )}
            </div>
          </div>

          {/* ── High risk alerts ──────────────────────────────────────── */}
          {highRisk.length > 0 && (
            <div className="mb-7">
              <h3 className="font-caps text-[11px] text-[#FF2157] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Immediate attention
              </h3>
              <div className="space-y-3">
                {highRisk.map(p => (
                  <Link
                    key={p.patient_id}
                    to={`/doctor/patients/${p.patient_id}`}
                    className="neu-card flex items-center justify-between p-4 group transition-all hover:scale-[1.003]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="neu-icon-tile w-10 h-10 shrink-0" style={{ background: '#E7E5E4' }}>
                        <span className="text-sm font-bold text-[#FF2157]">{p.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1E2938] truncate">{p.name}</p>
                        <p className="font-caps text-[10px] text-slate-500 mt-0.5 truncate">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <RiskPill level="high" score={p.risk_score} />
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF2157] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── All patients table ────────────────────────────────────── */}
          <div>
            <h3 className="font-caps text-[11px] text-slate-500 mb-4">All patients</h3>
            <div className="neu-card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-caps text-[10px] text-slate-500">
                    <th className="text-left px-5 py-3 font-normal">Patient</th>
                    <th className="text-left px-5 py-3 font-normal hidden md:table-cell">Email</th>
                    <th className="text-center px-5 py-3 font-normal">Reports</th>
                    <th className="text-left px-5 py-3 font-normal">Risk</th>
                    <th className="text-left px-5 py-3 font-normal hidden lg:table-cell">Last test</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr
                      key={p.patient_id}
                      className="border-t border-[rgba(30,41,56,0.06)] hover:bg-[rgba(0,102,102,0.04)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#1E2938]">{p.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell font-sans">{p.email}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-[#006666]">{p.total_reports}</td>
                      <td className="px-5 py-3.5">
                        <RiskPill level={p.risk_level} score={p.risk_score} />
                      </td>
                      <td className="px-5 py-3.5 font-caps text-[10px] text-slate-500 hidden lg:table-cell">
                        {p.last_test ? format(new Date(p.last_test), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/doctor/patients/${p.patient_id}`}
                          className="font-caps text-[10px] text-[#006666] hover:underline inline-flex items-center gap-1"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients.length === 0 && (
                <p className="text-center text-slate-400 py-12 font-sans text-sm">No patients registered yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
