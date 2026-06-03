import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const issues = await prisma.pipelineIssue.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(issues)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const issue = await prisma.pipelineIssue.create({
    data: {
      userId: user.userId,
      title: body.title,
      description: body.description || null,
      severity: body.severity || 'MEDIUM',
      status: 'OPEN',
    },
  })
  return NextResponse.json(issue)
}
