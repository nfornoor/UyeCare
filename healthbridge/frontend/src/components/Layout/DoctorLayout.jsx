import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, Search, LogOut, Heart, Menu, X } from 'lucide-react'
import ProfileMenu from '../common/ProfileMenu'

const NAV = [
  { to: '/doctor',        icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/doctor/search', icon: Search,          label: 'Search Patients', end: false },
]

function navItemClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
    isActive
      ? 'neu-inset text-[#006666] font-semibold'
      : 'text-[#1E2938]/70 hover:text-[#1E2938] hover:bg-black/[0.025]',
  ].join(' ')
}

export default function DoctorLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, location.search])

  return (
    <div className="flex h-screen overflow-hidden neu-surface font-display">
      {/* Mobile top bar */}
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
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#1E2938] leading-tight truncate">UyeCare</p>
            <p className="font-caps text-[8px] text-slate-500 leading-tight">Doctor Portal</p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 shrink-0 flex flex-col neu-surface
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div aria-hidden className="hidden lg:block absolute right-0 top-4 bottom-4 w-px bg-black/[0.06]" />

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-black/[0.04] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <div className="neu-icon-tile-accent w-9 h-9">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[15px] text-[#1E2938] leading-tight">UyeCare</p>
              <p className="font-caps text-[9px] text-slate-500 mt-0.5">Doctor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navItemClass}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <div className="neu-card-sm p-3 flex items-center gap-3 mb-2">
            <div className="neu-icon-tile w-9 h-9 text-[#006666] font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1E2938] truncate">Dr. {user?.name}</p>
              {user?.display_id && (
                <p className="font-caps text-[9px] text-[#006666] mt-0.5">{user.display_id}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#FF2157] hover:bg-[#FF2157]/8 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {/* Desktop top bar — avatar */}
        <div className="hidden lg:flex sticky top-0 z-20 h-14 px-6 items-center justify-end gap-3 neu-surface border-b border-black/[0.04]">
          <ProfileMenu />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
