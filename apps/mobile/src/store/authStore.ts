import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '../api/client'

interface AuthUser {
  id: string
  email: string
  role: string
  fullName: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user } = res.data.data
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ])
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken')
    await apiClient.post('/auth/logout', { refreshToken }).catch(() => {})
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    try {
      const [token, userStr] = await AsyncStorage.multiGet(['accessToken', 'user'])
      if (token[1] && userStr[1]) {
        set({ user: JSON.parse(userStr[1]), isAuthenticated: true })
      }
    } catch {
      // storage unreadable — treat as logged out
    } finally {
      set({ isLoading: false })
    }
  },
}))
