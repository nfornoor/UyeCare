import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import RiskBadge from '../../components/common/RiskBadge'
import ConfidenceBar from '../../components/common/ConfidenceBar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { chatAPI } from '../../services/api'
import { AlertCircle, CheckCircle, ArrowLeft, MessageCircle, Send, Bot, User, X, ClipboardList, Activity, Image, Microscope, Brain, FlaskConical } from 'lucide-react'

const TEST_LABELS = { xray: 'Chest X-Ray', ecg: 'ECG', ct: 'CT Scan', skin: 'Skin Disease', symptoms: 'Disease Checkup' }

const FOLLOW_UP_TESTS = [
  { id: 'ecg',  label: 'ECG Analysis',  icon: Activity,   color: 'bg-green-50 border-green-200 text-green-700',  to: '/patient/analyze?test=ecg'  },
  { id: 'xray', label: 'Chest X-Ray',   icon: Image,      color: 'bg-blue-50 border-blue-200 text-blue-700',    to: '/patient/analyze?test=xray' },
  { id: 'ct',   label: 'CT Scan',       icon: Microscope, color: 'bg-orange-50 border-orange-200 text-orange-700', to: '/patient/analyze?test=ct' },
  { id: 'skin', label: 'Skin Analysis', icon: Brain,      color: 'bg-pink-50 border-pink-200 text-pink-700',    to: '/patient/analyze?test=skin' },
]

