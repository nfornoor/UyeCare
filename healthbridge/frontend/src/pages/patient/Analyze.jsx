import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { gsap } from 'gsap'
import { analyzeAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Upload, Activity, Image, Microscope, Brain, FlaskConical,
  AlertCircle, X, ChevronRight, ArrowLeft,
  FileText, Clock, Cpu, CheckCircle2, Sparkles, Loader2,
} from 'lucide-react'

const TEAL = '#006666'

/* ─────────────────────────────────────────────────────────────────────────
   Test catalog — each module owns a hue used for icon tile + accent only.
   The card body stays on the cohesive warm-gray neu surface.
   ───────────────────────────────────────────────────────────────────────── */

const TESTS = [
  {
    id: 'xray',
    label: 'Chest X-Ray',
    icon: Image,
    hue: '#2563eb',
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    formats: 'JPG · PNG',
    duration: '10–20s',
    model: 'DenseNet121 + ResNet50 + ViT',
    desc: 'Frontal chest X-ray. Ensemble analyzes lung fields, heart silhouette and vascular markings.',
    conditions: ['Pneumonia', 'Cardiomegaly', 'Edema', 'Atelectasis', 'Consolidation', 'Normal'],
  },
  {
    id: 'ecg',
    label: 'ECG Analysis',
    icon: Activity,
    hue: '#00A63D',
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] },
    formats: 'CSV @ 360 Hz',
    duration: '5s segments',
    model: 'ResNet + Inception + Transformer',
    desc: 'Single-lead ECG signal split into 5-second segments. Each window is classified independently and tagged with its real-world timestamp so abnormalities are located precisely on the recording.',
    conditions: ['Normal', 'Atrial Fibrillation', 'MI', 'Ischemia', 'Hypertrophy', 'Conduction'],
  },
  {
    id: 'ct',
    label: 'CT Scan',
    icon: Microscope,
    hue: '#D97706',
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    formats: 'JPG · PNG',
    duration: '5–10s',
    model: 'Isolation Forest + PCA',
    desc: 'CT slice image. Unsupervised anomaly detection flags structural irregularities.',
    conditions: ['Normal', 'CT Anomaly Detected'],
  },
  {
    id: 'skin',
    label: 'Skin Disease',
    icon: Brain,
    hue: '#FF2157',
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    formats: 'JPG · PNG',
    duration: '10–20s',
    model: 'Triple ResNet50 + Grad-CAM',
    desc: 'Clear, well-lit photo of the lesion. Returns class + Grad-CAM heatmap.',
    conditions: ['Melanoma', 'BCC', 'Actinic Keratosis', 'Nevi', 'Benign Keratosis', 'Dermatofibroma', 'Vascular'],
  },
]

const SYMPTOM_CARD = {
  id: 'symptoms',
  label: 'All Disease Checkup',
  icon: FlaskConical,
  hue: '#8B5CF6',
  duration: '~30s',
  model: 'XGBoost + LightGBM + Random Forest',
  desc: 'Answer an adaptive symptom questionnaire — 22 disease categories across cardiac, pulmonary, skin and general.',
  conditions: ['MI', 'Atrial Fibrillation', 'Pneumonia', 'Melanoma', 'Ischemia', 'COPD', '+16 more'],
}

/* ─────────────────────────────────────────────────────────────────────────
   Reusable bits
   ───────────────────────────────────────────────────────────────────────── */

