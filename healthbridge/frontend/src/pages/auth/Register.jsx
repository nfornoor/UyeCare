import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Heart, User, Stethoscope,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const SPECIALTIES  = [
  'Cardiologist', 'Dermatologist', 'General Physician', 'Neurologist',
  'Oncologist', 'Orthopedic Surgeon', 'Pediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Other',
]

const PATIENT_DEFAULTS = {
  name: '', email: '', password: '', role: 'patient',
  date_of_birth: '', sex: '', blood_group: '', phone: '',
  emergency_contact: '',
  // Cascading BD location fields
  division: '', district: '', upazila: '', union: '', address_details: '',
}

const DOCTOR_DEFAULTS = {
  name: '', email: '', password: '', role: 'doctor',
  specialty: '', license_no: '', hospital: '',
  experience_years: '', phone: '', bio: '',
}

/* ─────────────────────────────────────────────────────────────────────────
   Small building blocks
   ───────────────────────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.08em] mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, htmlFor, required, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="premium-label">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-gray-500">{hint}</p>}
    </div>
  )
}

function PasswordInput({ id, value, onChange, loading, show, setShow }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="At least 6 characters"
        minLength={6}
        required
        disabled={loading}
        className="premium-input pr-11"
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Cascading location picker (Division → District → Upazila → Union)
   Data sourced from /public/bd-locations.json
   ───────────────────────────────────────────────────────────────────────── */

