import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import RiskBadge from '../../components/common/RiskBadge'
import ConfidenceBar from '../../components/common/ConfidenceBar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Send, ChevronDown, ChevronUp,
  Activity, Image, Brain, Microscope, Stethoscope,
  Droplets, Phone, User, MapPin, AlertTriangle,
  MessageCircle, ClipboardList, FileText,
} from 'lucide-react'
import { format } from 'date-fns'

const TYPE_LABELS = {
  xray: 'Chest X-Ray', ecg: 'ECG', ct: 'CT Scan', skin: 'Skin Disease', symptoms: 'Disease Checkup',
}
const TYPE_ICONS = {
  xray: Image, ecg: Activity, ct: Microscope, skin: Brain, symptoms: Stethoscope,
}
const TYPE_COLORS = {
  xray:     'bg-blue-100 text-blue-600',
  ecg:      'bg-green-100 text-green-600',
  ct:       'bg-orange-100 text-orange-600',
  skin:     'bg-pink-100 text-pink-600',
  symptoms: 'bg-purple-100 text-purple-600',
}

function ProfileField({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  )
}

function ReportCard({ report, onSendAboutReport }) {
  const [open, setOpen]       = useState(false)
  const [full, setFull]       = useState(null)
  const [loading, setLoading] = useState(false)
  const Icon  = TYPE_ICONS[report.test_type]  || Activity
  const color = TYPE_COLORS[report.test_type] || 'bg-slate-100 text-slate-500'

  async function expand() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (full) return
    setLoading(true)
    try {
      const { data } = await doctorAPI.report(report.report_id)
      setFull(data)
    } catch { toast.error('Failed to load report') }
    finally   { setLoading(false) }
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        onClick={expand}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{TYPE_LABELS[report.test_type]}</p>
            <p className="text-xs text-slate-500">
              {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy') : '—'}
              {report.created_at && (
                <span className="text-slate-400"> at {format(new Date(report.created_at), 'h:mm a')}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{report.prediction}</p>
            <p className="text-xs text-slate-400">{Math.round((report.confidence ?? 0) * 100)}% confidence</p>
          </div>
          <RiskBadge level={report.risk_level} />
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          {loading
            ? <LoadingSpinner size="sm" />
            : full && (
              <ReportDetail
                report={full}
                onSendAboutReport={onSendAboutReport}
              />
            )
          }
        </div>
      )}
    </div>
  )
}

