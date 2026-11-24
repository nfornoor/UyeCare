import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { chatAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  FileText, RefreshCw, Mail, Stethoscope, HeartPulse,
  CheckCircle2, BellRing,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const TEST_LABELS = {
  xray:     'Chest X-Ray',
  ecg:      'ECG',
  ct:       'CT Scan',
  skin:     'Skin Disease',
  symptoms: 'Disease Checkup',
}

function MessageCard({ message }) {
  const wasUnread = !message.read
  return (
    <article className="neu-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="neu-icon-tile-accent w-10 h-10 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E2938] truncate">{message.from_name || 'Your doctor'}</p>
            <p className="font-caps text-[10px] text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {wasUnread && (
          <span className="neu-pill text-[#FF2157] !text-[9px] shrink-0">
            <BellRing className="w-2.5 h-2.5" /> NEW
          </span>
        )}
      </div>

      {message.report_type && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-black/[0.06]">
          <FileText className="w-3.5 h-3.5 text-[#006666] shrink-0" />
          <span className="font-caps text-[10px] text-slate-500">RE:</span>
          <span className="text-[12px] font-semibold text-[#1E2938] truncate">
            {TEST_LABELS[message.report_type] || message.report_type}
            {message.report_prediction && ` · ${message.report_prediction}`}
          </span>
        </div>
      )}

      <p className="text-sm text-[#1E2938] leading-relaxed whitespace-pre-wrap font-sans">
        {message.content}
      </p>

      <p className="font-caps text-[9px] text-slate-400 mt-4">
        {format(new Date(message.created_at), 'MMM d, yyyy · h:mm a')}
      </p>
    </article>
  )
}

export default function Chat() {
  const [messages, setMessages]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    chatAPI.messages()
      .then(r => setMessages(r.data))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  const sorted   = [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const unread   = messages.filter(m => !m.read).length
  const newest   = sorted[0]

  return (
    <div className="neu-surface min-h-full p-6 lg:p-8 font-display">
      <div className="max-w-3xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="font-caps text-[10px] text-[#006666] mb-1">[ Messages ]</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1E2938] leading-tight">
              From your doctor
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-sans">
              {messages.length === 0
                ? "You'll see notes from your doctor here."
                : `${messages.length} message${messages.length !== 1 ? 's' : ''}${unread ? ` · ${unread} unread` : ''}`}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="neu-tile px-3 py-2 flex items-center gap-1.5 font-caps text-[10px] text-[#1E2938] disabled:opacity-50"
            aria-label="Refresh messages"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── AI-chat redirect strip ─────────────────────────────────────── */}
        <Link
          to="/patient/health-assistant"
          className="neu-card-sm flex items-center justify-between gap-3 p-3 mb-5 group hover:scale-[1.005] transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="neu-icon-tile w-9 h-9 text-[#006666] shrink-0">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#1E2938]">Need to talk to AI?</p>
              <p className="font-caps text-[9px] text-slate-500 mt-0.5">Open the Health Assistant</p>
            </div>
          </div>
          <span className="font-caps text-[10px] text-[#006666] group-hover:translate-x-0.5 transition-transform">
            OPEN →
          </span>
        </Link>

        {/* ── List / empty / loading ─────────────────────────────────────── */}
        {loading ? (
          <div className="neu-card flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : sorted.length === 0 ? (
          <div className="neu-card flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="neu-icon-tile w-14 h-14 mb-4 text-[#006666]">
              <Mail className="w-6 h-6" />
            </div>
            <p className="font-bold text-[#1E2938] text-base mb-1.5">No messages yet</p>
            <p className="text-sm text-slate-500 font-sans max-w-sm leading-relaxed">
              When your doctor reviews one of your reports and sends a note, it will appear here.
            </p>
            <Link
              to="/patient/analyze"
              className="neu-btn-primary mt-5 inline-flex font-display"
            >
              Run a screening
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Newest message info banner if it's unread */}
            {newest && !newest.read && (
              <div className="flex items-center gap-2 px-1 mb-1">
                <CheckCircle2 className="w-3 h-3 text-[#00A63D]" />
                <span className="font-caps text-[10px] text-slate-500">
                  Latest message marked as read automatically
                </span>
              </div>
            )}
            {sorted.map(m => <MessageCard key={m.id} message={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}
