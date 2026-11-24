import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { analyzeAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  FlaskConical, Cpu, CheckCircle2, Sparkles, Loader2,
} from 'lucide-react'

const ACCENT = '#8B5CF6'   // violet — module identity (matches Analyze symptom card)

/* ─────────────────────────────────────────────────────────────────────────
   Detectable diseases (for the expandable chip)
   ───────────────────────────────────────────────────────────────────────── */

const DETECTABLE = [
  'Myocardial Infarction', 'Atrial Fibrillation', 'Ventricular Arrhythmia',
  'Supraventricular Arrhythmia', 'Conduction Disorder', 'Hypertrophy',
  'Ischemia / ST-T Change', 'Pulmonary Edema', 'Pneumonia', 'Atelectasis',
  'Consolidation', 'Cardiomegaly', 'CT Anomaly', 'Melanoma',
  'Basal Cell Carcinoma', 'Actinic Keratosis', 'Melanocytic Nevi',
  'Benign Keratosis', 'Dermatofibroma', 'Vascular Lesion', 'Others', 'Normal',
]

/* ─────────────────────────────────────────────────────────────────────────
   Questionnaire steps
   ───────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    fields: [
      { key: 'age',             label: 'Your age',                          type: 'number', min: 1, max: 120 },
      { key: 'sex',             label: 'Biological sex',                     type: 'select', options: [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }] },
      { key: 'smoking_history', label: 'Do you smoke or have you smoked?',   type: 'bool' },
    ],
  },
  {
    id: 'chief',
    title: 'Main concern',
    fields: [
      {
        key: 'chief_complaint', label: 'What best describes your main concern?', type: 'select',
        options: [
          { v: 'chest_cardiac', l: 'Chest pain / Heart / Breathing' },
          { v: 'skin',          l: 'Skin problem / Unusual lesion' },
          { v: 'general_other', l: 'General illness / Fever / Fatigue' },
        ],
      },
    ],
  },
  {
    id: 'cardiac',
    title: 'Chest & cardiac symptoms',
    showIf: (a) => a.chief_complaint === 'chest_cardiac',
    fields: [
      { key: 'chest_pain',          label: 'Chest pain or pressure?',                  type: 'bool' },
      { key: 'chest_pain_radiates', label: 'Pain spreads to arm, jaw or shoulder?',    type: 'bool' },
      {
        key: 'palpitation_type', label: 'Heart palpitations?', type: 'select',
        options: [
          { v: 'none', l: 'None' }, { v: 'irregular', l: 'Irregular' },
          { v: 'rapid', l: 'Rapid' }, { v: 'slow', l: 'Slow' },
        ],
      },
      { key: 'syncope',       label: 'Ever fainted or nearly fainted?',  type: 'bool' },
      {
        key: 'breath_pattern', label: 'Shortness of breath?', type: 'select',
        options: [
          { v: 'none', l: 'None' }, { v: 'exertion', l: 'On exertion' },
          { v: 'rest', l: 'At rest' }, { v: 'lying_down', l: 'Worse lying down' },
        ],
      },
      { key: 'leg_swelling',  label: 'Leg or ankle swelling?',           type: 'bool' },
      {
        key: 'cough_type', label: 'Cough type?', type: 'select',
        options: [
          { v: 'none', l: 'None' }, { v: 'dry', l: 'Dry cough' },
          { v: 'productive', l: 'Productive / with phlegm' }, { v: 'blood', l: 'With blood' },
        ],
      },
      { key: 'fever', label: 'Fever or chills?', type: 'bool' },
    ],
  },
  {
    id: 'skin',
    title: 'Skin symptoms',
    showIf: (a) => a.chief_complaint === 'skin',
    fields: [
      { key: 'skin_lesion',          label: 'Visible skin lesion or unusual mole?',   type: 'bool' },
      { key: 'lesion_changing',      label: 'Growing or changing in colour / shape?', type: 'bool' },
      { key: 'sun_exposure_history', label: 'History of prolonged sun exposure?',     type: 'bool' },
      {
        key: 'lesion_features', label: 'Lesion characteristics?', type: 'select',
        options: [
          { v: 'none', l: 'None / Unknown' },
          { v: 'irregular_border',   l: 'Irregular border' },
          { v: 'multiple_colors',    l: 'Multiple colours' },
          { v: 'bleeding_itching',   l: 'Bleeding / Itching' },
        ],
      },
    ],
  },
  {
    id: 'general',
    title: 'General symptoms',
    fields: [
      { key: 'fever', label: 'Fever or chills?', type: 'bool' },
      {
        key: 'systemic', label: 'Fatigue or weight loss?', type: 'select',
        options: [
          { v: 'none', l: 'Neither' }, { v: 'fatigue', l: 'Fatigue only' },
          { v: 'weight_loss', l: 'Weight loss only' }, { v: 'both', l: 'Both' },
        ],
      },
      { key: 'other_systemic', label: 'Nausea or dizziness?', type: 'bool' },
      {
        key: 'risk_factors', label: 'Pre-existing conditions?', type: 'select',
        options: [
          { v: 'none', l: 'None' }, { v: 'hypertension', l: 'Hypertension' },
          { v: 'diabetes', l: 'Diabetes' }, { v: 'both', l: 'Both' },
        ],
      },
    ],
  },
]

const DEFAULTS = {
  age: 35, sex: 'M', smoking_history: 0, chief_complaint: 'chest_cardiac',
  chest_pain: 0, chest_pain_radiates: 0, palpitation_type: 'none',
  syncope: 0, breath_pattern: 'none', leg_swelling: 0, cough_type: 'none',
  fever: 0, skin_lesion: 0, lesion_changing: 0, sun_exposure_history: 0,
  lesion_features: 'none', systemic: 'none', other_systemic: 0, risk_factors: 'none',
}

/* ─────────────────────────────────────────────────────────────────────────
   Field renderer
   ───────────────────────────────────────────────────────────────────────── */

