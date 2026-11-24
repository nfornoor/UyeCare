import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import {
  Users, UserCheck, FileText, AlertTriangle,
  TrendingUp, Activity, ShieldCheck, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const RISK_COLORS = { low: '#22c55e', moderate: '#f59e0b', high: '#ef4444' }
const TYPE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899']

function StatCard({ icon: Icon, label, value, color = 'primary', badge }) {
  const themes = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-green-50  text-green-600',
    blue:    'bg-blue-50   text-blue-600',
    amber:   'bg-amber-50  text-amber-600',
    red:     'bg-red-50    text-red-600',
  }
  return (
    <div className="card flex items-center gap-4 relative">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${themes[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
      {badge > 0 && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </div>
  )
}

const RISK_BADGE = {
  high:     'bg-red-100    text-red-700',
  moderate: 'bg-amber-100  text-amber-700',
  low:      'bg-green-100  text-green-700',
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading dashboard…
      </div>
    )
  }

  const riskData = stats
    ? Object.entries(stats.risk_distribution).map(([name, value]) => ({ name, value }))
    : []

  const typeData = stats
    ? Object.entries(stats.test_type_distribution).map(([name, value]) => ({
        name: name.replace('_', ' '),
        count: value,
      }))
    : []

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">UyeCare platform overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Patients"       value={stats?.total_patients}                color="primary" />
        <StatCard icon={UserCheck}     label="Active Doctors"       value={stats?.total_doctors}                 color="blue" />
        <StatCard icon={FileText}      label="Total Reports"        value={stats?.total_reports}                 color="green" />
        <StatCard icon={Clock}         label="Pending Doctor Approvals" value={stats?.pending_doctors}           color="amber"
                  badge={stats?.pending_doctors} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" /> Tests by Type
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}
                isAnimationActive animationDuration={2300} animationEasing="ease-out" animationBegin={200}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Risk Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={80} label
                isAnimationActive animationDuration={2300} animationEasing="ease-out" animationBegin={300}
              >
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Top Diagnoses</h2>
          <div className="space-y-2">
            {(stats?.top_conditions ?? []).slice(0, 8).map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate">{name}</span>
                <span className="font-semibold text-slate-800 ml-2">{count}</span>
              </div>
            ))}
            {!stats?.top_conditions?.length && (
              <p className="text-sm text-slate-400">No data yet.</p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Recent Reports</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2">Patient</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(stats?.recent_reports ?? []).map(r => (
                  <tr key={r.report_id}>
                    <td className="py-2">
                      <p className="font-medium text-slate-700 truncate max-w-[120px]">{r.patient_name}</p>
                      {r.patient_id_label && (
                        <p className="text-xs text-slate-400">{r.patient_id_label}</p>
                      )}
                    </td>
                    <td className="py-2 text-slate-500 capitalize">{r.test_type}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_BADGE[r.risk_level]}`}>
                        {r.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stats?.recent_reports?.length && (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">No reports yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
