import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

// ป้องกัน Next.js cache — ต้องการข้อมูลสดจาก DB ทุก request
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const activeStatuses = { in: ['PENDING', 'PACKED', 'READY_TO_SHIP'] }

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
    prisma.delayedOrder.count({ where: { status: activeStatuses } }),
  ])

  // ส่ง active orders ทั้งหมดไปให้ browser filter — เพื่อให้ใช้ timezone ของ client (Bangkok) ตรงกับหน้า delayed-orders
  const urgentOrders = await prisma.delayedOrder.findMany({
    where: { status: activeStatuses },
    select: {
      id: true, orderNumber: true, platform: true, shop: true,
      orderStatus: true, orderDate: true, status: true,
      buyerName: true, trackingNumber: true,
      items: { select: { productName: true, quantity: true, isOutOfStock: true }, take: 3 },
    },
    orderBy: [{ orderDate: 'asc' }],
  })

  // Placeholder counts — dashboard page will recalculate from urgentOrders using browser timezone
  const delayedOrdersOverdue = 0
  const delayedOrdersUrgent  = 0

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
