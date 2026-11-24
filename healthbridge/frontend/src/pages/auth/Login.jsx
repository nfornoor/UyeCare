import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.name?.split(' ')[0] || ''}`)
      const dest =
        data.user.role === 'admin'  ? '/admin'  :
        data.user.role === 'doctor' ? '/doctor' : '/patient'
      navigate(dest)
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid email or password')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function update(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    if (error) setError('')
  }

  return (
    <div className="relative min-h-screen bg-[#F1F0EC] bg-grid text-[#111827] font-sans antialiased theme-warm">
      {/* Subtle gradient mesh in the landing palette */}
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

      {/* Centered form */}
      <div className="relative flex items-center justify-center px-6 py-16 min-h-[calc(100vh-3.5rem)]">
        <div className="w-full max-w-[400px]">
          {/* Brand + heading */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-7" aria-label="UyeCare home">
              <div className="w-9 h-9 rounded-[10px] bg-[#F97316] flex items-center justify-center shadow-[0_10px_28px_-10px_rgba(249,115,22,0.55)]">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[17px] tracking-tight">UyeCare</span>
            </Link>
            <h1 className="text-[30px] font-bold tracking-tight leading-[1.15]">
              Welcome back.
            </h1>
            <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
              Sign in to continue your screening.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="premium-label">Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                autoFocus
                disabled={loading}
                className={`premium-input ${error ? 'is-error' : ''}`}
                value={form.email}
                onChange={e => update('email', e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="premium-label !mb-0">Password</label>
                <Link
                  to="#"
                  className="text-[13px] font-medium text-[#F97316] hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 rounded"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  disabled={loading}
                  className={`premium-input pr-11 ${error ? 'is-error' : ''}`}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#DC2626]/8 text-[#991B1B] text-[13px]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="premium-btn-warm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider + signup link */}
          <p className="text-center text-[14px] text-gray-500 mt-8">
            New to UyeCare?{' '}
            <Link
              to="/register"
              className="text-[#F97316] hover:text-[#EA580C] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/30 rounded"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
