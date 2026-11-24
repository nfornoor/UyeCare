import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { historyAPI } from '../../services/api'
import RiskBadge from '../../components/common/RiskBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfidenceBar from '../../components/common/ConfidenceBar'
import toast from 'react-hot-toast'
import { Trash2, ChevronDown, ChevronUp, Activity, Image, Brain, Microscope, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'

const TYPE_ICONS = {
  xray: Image, ecg: Activity, ct: Microscope, skin: Brain, symptoms: Stethoscope
}
const TYPE_LABELS = {
  xray: 'Chest X-Ray', ecg: 'ECG', ct: 'CT Scan', skin: 'Skin Disease', symptoms: 'Symptoms'
}

function ReportCard({ report, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const Icon = TYPE_ICONS[report.test_type] || Activity

  async function loadDetail() {
    if (detail) { setExpanded(e => !e); return }
    setExpanded(true)
    setLoadingDetail(true)
    try {
      const { data } = await historyAPI.get(report.report_id)
      setDetail(data)
    } catch {
      toast.error('Failed to load report details')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm('Delete this report?')) return
    await historyAPI.delete(report.report_id)
    onDelete(report.report_id)
    toast.success('Report deleted')
  }

  return (
    <div className="card cursor-pointer" onClick={loadDetail}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{TYPE_LABELS[report.test_type]}</p>
            <p className="text-sm text-slate-500">{report.prediction}</p>
            <p className="text-xs text-slate-400">Confidence: {Math.round(report.confidence * 100)}%</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <RiskBadge level={report.risk_level} />
            <p className="text-xs text-slate-400 mt-1">Score: {report.risk_score}</p>
          </div>
          <button onClick={handleDelete} className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100" onClick={e => e.stopPropagation()}>
          {loadingDetail ? <LoadingSpinner size="sm" /> : detail && (
            <div className="space-y-4">
              {/* Probabilities */}
              {(detail.details?.all_probabilities || detail.details?.class_probabilities) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Probabilities</p>
                  <div className="space-y-2">
                    {Object.entries(detail.details.all_probabilities || detail.details.class_probabilities)
                      .sort(([, a], [, b]) => b - a).slice(0, 5)
                      .map(([k, v]) => <ConfidenceBar key={k} value={v} label={k} />)}
                  </div>
                </div>
              )}
              {/* Top 3 for symptoms */}
              {detail.details?.top3 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top 3 Diagnoses</p>
                  <div className="space-y-2">
                    {detail.details.top3.map(({ disease, probability }) => (
                      <ConfidenceBar key={disease} value={probability / 100} label={disease} />
                    ))}
                  </div>
                </div>
              )}
              {/* Stored prescription for symptom reports */}
              {detail.details?.prescription && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Clinical Prescription</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detail.details.prescription}</p>
                </div>
              )}
              {/* Grad-CAM */}
              {detail.gradcam_image && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Grad-CAM</p>
                  <img src={detail.gradcam_image} alt="Grad-CAM" className="rounded-lg max-w-xs" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function History() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    historyAPI.list().then(r => setReports(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter(r => r.test_type === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test History</h1>
          <p className="text-slate-500 text-sm mt-1">{reports.length} reports total</p>
        </div>
        <Link to="/patient/analyze" className="btn-primary text-sm">New Test</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'xray', 'ecg', 'ct', 'skin', 'symptoms'].map(t => (
          <button key={t}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === t ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setFilter(t)}>
            {t === 'all' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner text="Loading reports…" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 mb-4">No reports found.</p>
          <Link to="/patient/analyze" className="btn-primary">Run a Test</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReportCard key={r.report_id} report={r}
              onDelete={id => setReports(prev => prev.filter(rep => rep.report_id !== id))} />
          ))}
        </div>
      )}
    </div>
  )
}
