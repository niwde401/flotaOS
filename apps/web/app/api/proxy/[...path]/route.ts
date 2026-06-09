import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const cookieStore = cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = params.path.join('/')
  const search = req.nextUrl.search

  const res = await fetch(`${API_URL}/api/${path}${search}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}