function Field({ field, value, onChange, disabled }) {
  if (field.type === 'bool') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[{ v: 1, l: 'Yes' }, { v: 0, l: 'No' }].map(opt => {
          const active = value === opt.v
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange(opt.v)}
              disabled={disabled}
              className={[
                'py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 font-display',
                active ? 'text-white' : 'neu-tile text-[#1E2938] hover:text-[#1E2938]',
              ].join(' ')}
              style={active ? {
                background: `linear-gradient(145deg, ${ACCENT}, ${ACCENT}cc)`,
                boxShadow: `-3px -3px 8px rgba(255,255,255,0.7), 4px 4px 10px ${ACCENT}55`,
              } : undefined}
            >
              {opt.l}
            </button>
          )
        })}
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <select
        className="neu-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {field.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    )
  }
  return (
    <input
      className="neu-input"
      type="number"
      min={field.min}
      max={field.max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      disabled={disabled}
    />
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────────────────────────────── */

export default function SymptomChecker() {
  const [answers, setAnswers]           = useState(DEFAULTS)
  const [step, setStep]                 = useState(0)
  const [loading, setLoading]           = useState(false)
  const [showDiseases, setShowDiseases] = useState(false)
  const navigate = useNavigate()
  const root     = useRef(null)
  const stepRef  = useRef(null)

  // Filter steps: exclude branches that don't apply
  const visibleSteps = STEPS.filter(s => !s.showIf || s.showIf(answers))
  const filteredSteps = visibleSteps.filter(s =>
    !(s.id === 'general' && answers.chief_complaint === 'chest_cardiac')
  )
  const current = filteredSteps[step]
  const isLast  = step === filteredSteps.length - 1
  const progress = ((step + 1) / filteredSteps.length) * 100

  // Initial page entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sym-anim', {
        y: 22, opacity: 0,
        duration: 0.7, ease: 'power3.out',
        stagger: 0.08,
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // Animate step contents when step changes
  useEffect(() => {
    if (!stepRef.current) return
    const fields = stepRef.current.querySelectorAll('.sym-field')
    gsap.fromTo(
      fields,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.06 }
    )
  }, [step, current?.id])

  function update(key, val) {
    setAnswers(p => ({ ...p, [key]: val }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { data } = await analyzeAPI.symptoms(answers)
      navigate('/patient/results', { state: { result: data } })
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(Array.isArray(detail) ? 'Validation error' : detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={root} className="neu-surface min-h-full p-6 lg:p-8 font-display">
      <div className="max-w-2xl mx-auto">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="sym-anim mb-6">
          <p
            className="font-caps text-[10px] mb-1"
            style={{ color: ACCENT }}
          >
            [ Symptom Checker ]
          </p>
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ACCENT}14`, color: ACCENT, boxShadow: `inset 0 0 0 1px ${ACCENT}26` }}
            >
              <FlaskConical className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1E2938] leading-tight">All Disease Checkup</h1>
              <p className="text-sm text-slate-500 mt-1 font-sans">AI-powered prediction across 22 disease categories.</p>
            </div>
          </div>
        </div>

        {/* ── Badges + expandable diseases ─────────────────────────────── */}
        <div className="sym-anim flex flex-wrap gap-2 mb-5">
          <span className="neu-pill text-[#1E2938] !text-[10px]">
            <Cpu className="w-3 h-3" />
            XGBoost · LightGBM · Random Forest
          </span>
          <button
            onClick={() => setShowDiseases(v => !v)}
            className="neu-pill !text-[10px] transition-colors"
            style={{ color: ACCENT }}
          >
            <CheckCircle2 className="w-3 h-3" />
            {DETECTABLE.length} detectable diseases
            {showDiseases ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showDiseases && (
          <div className="sym-anim neu-card-sm p-4 mb-5">
            <p className="font-caps text-[9px] text-slate-500 mb-2">Detectable conditions</p>
            <div className="flex flex-wrap gap-1.5">
              {DETECTABLE.map(d => (
                <span
                  key={d}
                  className="font-caps text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: `${ACCENT}10`, color: ACCENT }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Progress ─────────────────────────────────────────────────── */}
        <div className="sym-anim mb-6">
          <div className="neu-inset h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}aa)` }}
            />
          </div>
          <p className="font-caps text-[10px] text-slate-500 mt-2">
            Step {step + 1} of {filteredSteps.length} · approximately {filteredSteps.length * 2}–{filteredSteps.length * 3} questions
          </p>
        </div>

        {/* ── Question card ────────────────────────────────────────────── */}
        <div className="sym-anim neu-card p-6 lg:p-7" key={current?.id}>
          <h2 className="text-lg font-bold text-[#1E2938] mb-6">{current?.title}</h2>

          <div ref={stepRef} className="space-y-5">
            {current?.fields.map(f => (
              <div key={f.key} className="sym-field">
                <label className="block font-caps text-[10px] text-slate-500 mb-2">{f.label}</label>
                <Field field={f} value={answers[f.key]} onChange={v => update(f.key, v)} disabled={loading} />
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={loading}
                className="neu-btn flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] font-display"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="relative flex-1 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wider font-display disabled:opacity-50 transition-all overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${ACCENT}, ${ACCENT}dd)`,
                  boxShadow: `-3px -3px 8px rgba(255,255,255,0.7), 4px 4px 12px ${ACCENT}55`,
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Running model</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Run disease prediction</>
                  )}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wider font-display transition-all"
                style={{
                  background: `linear-gradient(145deg, ${ACCENT}, ${ACCENT}dd)`,
                  boxShadow: `-3px -3px 8px rgba(255,255,255,0.7), 4px 4px 12px ${ACCENT}55`,
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5 font-caps text-xs">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
          </div>
        </div>

        <p className="sym-anim font-caps text-[10px] text-slate-500 text-center mt-5">
          Results are AI-generated for screening only · always consult a physician
        </p>

        <style>{`
          @keyframes shimmer {
            0%   { background-position: -100% 0; }
            100% { background-position:  200% 0; }
          }
        `}</style>
      </div>
    </div>
  )
}