function LocationCascade({ bdData, bdLoading, values, set, disabled }) {
  const { division, district, upazila, union, address_details } = values

  // Derive the dropdown options based on current selections
  const divObj  = bdData?.divisions?.find(d => d.name === division)
  const distObj = divObj?.districts?.find(d => d.name === district)
  const upzObj  = distObj?.upazilas?.find(u => u.name === upazila)

  const districts = divObj?.districts || []
  const upazilas  = distObj?.upazilas || []
  const unions    = upzObj?.unions || []

  function update(key, value) {
    // Reset descendants when a parent changes
    const reset = {
      division: { district: '', upazila: '', union: '' },
      district: { upazila: '', union: '' },
      upazila:  { union: '' },
    }
    set(p => ({ ...p, [key]: value, ...(reset[key] || {}) }))
  }

  if (bdLoading) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center">
        <Loader2 className="w-4 h-4 animate-spin inline-block text-gray-400 mr-2" />
        <span className="text-[13px] text-gray-500">Loading location data…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-gray-500">
        <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
        <span>Pick step-by-step — start with division, then narrow down.</span>
      </div>

      <Field label="Division" htmlFor="loc-div">
        <select
          id="loc-div"
          className="premium-input"
          disabled={disabled}
          value={division}
          onChange={(e) => update('division', e.target.value)}
        >
          <option value="">Select division</option>
          {bdData?.divisions?.map(d => (
            <option key={d.id} value={d.name}>{d.name} · {d.bn_name}</option>
          ))}
        </select>
      </Field>

      {division && districts.length > 0 && (
        <Field label="District" htmlFor="loc-dist">
          <select
            id="loc-dist"
            className="premium-input"
            disabled={disabled}
            value={district}
            onChange={(e) => update('district', e.target.value)}
          >
            <option value="">Select district</option>
            {districts.map(d => (
              <option key={d.id} value={d.name}>{d.name} · {d.bn_name}</option>
            ))}
          </select>
        </Field>
      )}

      {district && upazilas.length > 0 && (
        <Field label="Upazila / Thana" htmlFor="loc-upz">
          <select
            id="loc-upz"
            className="premium-input"
            disabled={disabled}
            value={upazila}
            onChange={(e) => update('upazila', e.target.value)}
          >
            <option value="">Select upazila</option>
            {upazilas.map(u => (
              <option key={u.id} value={u.name}>{u.name} · {u.bn_name}</option>
            ))}
          </select>
        </Field>
      )}

      {upazila && unions.length > 0 && (
        <Field label="Union" htmlFor="loc-union">
          <select
            id="loc-union"
            className="premium-input"
            disabled={disabled}
            value={union}
            onChange={(e) => update('union', e.target.value)}
          >
            <option value="">Select union</option>
            {unions.map(u => (
              <option key={u.id} value={u.name}>{u.name} · {u.bn_name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Address details" htmlFor="loc-addr" hint="House / road / village — anything that helps locate you.">
        <input
          id="loc-addr"
          className="premium-input"
          placeholder="House #, road #, village or area"
          disabled={disabled}
          value={address_details}
          onChange={(e) => set(p => ({ ...p, address_details: e.target.value }))}
        />
      </Field>
    </div>
  )
}

function joinLocation({ address_details, union, upazila, district, division }) {
  return [address_details, union, upazila, district, division]
    .map(s => (s || '').trim())
    .filter(Boolean)
    .join(', ')
}

/* ─────────────────────────────────────────────────────────────────────────
   Forms
   ───────────────────────────────────────────────────────────────────────── */

function PatientForm({ form, set, loading, showPw, setShowPw, bdData, bdLoading }) {
  const update = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  return (
    <div className="space-y-7">
      <Section title="Account">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="pt-name" required>
            <input id="pt-name" className="premium-input" placeholder="Jane Doe" required disabled={loading}
              autoComplete="name" value={form.name} onChange={update('name')} />
          </Field>
          <Field label="Phone" htmlFor="pt-phone">
            <input id="pt-phone" className="premium-input" type="tel" placeholder="+880…" disabled={loading}
              autoComplete="tel" value={form.phone} onChange={update('phone')} />
          </Field>
        </div>
        <Field label="Email" htmlFor="pt-email" required>
          <input id="pt-email" className="premium-input" type="email" placeholder="you@example.com" required disabled={loading}
            autoComplete="email" value={form.email} onChange={update('email')} />
        </Field>
        <Field label="Password" htmlFor="pt-pw" required>
          <PasswordInput id="pt-pw" value={form.password} onChange={update('password')}
            loading={loading} show={showPw} setShow={setShowPw} />
        </Field>
      </Section>

      <Section title="Personal details">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date of birth" htmlFor="pt-dob" required>
            <input id="pt-dob" className="premium-input" type="date" required disabled={loading}
              value={form.date_of_birth} onChange={update('date_of_birth')} />
          </Field>
          <Field label="Sex" htmlFor="pt-sex" required>
            <select id="pt-sex" className="premium-input" required disabled={loading}
              value={form.sex} onChange={update('sex')}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Blood group" htmlFor="pt-blood" required>
            <select id="pt-blood" className="premium-input" required disabled={loading}
              value={form.blood_group} onChange={update('blood_group')}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Address">
        <LocationCascade
          bdData={bdData}
          bdLoading={bdLoading}
          values={form}
          set={set}
          disabled={loading}
        />
      </Section>

      <Section title="Emergency contact (optional)">
        <Field label="Name & phone" htmlFor="pt-ec">
          <input id="pt-ec" className="premium-input" placeholder="Name — phone number" disabled={loading}
            value={form.emergency_contact} onChange={update('emergency_contact')} />
        </Field>
      </Section>
    </div>
  )
}

function DoctorForm({ form, set, loading, showPw, setShowPw }) {
  const update = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  return (
    <div className="space-y-7">
      <Section title="Account">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="dr-name" required>
            <input id="dr-name" className="premium-input" placeholder="Dr. Full Name" required disabled={loading}
              autoComplete="name" value={form.name} onChange={update('name')} />
          </Field>
          <Field label="Phone" htmlFor="dr-phone" required>
            <input id="dr-phone" className="premium-input" type="tel" placeholder="+880…" required disabled={loading}
              autoComplete="tel" value={form.phone} onChange={update('phone')} />
          </Field>
        </div>
        <Field label="Email" htmlFor="dr-email" required>
          <input id="dr-email" className="premium-input" type="email" placeholder="doctor@hospital.com" required disabled={loading}
            autoComplete="email" value={form.email} onChange={update('email')} />
        </Field>
        <Field label="Password" htmlFor="dr-pw" required>
          <PasswordInput id="dr-pw" value={form.password} onChange={update('password')}
            loading={loading} show={showPw} setShow={setShowPw} />
        </Field>
      </Section>

      <Section title="Credentials">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Specialty" htmlFor="dr-spec" required>
            <select id="dr-spec" className="premium-input" required disabled={loading}
              value={form.specialty} onChange={update('specialty')}>
              <option value="">Select specialty</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Years of experience" htmlFor="dr-exp">
            <input id="dr-exp" className="premium-input" type="number" min="0" max="60" placeholder="e.g. 5" disabled={loading}
              value={form.experience_years} onChange={update('experience_years')} />
          </Field>
        </div>
        <Field label="License / registration no." htmlFor="dr-lic" required>
          <input id="dr-lic" className="premium-input" placeholder="BMDC-12345" required disabled={loading}
            value={form.license_no} onChange={update('license_no')} />
        </Field>
      </Section>

      <Section title="Professional (optional)">
        <Field label="Hospital / clinic" htmlFor="dr-hosp">
          <input id="dr-hosp" className="premium-input" placeholder="Hospital or clinic name" disabled={loading}
            value={form.hospital} onChange={update('hospital')} />
        </Field>
        <Field label="Short bio" htmlFor="dr-bio">
          <textarea id="dr-bio" rows={3}
            className="premium-input resize-none"
            placeholder="Brief professional background…"
            disabled={loading}
            value={form.bio}
            onChange={update('bio')}
          />
        </Field>
      </Section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Pending screen (doctor approval)
   ───────────────────────────────────────────────────────────────────────── */

function PendingScreen() {
  return (
    <div className="relative min-h-screen bg-[#F1F0EC] bg-grid font-sans antialiased text-[#111827] flex items-center justify-center px-6 theme-warm">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-br from-[#F97316]/12 via-[#D97706]/8 to-transparent blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#D97706]/12 flex items-center justify-center mx-auto mb-5 ring-1 ring-[#D97706]/20">
          <Mail className="w-6 h-6 text-[#D97706]" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight leading-tight">Application submitted</h1>
        <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">
          Your doctor account is pending admin approval. You'll receive an email when an administrator
          reviews and approves your credentials.
        </p>
        <div className="mt-7">
          <Link to="/login" className="premium-btn-warm">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Page root
   ───────────────────────────────────────────────────────────────────────── */

export default function Register() {
  const [params] = useSearchParams()
  const initialRole = params.get('role') || 'patient'

  const [role, setRole]                   = useState(initialRole)
  const [patForm, setPatForm]             = useState({ ...PATIENT_DEFAULTS, role: 'patient' })
  const [docForm, setDocForm]             = useState({ ...DOCTOR_DEFAULTS, role: 'doctor' })
  const [loading, setLoading]             = useState(false)
  const [showPw, setShowPw]               = useState(false)
  const [doctorPending, setDoctorPending] = useState(false)
  const [error, setError]                 = useState('')

  // Bangladesh administrative data — fetched once at mount
  const [bdData, setBdData]               = useState(null)
  const [bdLoading, setBdLoading]         = useState(true)

  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  useEffect(() => {
    fetch('/bd-locations.json')
      .then(r => r.json())
      .then(data => setBdData(data))
      .catch(err => console.error('[Register] failed to load /bd-locations.json:', err))
      .finally(() => setBdLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Patient: collapse cascading location into the single `address` string
      // the backend currently accepts; drop the cascade keys from the payload.
      let payload
      if (role === 'patient') {
        const { division, district, upazila, union, address_details, ...rest } = patForm
        payload = {
          ...rest,
          role: 'patient',
          address: joinLocation({ address_details, union, upazila, district, division }) || undefined,
        }
      } else {
        payload = { ...docForm, role: 'doctor' }
        if (payload.experience_years === '') delete payload.experience_years
      }

      const { data } = await authAPI.register(payload)

      if (data.user.status === 'pending_approval') {
        setDoctorPending(true)
        return
      }

      setAuth(data.user, data.access_token)
      toast.success('Welcome to UyeCare')
      const dest =
        data.user.role === 'admin'  ? '/admin'  :
        data.user.role === 'doctor' ? '/doctor' : '/patient'
      navigate(dest)
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please review your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (doctorPending) return <PendingScreen />

  return (
    <div className="relative min-h-screen bg-[#F1F0EC] bg-grid text-[#111827] font-sans antialiased theme-warm">
      {/* Gradient mesh in the landing palette */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[820px] h-[820px] rounded-full bg-gradient-to-br from-[#F97316]/12 via-[#D97706]/8 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[#2563eb]/6 blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Top bar */}
      <div className="relative px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Centered column */}
      <div className="relative px-6 pb-20 pt-8">
        <div className="w-full max-w-[480px] mx-auto">
          {/* Brand + heading */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6" aria-label="UyeCare home">
              <div className="w-9 h-9 rounded-[10px] bg-[#F97316] flex items-center justify-center shadow-[0_10px_28px_-10px_rgba(249,115,22,0.55)]">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[17px] tracking-tight">UyeCare</span>
            </Link>
            <h1 className="text-[30px] font-bold tracking-tight leading-[1.15]">
              Create your account.
            </h1>
            <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
              {role === 'doctor'
                ? 'Submit your credentials for admin approval.'
                : 'A free account, ready in under a minute.'}
            </p>
          </div>

          {/* Role segmented control */}
          <div
            role="tablist"
            aria-label="Account type"
            className="bg-white/70 border border-black/5 rounded-xl p-1 grid grid-cols-2 gap-1 mb-7 backdrop-blur-sm"
          >
            {[
              { key: 'patient', icon: User,        label: "I'm a Patient" },
              { key: 'doctor',  icon: Stethoscope, label: "I'm a Doctor"  },
            ].map(({ key, icon: Icon, label }) => {
              const active = role === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setRole(key); setError('') }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 ${
                    active
                      ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              )
            })}
          </div>

          {/* Doctor approval notice */}
          {role === 'doctor' && (
            <div className="bg-[#D97706]/8 border border-[#D97706]/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
              <p className="text-[13px] text-[#92400E] leading-snug">
                Doctor accounts require admin approval before you can sign in.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {role === 'patient'
              ? <PatientForm
                  form={patForm}
                  set={setPatForm}
                  loading={loading}
                  showPw={showPw}
                  setShowPw={setShowPw}
                  bdData={bdData}
                  bdLoading={bdLoading}
                />
              : <DoctorForm
                  form={docForm}
                  set={setDocForm}
                  loading={loading}
                  showPw={showPw}
                  setShowPw={setShowPw}
                />
            }

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#DC2626]/8 text-[#991B1B] text-[13px]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="premium-btn-warm mt-7">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                role === 'doctor' ? 'Submit for approval' : 'Create account'
              )}
            </button>

            <p className="text-center text-[12px] text-gray-400 mt-4 leading-relaxed px-4">
              By continuing you agree to our terms · UyeCare is a decision-support tool.
            </p>
          </form>

          <p className="text-center text-[14px] text-gray-500 mt-7">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#F97316] hover:text-[#EA580C] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 rounded"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
