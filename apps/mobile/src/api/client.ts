import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../config'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      const newToken = res.data.data.accessToken
      await AsyncStorage.setItem('accessToken', newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
      // Notify auth store so UI can show login screen
      const { useAuthStore } = await import('../store/authStore')
      useAuthStore.getState().logout().catch(() => {})
    }
    return Promise.reject(error)
  }
)
