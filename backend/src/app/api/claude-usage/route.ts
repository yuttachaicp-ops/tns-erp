import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ hasKey: false, message: 'ไม่มี ANTHROPIC_API_KEY ใน environment' })
  }

  try {
    // Fetch models list to confirm API key works
    const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    })
    const models = await modelsRes.json()

    // Try usage endpoint (may or may not be available depending on plan)
    let usageData = null
    try {
      const usageRes = await fetch('https://api.anthropic.com/v1/usage', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      })
      if (usageRes.ok) usageData = await usageRes.json()
    } catch { /* usage endpoint not available */ }

    return NextResponse.json({ hasKey: true, models: models.data || [], usage: usageData })
  } catch (e) {
    return NextResponse.json({ hasKey: true, error: String(e) }, { status: 500 })
  }
}
