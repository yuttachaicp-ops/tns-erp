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

  // cancelDeadline = orderDate + 4 days
  // "วันสุดท้าย" = orderDate was exactly 4 days ago (cancelDeadline = today)
  const fourDaysAgo = new Date(today); fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
  const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  // "เกินกำหนด" = orderDate < 4 days ago (cancelDeadline already passed)
  const lastDayStatuses = { in: ['PENDING', 'PACKED', 'READY_TO_SHIP'] }

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
    prisma.delayedOrder.count({ where: { status: { in: ['PENDING', 'PACKED', 'READY_TO_SHIP'] } } }),
    // เกินกำหนด: cancelDeadline ผ่านไปแล้ว = orderDate < fourDaysAgo
    prisma.delayedOrder.count({ where: { status: lastDayStatuses, orderDate: { lt: fourDaysAgo } } }),
    // วันสุดท้าย: cancelDeadline = วันนี้ = orderDate เมื่อ 4 วันที่แล้ว
    prisma.delayedOrder.count({ where: { status: lastDayStatuses, orderDate: { gte: fourDaysAgo, lt: threeDaysAgo } } }),
  ])

  // Dashboard table: เฉพาะ "วันสุดท้าย!" = cancelDeadline วันนี้ (orderDate = 4 วันที่แล้ว)
  const urgentOrders = await prisma.delayedOrder.findMany({
    where: {
      status: lastDayStatuses,
      orderDate: { gte: fourDaysAgo, lt: threeDaysAgo },
    },
    include: { items: { select: { productName: true, quantity: true, isOutOfStock: true }, take: 3 } },
    orderBy: [{ orderDate: 'asc' }],
    take: 50,
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
