import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/services/api'
import type { User, LoginRequest, RegisterRequest } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isDarkMode: boolean

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  initialize: () => void
  setUser: (user: User) => void
  setAuth: (user: User, token: string) => void
  toggleDarkMode: () => void
  setDarkMode: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isDarkMode: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          // Backend returns a flat token payload, not a nested `user` object.
          const { access_token, user_id, email, full_name, role } = response
          const user: User = { id: user_id, email, full_name, role }
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await authApi.register(data)
          const { access_token, user_id, email, full_name, role } = response
          const user: User = { id: user_id, email, full_name, role }
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        authApi.logout().catch(() => {
          // ignore errors on logout
        })
        set({ user: null, token: null, isAuthenticated: false })
      },

      initialize: () => {
        const { isDarkMode } = get()
        if (isDarkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      toggleDarkMode: () => {
        const newVal = !get().isDarkMode
        if (newVal) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ isDarkMode: newVal })
      },

      setDarkMode: (val) => {
        if (val) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ isDarkMode: val })
      },
    }),
    {
      name: 'rationflow-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
)
