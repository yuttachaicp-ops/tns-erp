import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    photoQueueTotal,
    photoQueuePending,
    listingQueueTotal,
    listingQueuePending,
    todayLogs,
    pendingLogs,
    recentActivities,
    photoByStatus,
    listingByPlatform,
    logsByCategory,
    delayedOrdersPending,
    delayedOrdersOverdue,
    delayedOrdersUrgent,
  ] = await Promise.all([
    prisma.photoQueue.count(),
    prisma.photoQueue.count({ where: { status: 'PENDING' } }),
    prisma.listingQueue.count(),
    prisma.listingQueue.count({ where: { status: 'PENDING' } }),
    prisma.dailyLog.count({ where: { workDate: { gte: today, lt: tomorrow } } }),
    prisma.dailyLog.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    prisma.photoQueue.groupBy({ by: ['status'], _count: true }),
    prisma.listingQueue.groupBy({ by: ['platform'], _count: true }),
    prisma.dailyLog.groupBy({ by: ['workCategory'], _count: true }),
    prisma.delayedOrder.count({ where: { status: 'PENDING' } }),
    prisma.delayedOrder.count({ where: { status: 'PENDING', shipByDate: { lt: today } } }),
    prisma.delayedOrder.count({ where: { status: 'PENDING', shipByDate: { gte: today, lt: tomorrow } } }),
  ])

  // Top urgent delayed orders for dashboard table
  const urgentOrders = await prisma.delayedOrder.findMany({
    where: { status: { in: ['PENDING', 'PACKED'] } },
    include: { items: { select: { productName: true, quantity: true, isOutOfStock: true }, take: 3 } },
    orderBy: [{ shipByDate: 'asc' }],
    take: 5,
  })

  return successResponse({
    summary: {
      photoQueueTotal,
      photoQueuePending,
      listingQueueTotal,
      listingQueuePending,
      todayLogs,
      pendingLogs,
      delayedOrdersPending,
      delayedOrdersOverdue,
      delayedOrdersUrgent,
    },
    charts: {
      photoByStatus,
      listingByPlatform,
      logsByCategory,
    },
    recentActivities,
    urgentOrders,
  })
}
