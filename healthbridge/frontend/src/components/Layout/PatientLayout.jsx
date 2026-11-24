import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { chatAPI } from '../../services/api'
import {
  LayoutDashboard, Activity, Image, Microscope, Brain,
  History, MessageCircle, LogOut, Heart, ChevronDown,
  FlaskConical, HeartPulse, Menu, X, BellRing, Bell,
} from 'lucide-react'
import ProfileMenu from '../common/ProfileMenu'

const TEST_ITEMS = [
  { id: 'xray',     label: 'Chest X-Ray',        icon: Image,        to: '/patient/analyze?test=xray' },
  { id: 'ecg',      label: 'ECG Analysis',        icon: Activity,     to: '/patient/analyze?test=ecg' },
  { id: 'ct',       label: 'CT Scan',             icon: Microscope,   to: '/patient/analyze?test=ct' },
  { id: 'skin',     label: 'Skin Disease',        icon: Brain,        to: '/patient/analyze?test=skin' },
  { id: 'symptoms', label: 'All Disease Checkup', icon: FlaskConical, to: '/patient/symptoms' },
]

function navItemClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
    isActive
      ? 'neu-inset text-[#006666] font-semibold'
      : 'text-[#1E2938]/70 hover:text-[#1E2938] hover:bg-black/[0.025]',
  ].join(' ')
}

export default function PatientLayout() {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [unread, setUnread]           = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const onAnalyzePage = location.pathname === '/patient/analyze' || location.pathname === '/patient/symptoms'
  const [testsOpen, setTestsOpen] = useState(onAnalyzePage)

  useEffect(() => {
    if (onAnalyzePage) setTestsOpen(true)
  }, [onAnalyzePage])

  // Track previous unread count so we can detect *new* arrivals between polls
  // and trigger an in-app toast notification.
  const lastUnreadRef = useRef(null)

  useEffect(() => {
    function fetchUnread() {
      chatAPI.unreadCount()
        .then(r => {
          const newCount = r.data.count
          const prev = lastUnreadRef.current

          // First poll: just record the baseline, don't toast.
          // Subsequent polls: if count went UP, new messages arrived.
          // Skip notification if the user is already on the messages page.
          if (
            prev !== null &&
            newCount > prev &&
            location.pathname !== '/patient/chat'
          ) {
            const delta = newCount - prev
            toast(
              `${delta} new message${delta > 1 ? 's' : ''} from your doctor`,
              {
                duration: 6000,
                icon: <BellRing className="w-4 h-4 text-[#006666]" />,
                style: {
                  borderRadius: '12px',
                  background: '#E7E5E4',
                  color: '#1E2938',
                  fontFamily: 'Space Mono, ui-monospace, monospace',
                  fontSize: '13px',
                  boxShadow:
                    '-5px -5px 12px rgba(255,255,255,0.9), 5px 5px 12px rgba(166,167,169,0.5)',
                },
              }
            )
          }

          lastUnreadRef.current = newCount
          setUnread(newCount)
        })
        .catch(() => {})
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === '/patient/chat') setUnread(0)
  }, [location.pathname])

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, location.search])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden neu-surface font-display">
      {/* ── Mobile top bar (visible <lg) ───────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 neu-surface flex items-center px-4 gap-3 border-b border-black/[0.06]">
        <button
          onClick={() => setSidebarOpen(true)}
          className="neu-tile w-10 h-10 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4 text-[#1E2938]" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="neu-icon-tile-accent w-7 h-7 shrink-0">
            <Heart className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-[#1E2938] truncate">UyeCare</span>
        </div>
        {unread > 0 && (
          <Link
            to="/patient/chat"
            className="relative neu-tile w-10 h-10 flex items-center justify-center text-[#1E2938]"
            aria-label={`${unread} unread messages`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-[#FF2157] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          </Link>
        )}
      </div>

      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 shrink-0 flex flex-col neu-surface
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div aria-hidden className="hidden lg:block absolute right-0 top-4 bottom-4 w-px bg-black/[0.06]" />

        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-black/[0.04] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand */}
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <div className="neu-icon-tile-accent w-9 h-9">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[15px] text-[#1E2938] leading-tight">UyeCare</p>
              <p className="font-caps text-[9px] text-slate-500 mt-0.5">Patient Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto">
          <NavLink to="/patient" end className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>

          {/* Run Tests — collapsible */}
          <div>
            <button
              onClick={() => setTestsOpen(o => !o)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                onAnalyzePage
                  ? 'neu-inset text-[#006666] font-semibold'
                  : 'text-[#1E2938]/70 hover:text-[#1E2938] hover:bg-black/[0.025]',
              ].join(' ')}
            >
              <Image className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Run Tests</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${testsOpen ? 'rotate-180' : ''}`} />
            </button>

            {testsOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-black/[0.06] space-y-0.5">
                {TEST_ITEMS.map(({ id, label, icon: Icon, to }) => {
                  const isActive = id === 'symptoms'
                    ? location.pathname === '/patient/symptoms'
                    : location.search.includes(`test=${id}`) && onAnalyzePage
                  return (
                    <NavLink
                      key={id}
                      to={to}
                      className={[
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all',
                        isActive
                          ? 'text-[#006666] font-semibold bg-black/[0.025]'
                          : 'text-[#1E2938]/60 hover:text-[#1E2938]',
                      ].join(' ')}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>

          <NavLink to="/patient/health-assistant" className={navItemClass}>
            <HeartPulse className="w-4 h-4" /> Health Assistant
          </NavLink>

          <NavLink to="/patient/history" className={navItemClass}>
            <History className="w-4 h-4" /> History
          </NavLink>

          <NavLink to="/patient/chat" className={navItemClass}>
            <div className="relative">
              <MessageCircle className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF2157] text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className="flex-1">Messages</span>
            {unread > 0 && (
              <span className="neu-pill text-[#FF2157] !text-[9px]">{unread} new</span>
            )}
          </NavLink>
        </nav>

        {/* User block */}
        <div className="p-3">
          <div className="neu-card-sm p-3 flex items-center gap-3 mb-2">
            <div className="neu-icon-tile w-9 h-9 text-[#006666] font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1E2938] truncate">{user?.name}</p>
              {user?.display_id && (
                <p className="font-caps text-[9px] text-[#006666] mt-0.5">{user.display_id}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#FF2157] hover:bg-[#FF2157]/8 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {/* Desktop top bar — notification + avatar */}
        <div className="hidden lg:flex sticky top-0 z-20 h-14 px-6 items-center justify-end gap-3 neu-surface border-b border-black/[0.04]">
          <Link
            to="/patient/chat"
            className="relative neu-tile w-10 h-10 flex items-center justify-center text-[#1E2938]"
            aria-label={unread ? `${unread} unread messages` : 'Messages'}
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF2157] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <ProfileMenu />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
