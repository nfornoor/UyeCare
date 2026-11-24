import { useState, useEffect, useRef } from 'react'
import { healthProfileAPI, chatAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  User, Save, Send, Bot, ChevronDown, ChevronUp,
  Activity, MessageCircle, RefreshCw,
} from 'lucide-react'

/* ── BMI helper ─────────────────────────────────────────────────────────── */
function calcBMI(height, weight) {
  const h = parseFloat(height)
  const w = parseFloat(weight)
  if (!h || !w || h <= 0) return null
  const bmi = w / ((h / 100) ** 2)
  let cat = ''
  if (bmi < 18.5)      cat = 'Underweight'
  else if (bmi < 25)   cat = 'Normal'
  else if (bmi < 30)   cat = 'Overweight'
  else                 cat = 'Obese'
  return { value: bmi.toFixed(1), category: cat }
}

/* ── Build Groq context string from profile ─────────────────────────────── */
function buildContext(profile, user) {
  if (!profile || Object.keys(profile).length === 0) return null
  const lines = ['Patient Personal Health Profile:']
  if (user?.name) lines.push(`Name: ${user.name}`)
  if (profile.height_cm || profile.weight_kg) {
    const bmi = calcBMI(profile.height_cm, profile.weight_kg)
    lines.push(`Height: ${profile.height_cm ?? '—'} cm | Weight: ${profile.weight_kg ?? '—'} kg${bmi ? ` | BMI: ${bmi.value} (${bmi.category})` : ''}`)
  }
  if (profile.blood_pressure)       lines.push(`Blood pressure: ${profile.blood_pressure} mmHg`)
  if (profile.blood_sugar)          lines.push(`Fasting blood sugar: ${profile.blood_sugar}`)
  if (profile.existing_conditions)  lines.push(`Existing conditions: ${profile.existing_conditions}`)
  if (profile.current_medications)  lines.push(`Current medications: ${profile.current_medications}`)
  if (profile.allergies)            lines.push(`Allergies: ${profile.allergies}`)
  const lifestyle = [
    profile.smoking    && `Smoking: ${profile.smoking}`,
    profile.alcohol    && `Alcohol: ${profile.alcohol}`,
    profile.exercise   && `Exercise: ${profile.exercise}`,
    profile.diet       && `Diet: ${profile.diet}`,
  ].filter(Boolean)
  if (lifestyle.length) lines.push(`Lifestyle: ${lifestyle.join(' | ')}`)
  return lines.join('\n')
}

const EMPTY_PROFILE = {
  height_cm: '', weight_kg: '', blood_pressure: '', blood_sugar: '',
  existing_conditions: '', current_medications: '', allergies: '',
  smoking: '', alcohol: '', exercise: '', diet: '',
}

const SUGGESTIONS = [
  'What foods should I avoid with my conditions?',
  'Is my BMI in a healthy range?',
  'What lifestyle changes would help me most?',
  'How often should I check my blood pressure?',
  'What symptoms should I watch out for?',
  'Am I at risk for any complications?',
]

