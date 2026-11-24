import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,   // 2 min for ML inference
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/**
 * Safely extract a human-readable message from an Axios error.
 * FastAPI returns 422 validation errors as an array of objects under `detail`;
 * naive string interpolation crashes React when rendered.
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.filter((p) => p !== 'body').pop() : ''
        const msg   = d?.msg || d?.message
        if (!msg) return null
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
    if (parts.length) return parts.join(' · ')
  }
  return err?.message || fallback
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
  updateMe: (data)  => api.patch('/auth/me', data),
}

// ── Analysis ─────────────────────────────────────────────────────────────────
export const analyzeAPI = {
  xray:     (file)    => { const fd = new FormData(); fd.append('file', file); return api.post('/analyze/xray', fd) },
  ecg:      (file, recordingStartTime) => {
    const fd = new FormData()
    fd.append('file', file)
    if (recordingStartTime) fd.append('recording_start_time', recordingStartTime)
    return api.post('/analyze/ecg', fd)
  },
  ct:       (file)    => { const fd = new FormData(); fd.append('file', file); return api.post('/analyze/ct', fd) },
  skin:     (file)    => { const fd = new FormData(); fd.append('file', file); return api.post('/analyze/skin', fd) },
  symptoms: (answers) => api.post('/analyze/symptoms', answers),
}

// ── History ──────────────────────────────────────────────────────────────────
export const historyAPI = {
  list:   ()         => api.get('/history'),
  get:    (id)       => api.get(`/history/${id}`),
  delete: (id)       => api.delete(`/history/${id}`),
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send:        (msg, history, context) => api.post('/chat', { message: msg, history, context }),
  messages:    ()                      => api.get('/chat/patient/messages'),
  unreadCount: ()                      => api.get('/chat/patient/unread-count'),
}

// ── Doctor ───────────────────────────────────────────────────────────────────
export const doctorAPI = {
  patients:       ()           => api.get('/doctor/patients'),
  searchPatients: (q)          => api.get(`/doctor/patients/search?q=${encodeURIComponent(q)}`),
  patient:        (id)         => api.get(`/doctor/patients/${id}`),
  stats:        ()           => api.get('/doctor/stats'),
  sendMessage:  (patient_id, content, report_id = null, report_type = null, report_prediction = null) =>
    api.post('/doctor/message', { patient_id, content, report_id, report_type, report_prediction }),
  messages:     (patient_id) => api.get(`/doctor/messages/${patient_id}`),
  report:       (id)         => api.get(`/doctor/report/${id}`),
}

// ── Health Profile ────────────────────────────────────────────────────────────
export const healthProfileAPI = {
  get:  ()       => api.get('/health-profile'),
  save: (data)   => api.put('/health-profile', data),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats:          ()              => api.get('/admin/stats'),
  users:          ()              => api.get('/admin/users'),
  updateRole:     (id, role)      => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser:     (id)            => api.delete(`/admin/users/${id}`),
  reports:        (skip=0, limit=50) => api.get(`/admin/reports?skip=${skip}&limit=${limit}`),
  pendingDoctors: ()              => api.get('/admin/doctors/pending'),
  approveDoctor:  (id)            => api.patch(`/admin/doctors/${id}/approve`),
  rejectDoctor:   (id)            => api.patch(`/admin/doctors/${id}/reject`),
}

export default api
