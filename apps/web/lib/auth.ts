import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export interface WebUser {
  id: string
  email: string
  role: string
  fullName: string
}

export interface WebSession {
  user: WebUser
  accessToken: string
}

export async function getServerSession(): Promise<WebSession | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('accessToken')?.value
  const userStr = cookieStore.get('user')?.value

  if (!token || !userStr) return null

  try {
    const user = JSON.parse(userStr) as WebUser
    return { user, accessToken: token }
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  const json = await res.json()
  return json.data as T
}