function RiskScoreGauge({ score, level }) {
  const pct = score
  const color = level === 'high' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#22c55e'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke={color}
            strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 141.4} 141.4`} />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-extrabold" style={{ color }}>{score}</span>
        </div>
      </div>
      <RiskBadge level={level} />
    </div>
  )
}

function InlineChat({ context }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const next = [...history, { role: 'user', content: msg }]
    setHistory(next)
    setLoading(true)
    try {
      const { data } = await chatAPI.send(msg, history, context)
      setHistory([...next, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setHistory([...next, { role: 'assistant', content: err.response?.data?.detail || 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 text-sm">Ask AI about this result</p>
            <p className="text-xs text-slate-400">Powered by Groq LLaMA 3</p>
          </div>
        </div>
        {open ? <X className="w-4 h-4 text-slate-400" /> : <MessageCircle className="w-4 h-4 text-primary-500" />}
      </button>

      {open && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="space-y-3 max-h-72 overflow-y-auto mb-3 pr-1">
            {history.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {['What does this mean?', 'Is this serious?', 'What should I do next?', 'Can this be treated?'].map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-primary-100' : 'bg-slate-200'}`}>
                  {m.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-primary-600" /> : <User className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'assistant' ? 'bg-slate-50 border border-slate-200 text-slate-800' : 'bg-primary-600 text-white'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
            <input
              className="input flex-1 text-sm py-2"
              placeholder="Ask about your result…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || loading} className="btn-primary px-3 py-2 rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const result = state?.result

  if (!result) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">No result to display.</p>
        <Link to="/patient/analyze" className="btn-primary">Run a Test</Link>
      </div>
    )
  }

  const { test_type, prediction, confidence, risk_level, risk_score, details, gradcam_image, recommendation } = result
  const isInconclusive = confidence < 0.60 || details?.inconclusive
  const confPct = Math.round(confidence * 100)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Analysis Result</h1>
      <p className="text-slate-500 text-sm mb-6">{TEST_LABELS[test_type] || test_type}</p>

      {/* Main verdict */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isInconclusive
                ? <AlertCircle className="w-5 h-5 text-amber-500" />
                : <CheckCircle className="w-5 h-5 text-green-500" />
              }
              <span className="text-sm font-medium text-slate-500">
                {isInconclusive ? 'Inconclusive — further review recommended' : 'Prediction'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{prediction}</h2>
            {details?.description && <p className="text-slate-500 text-sm mt-1">{details.description}</p>}
            <p className="text-sm text-slate-500 mt-2">
              Confidence: <span className={`font-semibold ${confPct >= 70 ? 'text-green-600' : confPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{confPct}%</span>
            </p>
          </div>
          <RiskScoreGauge score={risk_score} level={risk_level} />
        </div>

        {/* Main confidence bar */}
        <div className="mt-4">
          <ConfidenceBar value={confidence} label="Overall Confidence" />
        </div>
      </div>

      {/* Probabilities */}
      {(details?.all_probabilities || details?.class_probabilities || details?.top3) && (
        <div className="card mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Probability Breakdown</h3>
          <div className="space-y-3">
            {details?.top3 ? (
              details.top3.map(({ disease, probability }) => (
                <ConfidenceBar key={disease} value={probability / 100} label={disease} />
              ))
            ) : (
              Object.entries(details.all_probabilities || details.class_probabilities || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([label, prob]) => (
                  <ConfidenceBar key={label} value={prob} label={label} />
                ))
            )}
          </div>
        </div>
      )}

      {/* Grad-CAM */}
      {gradcam_image && (
        <div className="card mb-6">
          <h3 className="font-semibold text-slate-800 mb-1">Grad-CAM Visualization</h3>
          <p className="text-xs text-slate-400 mb-3">
            Highlighted regions show areas that most influenced the AI prediction.
          </p>
          <img src={gradcam_image} alt="Grad-CAM" className="rounded-xl w-full max-w-sm mx-auto" />
        </div>
      )}

      {/* CT anomaly details */}
      {test_type === 'ct' && details && (
        <div className="card mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Anomaly Scoring</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{Math.round((details.anomaly_score || 0) * 100)}%</p>
              <p className="text-xs text-slate-500 mt-1">Anomaly Score</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{details.isolation_forest_label === 1 ? 'Normal' : 'Anomaly'}</p>
              <p className="text-xs text-slate-500 mt-1">Isolation Forest</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Symptom result: full prescription card ────────────────────── */}
      {test_type === 'symptoms' && (
        <div className="mb-6 space-y-4">
          {recommendation ? (
            <div className="card border-indigo-200 bg-indigo-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">Clinical Prescription</h3>
                  <p className="text-xs text-indigo-400">Generated by UyeCare AI based on your symptom assessment</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-indigo-100 p-4">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{recommendation}</p>
              </div>
              <p className="text-xs text-indigo-400 mt-3">
                This prescription does not include medications or dosages. Always consult a qualified physician.
              </p>
            </div>
          ) : (
            <div className="card border-slate-200 bg-slate-50 text-center py-6">
              <p className="text-sm text-slate-400">Add your Groq API key in .env to enable AI prescriptions.</p>
            </div>
          )}

          {/* Follow-up test quick links */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-1">Run a Diagnostic Test</h3>
            <p className="text-sm text-slate-500 mb-4">
              Based on your symptoms, the AI may have recommended one or more of these tests. Run them directly from here.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FOLLOW_UP_TESTS.map(({ id, label, icon: Icon, color, to }) => (
                <Link key={id} to={to}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 hover:shadow-sm transition-all ${color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Non-symptom: generic AI guidance ──────────────────────────── */}
      {test_type !== 'symptoms' && (
        recommendation ? (
          <div className="card mb-6 border-primary-200 bg-primary-50">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-primary-800">AI Health Guidance</h3>
            </div>
            <p className="text-sm text-primary-900 leading-relaxed whitespace-pre-wrap">{recommendation}</p>
            <p className="text-xs text-primary-400 mt-3">No medications suggested. Consult a physician for treatment.</p>
          </div>
        ) : (
          <div className="card mb-6 border-slate-200 bg-slate-50 text-center py-6">
            <p className="text-sm text-slate-400">Add your Groq API key in backend .env to enable AI recommendations.</p>
          </div>
        )
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          This result is for informational purposes only. It is not a medical diagnosis.
          Please consult a qualified healthcare professional before taking any medical decisions.
        </p>
      </div>

      <InlineChat context={`Test: ${TEST_LABELS[test_type] || test_type}. Prediction: ${prediction}. Confidence: ${Math.round(confidence * 100)}%. Risk: ${risk_level} (${risk_score}/100).`} />

      <div className="flex gap-3">
        <Link to="/patient/analyze" className="btn-secondary flex-1 justify-center">Run Another Test</Link>
      </div>
    </div>
  )
}
