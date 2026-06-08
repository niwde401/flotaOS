import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    return NextResponse.json({ error: json.error?.message || 'Invalid credentials' }, { status: 401 })
  }

  const { accessToken, refreshToken, user } = json.data

  const response = NextResponse.json({ success: true, user })
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
  })
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  })
  response.cookies.set('user', JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  })

  return response
}