function ReportDetail({ report, onSendAboutReport }) {
  const [note, setNote]         = useState('')
  const [sending, setSending]   = useState(false)
  const probs    = report.details?.all_probabilities || report.details?.class_probabilities
  const top3     = report.details?.top3
  const isSymptoms = report.test_type === 'symptoms'
  const isCT       = report.test_type === 'ct'

  async function handleSend(e) {
    e.preventDefault()
    if (!note.trim()) return
    setSending(true)
    const ok = await onSendAboutReport(note.trim(), {
      report_id:         report.report_id,
      report_type:       report.test_type,
      report_prediction: report.prediction,
    })
    if (ok) setNote('')
    setSending(false)
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Result</p>
        <p className="text-base font-bold text-slate-900">{report.prediction}</p>
        <p className="text-sm text-slate-500">
          Confidence: {Math.round((report.confidence ?? 0) * 100)}%
          <span className="mx-2 text-slate-300">|</span>
          Risk score: {report.risk_score}
        </p>
        {isSymptoms && report.details?.inconclusive && (
          <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Inconclusive
          </span>
        )}
      </div>

      {/* Disease checkup top 3 */}
      {isSymptoms && top3?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Top Predicted Conditions
          </p>
          <div className="space-y-2">
            {top3.map(({ disease, probability }) => (
              <ConfidenceBar key={disease} value={probability / 100} label={disease} />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Based on {report.details?.filled_columns ?? '—'} of {report.details?.total_columns ?? 28} symptom indicators
          </p>
        </div>
      )}

      {/* Image-based probabilities */}
      {probs && !isSymptoms && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Class Probabilities
          </p>
          <div className="space-y-2">
            {Object.entries(probs).sort(([, a], [, b]) => b - a).slice(0, 6).map(([k, v]) => (
              <ConfidenceBar key={k} value={v} label={k} />
            ))}
          </div>
        </div>
      )}

      {/* CT anomaly score */}
      {isCT && report.details?.anomaly_score != null && (
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Anomaly Score</p>
          <p className="text-2xl font-bold text-slate-900">{(report.details.anomaly_score * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400">Higher value indicates greater anomaly likelihood</p>
        </div>
      )}

      {/* Grad-CAM */}
      {report.gradcam_image && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Grad-CAM Heatmap</p>
          <img src={report.gradcam_image} alt="Grad-CAM" className="rounded-lg max-w-xs border border-slate-200" />
        </div>
      )}

      {/* Uploaded image */}
      {report.image_url && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Uploaded Image</p>
          <img src={report.image_url} alt="Uploaded" className="rounded-lg max-w-xs border border-slate-200" />
        </div>
      )}

      {/* AI recommendation */}
      {report.recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">AI Recommendation</p>
          <p className="text-sm text-blue-800 leading-relaxed">{report.recommendation}</p>
        </div>
      )}

      {/* ── Send note about this report ─────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Send a note to patient about this report
          </p>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Regarding: {TYPE_LABELS[report.test_type]} — {report.prediction}
        </p>
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            rows={2}
            className="input text-sm flex-1 resize-none py-2"
            placeholder="Write your clinical note or guidance for the patient…"
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!note.trim() || sending}
            className="btn-primary px-3 self-end py-2 rounded-lg disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PatientDetail() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [messages, setMessages] = useState([])
  const [msgText, setMsgText]   = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const msgBottomRef = useRef(null)

  useEffect(() => {
    Promise.all([doctorAPI.patient(patientId), doctorAPI.messages(patientId)])
      .then(([p, m]) => { setData(p.data); setMessages(m.data) })
      .finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content, reportMeta = {}) {
    try {
      await doctorAPI.sendMessage(
        patientId,
        content,
        reportMeta.report_id   || null,
        reportMeta.report_type || null,
        reportMeta.report_prediction || null,
      )
      setMessages(prev => [...prev, {
        id:               Date.now().toString(),
        from_role:        'doctor',
        from_name:        'You',
        content,
        report_id:        reportMeta.report_id        || null,
        report_type:      reportMeta.report_type      || null,
        report_prediction: reportMeta.report_prediction || null,
        created_at:       new Date().toISOString(),
      }])
      toast.success('Message sent to patient')
      return true
    } catch {
      toast.error('Failed to send message')
      return false
    }
  }

  async function handleGeneralSend(e) {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    const ok = await sendMessage(msgText.trim())
    if (ok) setMsgText('')
    setSending(false)
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>
  if (!data)   return <div className="p-8 text-slate-500">Patient not found</div>

  const maxRisk   = data.reports.reduce((m, r) => Math.max(m, r.risk_score || 0), 0)
  const riskLevel = maxRisk > 60 ? 'high' : maxRisk > 30 ? 'moderate' : 'low'
  const sexLabel  = data.sex === 'M' ? 'Male' : data.sex === 'F' ? 'Female' : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Patient header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl shrink-0">
              {data.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{data.name}</h1>
                {data.display_id && (
                  <span className="text-xs font-mono bg-primary-50 text-primary-600 border border-primary-200 px-2 py-0.5 rounded-full">
                    {data.display_id}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm">{data.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RiskBadge level={riskLevel} />
            <p className="text-xs text-slate-400">Max risk score: {maxRisk}</p>
            <p className="text-xs text-slate-400">{data.reports.length} report{data.reports.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-slate-100">
          <ProfileField icon={User}          label="Sex"               value={sexLabel} />
          <ProfileField icon={Droplets}      label="Blood Group"       value={data.blood_group} />
          <ProfileField icon={Phone}         label="Phone"             value={data.phone} />
          <ProfileField icon={User}          label="Date of Birth"     value={data.date_of_birth} />
          <ProfileField icon={AlertTriangle} label="Emergency Contact" value={data.emergency_contact} />
          <ProfileField icon={MapPin}        label="Address"           value={data.address} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Reports — 2/3 width */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Diagnostic Reports</h2>
          </div>
          {data.reports.length === 0
            ? <p className="text-slate-400 text-sm">No reports yet.</p>
            : (
              <div className="space-y-3">
                {data.reports.map(r => (
                  <ReportCard
                    key={r.report_id}
                    report={r}
                    onSendAboutReport={sendMessage}
                  />
                ))}
              </div>
            )
          }
        </div>

        {/* Messages — 1/3 width */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Message History</h2>
          </div>
          <div className="card flex flex-col p-0 overflow-hidden" style={{ height: '520px' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0
                ? (
                  <p className="text-slate-400 text-xs text-center mt-8">
                    No messages yet. Expand a report below to send a note, or use the form here for general messages.
                  </p>
                )
                : messages.map(m => (
                  <div key={m.id} className={`flex ${m.from_role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-xl text-xs leading-relaxed overflow-hidden ${
                      m.from_role === 'doctor'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {/* Report context tag */}
                      {m.report_type && (
                        <div className={`flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-medium ${
                          m.from_role === 'doctor' ? 'text-primary-200' : 'text-slate-500'
                        }`}>
                          <FileText className="w-3 h-3 shrink-0" />
                          Re: {TYPE_LABELS[m.report_type] || m.report_type}
                          {m.report_prediction && ` — ${m.report_prediction}`}
                        </div>
                      )}
                      <div className="px-3 pb-2 pt-1">
                        {m.report_type && <div className={`border-t mb-1.5 ${m.from_role === 'doctor' ? 'border-primary-500' : 'border-slate-200'}`} />}
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.from_role === 'doctor' ? 'text-primary-200' : 'text-slate-400'}`}>
                          {format(new Date(m.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              }
              <div ref={msgBottomRef} />
            </div>

            {/* General message compose */}
            <div className="border-t border-slate-100 p-3">
              <p className="text-xs text-slate-400 mb-2">General message</p>
              <form onSubmit={handleGeneralSend} className="flex gap-2">
                <input
                  className="input text-xs flex-1 py-2"
                  placeholder="Send a note to the patient…"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!msgText.trim() || sending}
                  className="btn-primary px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
