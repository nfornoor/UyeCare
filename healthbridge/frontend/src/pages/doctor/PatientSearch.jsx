import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import RiskBadge from '../../components/common/RiskBadge'
import { Search, User, Phone, Droplets, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function PatientSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)

    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setSearched(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await doctorAPI.searchPatients(q)
        setResults(data)
        setSearched(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Search Patients</h1>
        <p className="text-slate-500 mt-1">Find a patient by name, ID (PAT-001), or email</p>
      </div>

      {/* Search box */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Type a name, patient ID, or email…"
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-400 text-slate-800 bg-white shadow-sm"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
        )}
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No patients found for <span className="font-medium text-slate-600">"{query}"</span></p>
        </div>
      )}

      <div className="space-y-3">
        {results.map(p => (
          <Link
            key={p.patient_id}
            to={`/doctor/patients/${p.patient_id}`}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:shadow-md hover:border-primary-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {p.name?.[0]?.toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  {p.display_id && (
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {p.display_id}
                    </span>
                  )}
                  <RiskBadge level={p.risk_level} />
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{p.email}</p>

                {/* Extra info */}
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  {p.blood_group && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Droplets className="w-3 h-3 text-red-400" /> {p.blood_group}
                    </span>
                  )}
                  {p.phone && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </span>
                  )}
                  {p.sex && (
                    <span className="text-xs text-slate-500">{p.sex === 'M' ? 'Male' : 'Female'}</span>
                  )}
                  {p.date_of_birth && (
                    <span className="text-xs text-slate-500">
                      DOB: {p.date_of_birth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6 shrink-0 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{p.total_reports} report{p.total_reports !== 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-400">
                  {p.last_test ? `Last: ${format(new Date(p.last_test), 'MMM d, yyyy')}` : 'No tests yet'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