/* ── Profile form ───────────────────────────────────────────────────────── */
function ProfileForm({ profile, setProfile, onSave, saving }) {
  const [open, setOpen] = useState(true)
  const bmi = calcBMI(profile.height_cm, profile.weight_kg)

  function set(key, val) {
    setProfile(p => ({ ...p, [key]: val }))
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">Health Profile</span>
          {Object.values(profile).some(v => v !== '') && (
            <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Saved</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-xs text-slate-400 mt-3 mb-4">
            Fill in your health details so the AI can give you personalised answers.
          </p>

          <div className="space-y-4">
            {/* Measurements */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Measurements</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Height (cm)</label>
                  <input className="input text-sm py-2" type="number" placeholder="e.g. 170"
                    value={profile.height_cm} onChange={e => set('height_cm', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Weight (kg)</label>
                  <input className="input text-sm py-2" type="number" placeholder="e.g. 65"
                    value={profile.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
                </div>
              </div>
              {bmi && (
                <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg font-medium ${
                  bmi.category === 'Normal'      ? 'bg-green-50 text-green-700'  :
                  bmi.category === 'Underweight' ? 'bg-blue-50 text-blue-700'   :
                  bmi.category === 'Overweight'  ? 'bg-amber-50 text-amber-700' :
                                                   'bg-red-50 text-red-700'
                }`}>
                  BMI: {bmi.value} — {bmi.category}
                </div>
              )}
            </div>

            {/* Vitals */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vitals</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Blood Pressure (mmHg)</label>
                  <input className="input text-sm py-2" placeholder="e.g. 120/80"
                    value={profile.blood_pressure} onChange={e => set('blood_pressure', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Fasting Blood Sugar</label>
                  <input className="input text-sm py-2" placeholder="e.g. 5.5 mmol/L"
                    value={profile.blood_sugar} onChange={e => set('blood_sugar', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Medical */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Medical History</p>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Existing Conditions</label>
                  <textarea className="input text-sm py-2 resize-none h-16"
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma…"
                    value={profile.existing_conditions}
                    onChange={e => set('existing_conditions', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Current Medications</label>
                  <textarea className="input text-sm py-2 resize-none h-16"
                    placeholder="e.g. Metformin 500mg, Amlodipine 5mg…"
                    value={profile.current_medications}
                    onChange={e => set('current_medications', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Allergies</label>
                  <input className="input text-sm py-2" placeholder="e.g. Penicillin, Peanuts"
                    value={profile.allergies} onChange={e => set('allergies', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lifestyle</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Smoking</label>
                  <select className="input text-sm py-2" value={profile.smoking} onChange={e => set('smoking', e.target.value)}>
                    <option value="">Select</option>
                    <option>Non-smoker</option>
                    <option>Ex-smoker</option>
                    <option>Current smoker</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Alcohol</label>
                  <select className="input text-sm py-2" value={profile.alcohol} onChange={e => set('alcohol', e.target.value)}>
                    <option value="">Select</option>
                    <option>None</option>
                    <option>Occasional</option>
                    <option>Regular</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Exercise</label>
                  <select className="input text-sm py-2" value={profile.exercise} onChange={e => set('exercise', e.target.value)}>
                    <option value="">Select</option>
                    <option>None</option>
                    <option>Light (1–2x/week)</option>
                    <option>Moderate (3–4x/week)</option>
                    <option>Regular (5+/week)</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Diet</label>
                  <select className="input text-sm py-2" value={profile.diet} onChange={e => set('diet', e.target.value)}>
                    <option value="">Select</option>
                    <option>Regular</option>
                    <option>Vegetarian</option>
                    <option>Vegan</option>
                    <option>Low-carb</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary w-full mt-5 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving</>
              : <><Save className="w-4 h-4" /> Save Profile</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Chat message bubble ────────────────────────────────────────────────── */
function Bubble({ role, content }) {
  const isBot = role === 'assistant'
  return (
    <div className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isBot ? 'bg-primary-100' : 'bg-slate-200'}`}>
        {isBot ? <Bot className="w-4 h-4 text-primary-600" /> : <User className="w-4 h-4 text-slate-600" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isBot ? 'bg-white border border-slate-200 text-slate-800' : 'bg-primary-600 text-white'
      }`}>
        {content}
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function HealthAssistant() {
  const { user } = useAuthStore()
  const [profile, setProfile]   = useState(EMPTY_PROFILE)
  const [saving, setSaving]     = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [history, setHistory]   = useState([])
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    healthProfileAPI.get()
      .then(r => { if (r.data && Object.keys(r.data).length) setProfile({ ...EMPTY_PROFILE, ...r.data }) })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, thinking])

  async function saveProfile() {
    setSaving(true)
    try {
      await healthProfileAPI.save(profile)
      toast.success('Health profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(text) {
    const msg = (text || input).trim()
    if (!msg || thinking) return
    setInput('')

    const next = [...history, { role: 'user', content: msg }]
    setHistory(next)
    setThinking(true)

    const context = buildContext(profile, user)

    try {
      const { data } = await chatAPI.send(msg, history, context)
      setHistory([...next, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Something went wrong. Please try again.'
      setHistory([...next, { role: 'assistant', content: errMsg }])
    } finally {
      setThinking(false)
    }
  }

  const hasProfile = Object.values(profile).some(v => v !== '')

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: profile panel ─────────────────────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4">
        <div className="mb-4">
          <h2 className="font-bold text-slate-800 text-base">Personal Health Info</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your details help the AI give personalised answers</p>
        </div>
        {loadingProfile
          ? <div className="flex justify-center py-10"><LoadingSpinner /></div>
          : <ProfileForm profile={profile} setProfile={setProfile} onSave={saveProfile} saving={saving} />
        }
      </div>

      {/* ── Right: chat ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">UyeCare Health Assistant</p>
              <p className="text-xs text-slate-400">
                {hasProfile ? 'Answering with your health profile as context' : 'Fill in your profile for personalised answers'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setHistory([])}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Ask anything about your health</h3>
                <p className="text-sm text-slate-400">
                  {hasProfile
                    ? 'Your health profile is loaded. The AI will tailor its answers to your specific conditions and lifestyle.'
                    : 'You can ask general health questions, or fill in your profile on the left for personalised answers.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-xs text-left bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {history.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
              {thinking && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Ask about your health, symptoms, diet, medications…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={thinking}
            />
            <button type="submit" disabled={!input.trim() || thinking} className="btn-primary px-4 py-2.5 rounded-xl disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-2">
            UyeCare AI does not prescribe medications or replace a physician's advice.
          </p>
        </div>
      </div>
    </div>
  )
}
