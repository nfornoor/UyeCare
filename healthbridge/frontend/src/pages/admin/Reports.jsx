import { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const RISK_BADGE = {
  high:     'bg-red-100   text-red-700',
  moderate: 'bg-amber-100 text-amber-700',
  low:      'bg-green-100 text-green-700',
}

const TEST_TYPES = ['xray', 'ecg', 'ct', 'skin', 'symptoms']
const PAGE_SIZE  = 20

export default function AdminReports() {
  const [data, setData]         = useState({ reports: [], total: 0 })
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('all')
  const [riskFilter, setRisk]   = useState('all')
  const [page, setPage]         = useState(0)

  const load = useCallback(async (skip) => {
    setLoading(true)
    try {
      const { data: res } = await adminAPI.reports(skip, PAGE_SIZE)
      setData(res)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page * PAGE_SIZE) }, [page, load])

  const filtered = data.reports.filter(r => {
    const matchType = typeFilter === 'all' || r.test_type === typeFilter
    const matchRisk = riskFilter === 'all' || r.risk_level === riskFilter
    const matchSearch = !search ||
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      r.prediction.toLowerCase().includes(search.toLowerCase())
    return matchType && matchRisk && matchSearch
  })

  const totalPages = Math.ceil(data.total / PAGE_SIZE)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Reports</h1>
        <p className="text-sm text-slate-500 mt-1">{data.total} total reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search patient or diagnosis…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={typeFilter} onChange={e => setType(e.target.value)}>
          <option value="all">All types</option>
          {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input w-auto" value={riskFilter} onChange={e => setRisk(e.target.value)}>
          <option value="all">All risks</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-center">Risk</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No reports found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.report_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.patient_name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.patient_email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{r.test_type}</td>
                  <td className="px-4 py-3 text-slate-700">{r.prediction}</td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_BADGE[r.risk_level]}`}>
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