function IconTile({ hue, size = 'w-12 h-12', children }) {
  return (
    <div
      className={`${size} rounded-xl flex items-center justify-center`}
      style={{ background: `${hue}14`, color: hue, boxShadow: `inset 0 0 0 1px ${hue}26` }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Grid card (overview)
   ───────────────────────────────────────────────────────────────────────── */

function TestGridCard({ test }) {
  const { id, icon: Icon, label, desc, duration, model, formats, conditions, hue } = test
  const to = id === 'symptoms' ? '/patient/symptoms' : `/patient/analyze?test=${id}`

  return (
    <Link
      to={to}
      className="test-card neu-tile group p-5 flex flex-col text-[#1E2938] font-display"
    >
      <div className="flex items-start justify-between mb-5">
        <IconTile hue={hue}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </IconTile>
        <span className="font-caps text-[10px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {duration}
        </span>
      </div>

      <h3 className="font-bold text-lg leading-tight mb-1">{label}</h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4 font-sans">{desc}</p>

      <p className="font-caps text-[9px] text-slate-500 mb-2 flex items-center gap-1">
        <Cpu className="w-3 h-3" /> {model}
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {conditions.slice(0, 3).map(c => (
          <span
            key={c}
            className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full font-caps"
            style={{ background: `${hue}10`, color: hue }}
          >
            {c}
          </span>
        ))}
        {conditions.length > 3 && (
          <span className="text-[9px] font-caps text-slate-400 px-1 py-0.5">+{conditions.length - 3}</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-black/[0.06]">
        <span className="font-caps text-[10px] text-slate-500">{formats || 'No file needed'}</span>
        <span
          className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
          style={{ color: hue }}
        >
          {id === 'symptoms' ? 'Start' : 'Upload'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Upload zone (focused view)
   ───────────────────────────────────────────────────────────────────────── */

function UploadZone({ test, file, setFile, onAnalyze, loading, recordingStartTime, setRecordingStartTime }) {
  const { hue } = test
  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0])
  }, [setFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: test.accept, maxFiles: 1, disabled: loading,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
          file
            ? 'neu-card-sm'
            : isDragActive
              ? 'neu-card animate-pulse'
              : 'neu-inset hover:bg-black/[0.015]'
        }`}
        style={isDragActive ? { boxShadow: `inset 0 0 0 2px ${hue}, inset -3px -3px 6px rgba(255,255,255,0.9), inset 4px 4px 8px rgba(166,167,169,0.45)` } : undefined}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <IconTile hue={hue} size="w-11 h-11">
                <FileText className="w-4 h-4" />
              </IconTile>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1E2938] truncate font-display">{file.name}</p>
                <p className="font-caps text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · ready</p>
              </div>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null) }}
              className="ml-3 p-2 rounded-lg text-slate-400 hover:text-[#FF2157] hover:bg-[#FF2157]/8 transition-colors shrink-0"
              aria-label="Remove file"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <IconTile hue={hue} size="w-14 h-14">
              <Upload className="w-6 h-6" strokeWidth={1.75} />
            </IconTile>
            <p className="text-sm font-bold text-[#1E2938] mt-4 mb-1 font-display">
              {isDragActive ? 'Release to upload' : 'Drag and drop your file here'}
            </p>
            <p className="font-caps text-[10px] text-slate-500">
              or click to browse · {test.formats}
            </p>
          </div>
        )}
      </div>

      {test.id === 'ecg' && (
        <div className="neu-inset rounded-xl p-4">
          <label className="font-caps text-[10px] text-slate-500 mb-2 block">
            Recording start time <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="datetime-local"
            step="1"
            value={recordingStartTime}
            onChange={e => setRecordingStartTime(e.target.value)}
            disabled={loading}
            className="w-full bg-transparent text-sm font-bold text-[#1E2938] font-display outline-none disabled:opacity-50"
          />
          <p className="font-caps text-[9px] text-slate-500 mt-1.5 leading-relaxed">
            The clock time when ECG acquisition began. Used to map each 5-second segment to its real-world timestamp so abnormalities can be located precisely.
          </p>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!file || loading}
        className="relative w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wider uppercase font-display disabled:opacity-40 disabled:cursor-not-allowed transition-all overflow-hidden group"
        style={{
          background: `linear-gradient(145deg, ${hue}, ${hue}dd)`,
          boxShadow: `-3px -3px 8px rgba(255,255,255,0.7), 4px 4px 12px ${hue}55`,
        }}
      >
        {loading && (
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s linear infinite',
            }}
          />
        )}
        <span className="relative inline-flex items-center justify-center gap-2 font-caps text-xs">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running {test.label} ensemble
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run {test.label} analysis
            </>
          )}
        </span>
      </button>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -100% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Focused view (single test)
   ───────────────────────────────────────────────────────────────────────── */

function FocusedView({ test, onResult }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState('')
  const Icon = test.icon
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.focus-anim', {
        y: 24, opacity: 0,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.08,
      })
    }, root)
    return () => ctx.revert()
  }, [test.id])

  async function analyze() {
    if (!file) return toast.error('Please upload a file first')
    setLoading(true)
    try {
      const { data } = test.id === 'ecg'
        ? await analyzeAPI.ecg(file, recordingStartTime || undefined)
        : await analyzeAPI[test.id](file)
      onResult(data)
      toast.success('Analysis complete')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? 'Validation error — check your file and try again.'
        : detail || `Error ${err.response?.status || 'network'}: Analysis failed. Try again.`
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={root} className="neu-surface min-h-full p-6 lg:p-8 font-display">
      <Link
        to="/patient/analyze"
        className="focus-anim inline-flex items-center gap-1.5 font-caps text-[10px] text-slate-500 hover:text-[#006666] mb-7 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> All tests
      </Link>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {/* Left: test info */}
        <div className="focus-anim lg:col-span-2 space-y-6">
          <div>
            <IconTile hue={test.hue} size="w-14 h-14">
              <Icon className="w-6 h-6" strokeWidth={1.75} />
            </IconTile>
            <h1 className="text-2xl lg:text-3xl font-bold mt-4 leading-tight text-[#1E2938]">{test.label}</h1>
            <p className="text-sm text-slate-500 leading-relaxed mt-2 font-sans">{test.desc}</p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Clock,    label: 'Duration', value: test.duration },
              { icon: Cpu,      label: 'Model',    value: test.model },
              { icon: FileText, label: 'Formats',  value: test.formats },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="neu-icon-tile w-9 h-9">
                  <I className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-caps text-[9px] text-slate-500">{label}</p>
                  <p className="text-[13px] font-bold text-[#1E2938] truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="font-caps text-[10px] text-slate-500 mb-2">Detectable conditions</p>
            <div className="flex flex-wrap gap-1.5">
              {test.conditions.map(c => (
                <span
                  key={c}
                  className="font-caps text-[9px] px-2 py-1 rounded-full inline-flex items-center gap-1"
                  style={{ background: `${test.hue}10`, color: test.hue }}
                >
                  <CheckCircle2 className="w-2.5 h-2.5" /> {c}
                </span>
              ))}
            </div>
          </div>

          <div className="neu-card-sm p-3 flex items-start gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Screening only. Always consult a qualified physician before any medical decision.
            </p>
          </div>
        </div>

        {/* Right: upload */}
        <div className="focus-anim lg:col-span-3">
          <div className="neu-card p-6 lg:p-7">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-[#1E2938]">Upload your file</h2>
              <span className="neu-pill text-[#006666] !text-[9px]">secure</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 font-sans">
              The file is processed in-session and never shared without your consent.
            </p>
            <UploadZone
              test={test}
              file={file}
              setFile={setFile}
              onAnalyze={analyze}
              loading={loading}
              recordingStartTime={recordingStartTime}
              setRecordingStartTime={setRecordingStartTime}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Overview (grid)
   ───────────────────────────────────────────────────────────────────────── */

function Overview() {
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.test-anim', {
        y: 22, opacity: 0,
        duration: 0.7, ease: 'power3.out',
      })
      gsap.from('.test-card', {
        y: 30, opacity: 0,
        duration: 0.65, ease: 'power3.out',
        stagger: 0.08, delay: 0.15,
      })
      gsap.from('.symptom-banner', {
        y: 30, opacity: 0,
        duration: 0.7, ease: 'power3.out',
        delay: 0.55,
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const sym = SYMPTOM_CARD

  return (
    <div ref={root} className="neu-surface min-h-full p-6 lg:p-8 font-display">
      <div className="max-w-7xl mx-auto">
        <div className="test-anim mb-7">
          <p className="font-caps text-[10px] text-[#006666] mb-1">Diagnostic Modules</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1E2938] leading-tight">Run a screening</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-sans">
            Pick a module, upload your file, and get an AI-assisted result in seconds.
          </p>
        </div>

        <div className="test-anim neu-card-sm p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-[12px] text-slate-600 leading-relaxed font-sans">
            All modules are AI-assisted screening tools and do not constitute a medical diagnosis.
            Results below 60% confidence are flagged as inconclusive.
          </p>
        </div>

        {/* Test grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {TESTS.map(t => <TestGridCard key={t.id} test={t} />)}
        </div>

        {/* Symptom checkup banner */}
        <Link
          to="/patient/symptoms"
          className="symptom-banner relative neu-card group flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 overflow-hidden text-[#1E2938]"
        >
          <div className="flex items-start gap-5 min-w-0">
            <IconTile hue={sym.hue} size="w-14 h-14">
              <sym.icon className="w-6 h-6" strokeWidth={1.75} />
            </IconTile>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-lg leading-tight">{sym.label}</h3>
                <span
                  className="font-caps text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: `${sym.hue}14`, color: sym.hue }}
                >
                  No file needed
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-2xl">{sym.desc}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {sym.conditions.map(c => (
                  <span
                    key={c}
                    className="font-caps text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${sym.hue}10`, color: sym.hue }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 md:ml-6">
            <span
              className="inline-flex items-center gap-1 font-caps text-xs font-semibold group-hover:gap-2 transition-all"
              style={{ color: sym.hue }}
            >
              Start <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Entry
   ───────────────────────────────────────────────────────────────────────── */

export default function Analyze() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const testParam  = searchParams.get('test')
  const activeTest = TESTS.find(t => t.id === testParam)

  function handleResult(result) {
    navigate('/patient/results', { state: { result } })
  }

  return activeTest
    ? <FocusedView test={activeTest} onResult={handleResult} />
    : <Overview />
}
