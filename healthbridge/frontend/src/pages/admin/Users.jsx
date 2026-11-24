import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { Search, Trash2, ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  patient: 'bg-blue-100   text-blue-700',
  doctor:  'bg-green-100  text-green-700',
  admin:   'bg-purple-100 text-purple-700',
}
const STATUS_BADGE = {
  active:           'bg-green-100  text-green-700',
  pending_approval: 'bg-amber-100  text-amber-700',
  rejected:         'bg-red-100    text-red-700',
}

const ROLES = ['patient', 'doctor', 'admin']

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [pending, setPending]   = useState([])
  const [tab, setTab]           = useState('all')          // 'all' | 'pending'
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState('all')
  const [changing, setChanging] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [usersRes, pendingRes] = await Promise.all([
        adminAPI.users(),
        adminAPI.pendingDoctors(),
      ])
      setUsers(usersRes.data)
      setPending(pendingRes.data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRoleChange(id, newRole) {
    setChanging(id)
    try {
      await adminAPI.updateRole(id, newRole)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    } finally {
      setChanging(null)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete user "${name}" and all their reports?`)) return
    try {
      await adminAPI.deleteUser(id)
      setUsers(prev  => prev.filter(u => u.id !== id))
      setPending(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    }
  }

  async function handleApprove(id) {
    try {
      await adminAPI.approveDoctor(id)
      setPending(prev => prev.filter(u => u.id !== id))
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u))
      toast.success('Doctor approved')
    } catch {
      toast.error('Failed to approve')
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Reject this doctor application?')) return
    try {
      await adminAPI.rejectDoctor(id)
      setPending(prev => prev.filter(u => u.id !== id))
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u))
      toast.success('Application rejected')
    } catch {
      toast.error('Failed to reject')
    }
  }

  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_id || '').toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} total users</p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" /> {pending.length} pending approval
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all',     label: 'All Users' },
          { key: 'pending', label: `Pending Doctors${pending.length ? ` (${pending.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pending Doctors tab ── */}
      {tab === 'pending' && (
        <div className="card overflow-hidden p-0">
          {pending.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No pending doctor applications.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Specialty</th>
                    <th className="px-4 py-3">License No.</th>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pending.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {u.display_id || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">Dr. {u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.specialty || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.license_no || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.hospital || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleReject(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── All Users tab ── */}
      {tab === 'all' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-9" placeholder="Search by name, email, or ID…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={roleFilter} onChange={e => setRole(e.target.value)}>
              <option value="all">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Reports</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users found.</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {u.display_id || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {u.role === 'doctor' ? `Dr. ${u.name}` : u.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select value={u.role} disabled={changing === u.id}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none ${ROLE_BADGE[u.role]}`}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[u.status] || ''}`}>
                          {u.status === 'pending_approval' ? 'pending' : u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{u.report_count}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
