import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  User, LogOut, Pencil, Mail, Phone, Droplets, Calendar, MapPin,
  Stethoscope, Award, Briefcase, X, Loader2,
} from 'lucide-react'
import { authAPI, getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const SPECIALTIES = [
  'Cardiologist', 'Dermatologist', 'General Physician', 'Neurologist',
  'Oncologist', 'Orthopedic Surgeon', 'Pediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Other',
]

/* ─────────────────────────────────────────────────────────────────────────
   Avatar button + dropdown
   ───────────────────────────────────────────────────────────────────────── */

export default function ProfileMenu() {
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (open && wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="neu-tile w-10 h-10 flex items-center justify-center font-bold text-sm text-[#006666] font-display"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {user.name?.[0]?.toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 neu-card p-4 font-display">
          <div className="flex items-center gap-3 pb-3 border-b border-black/[0.06]">
            <div className="neu-icon-tile-accent w-11 h-11 text-base font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1E2938] truncate">
                {user.role === 'doctor' ? `Dr. ${user.name}` : user.name}
              </p>
              <p className="font-caps text-[9px] text-slate-500 truncate mt-0.5">{user.email}</p>
              {user.display_id && (
                <p className="font-caps text-[9px] text-[#006666] mt-0.5">{user.display_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <button
              onClick={() => { setOpen(false); setEditing(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#1E2938] hover:bg-black/[0.03] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-[#006666]" /> Edit profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#FF2157] hover:bg-[#FF2157]/8 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      {editing && (
        <ProfileModal
          user={user}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Edit modal
   ───────────────────────────────────────────────────────────────────────── */

function ProfileModal({ user, onClose }) {
  const refreshUser = useAuthStore(s => s.refreshUser)
  const [form, setForm] = useState({
    name:              user.name              || '',
    phone:             user.phone             || '',
    date_of_birth:     user.date_of_birth     || '',
    sex:               user.sex               || '',
    blood_group:       user.blood_group       || '',
    emergency_contact: user.emergency_contact || '',
    address:           user.address           || '',
    specialty:         user.specialty         || '',
    license_no:        user.license_no        || '',
    hospital:          user.hospital          || '',
    experience_years:  user.experience_years ?? '',
    bio:               user.bio               || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function update(k) {
    return (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      // Send only fields relevant to the role
      const base = { name: form.name, phone: form.phone }
      const payload = user.role === 'doctor'
        ? {
            ...base,
            specialty: form.specialty,
            license_no: form.license_no,
            hospital: form.hospital,
            experience_years: form.experience_years === '' ? null : Number(form.experience_years),
            bio: form.bio,
          }
        : {
            ...base,
            date_of_birth: form.date_of_birth,
            sex: form.sex,
            blood_group: form.blood_group,
            emergency_contact: form.emergency_contact,
            address: form.address,
          }
      await authAPI.updateMe(payload)
      await refreshUser()
      toast.success('Profile updated')
      onClose()
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not update profile')
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-display"
      onClick={onClose}
    >
      <div
        className="neu-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-caps text-[10px] text-[#006666] mb-1">[ Edit Profile ]</p>
            <h2 className="text-xl font-bold text-[#1E2938]">{user.role === 'doctor' ? `Dr. ${user.name}` : user.name}</h2>
            <p className="font-caps text-[9px] text-slate-500 mt-1">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-black/[0.04]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <ProfileField icon={User} label="Full name">
            <input className="neu-input" value={form.name} onChange={update('name')} required disabled={saving} />
          </ProfileField>

          <ProfileField icon={Phone} label="Phone">
            <input className="neu-input" type="tel" value={form.phone} onChange={update('phone')} disabled={saving} />
          </ProfileField>

          {user.role === 'patient' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ProfileField icon={Calendar} label="Date of birth">
                  <input className="neu-input" type="date" value={form.date_of_birth} onChange={update('date_of_birth')} disabled={saving} />
                </ProfileField>
                <ProfileField icon={User} label="Sex">
                  <select className="neu-input" value={form.sex} onChange={update('sex')} disabled={saving}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </ProfileField>
              </div>
              <ProfileField icon={Droplets} label="Blood group">
                <select className="neu-input" value={form.blood_group} onChange={update('blood_group')} disabled={saving}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </ProfileField>
              <ProfileField icon={Mail} label="Emergency contact">
                <input className="neu-input" placeholder="Name — phone" value={form.emergency_contact} onChange={update('emergency_contact')} disabled={saving} />
              </ProfileField>
              <ProfileField icon={MapPin} label="Address">
                <input className="neu-input" placeholder="City, Country" value={form.address} onChange={update('address')} disabled={saving} />
              </ProfileField>
            </>
          )}

          {user.role === 'doctor' && (
            <>
              <ProfileField icon={Stethoscope} label="Specialty">
                <select className="neu-input" value={form.specialty} onChange={update('specialty')} disabled={saving}>
                  <option value="">Select</option>
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </ProfileField>
              <div className="grid grid-cols-2 gap-3">
                <ProfileField icon={Award} label="License no.">
                  <input className="neu-input" value={form.license_no} onChange={update('license_no')} disabled={saving} />
                </ProfileField>
                <ProfileField icon={Briefcase} label="Experience (yrs)">
                  <input className="neu-input" type="number" min="0" max="60" value={form.experience_years} onChange={update('experience_years')} disabled={saving} />
                </ProfileField>
              </div>
              <ProfileField icon={Stethoscope} label="Hospital / clinic">
                <input className="neu-input" value={form.hospital} onChange={update('hospital')} disabled={saving} />
              </ProfileField>
              <ProfileField icon={User} label="Bio">
                <textarea className="neu-input resize-none" rows={3} value={form.bio} onChange={update('bio')} disabled={saving} />
              </ProfileField>
            </>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#DC2626]/8 text-[#991B1B] text-[13px]" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="neu-btn flex-1 text-[13px] font-display"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neu-btn-primary flex-1 text-[13px] font-display inline-flex items-center justify-center gap-2"
            >
              {saving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</>) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProfileField({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 font-caps text-[10px] text-slate-500 mb-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}
