import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      refreshUser: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const user = await res.json()
            set({ user })
          } else if (res.status === 401) {
            set({ user: null, token: null })
          }
        } catch {
          // network error — keep existing state
        }
      },

      logout: () => set({ user: null, token: null }),
    }),
    { name: 'uyecare-auth' }
  )
)
