import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/delayed-orders?status=PENDING&batch=2026-06-10
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const batch  = searchParams.get('batch')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (batch)  where.importBatch = batch

  const orders = await prisma.delayedOrder.findMany({
    where,
    include: { items: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ shipByDate: 'asc' }, { createdAt: 'desc' }],
  })

  const counts = await prisma.delayedOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  return successResponse({ orders, counts })
}

// POST /api/delayed-orders  – bulk upsert from Excel import
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body: {
      importBatch: string
      shop: string
      orders: Array<{
        orderNumber: string
        platform: string
        orderStatus: string
        buyerName?: string
        trackingNumber?: string
        shipByDate?: string
        orderDate?: string
        items: Array<{
          productName: string
          sku?: string
          variantName?: string
          quantity: number
        }>
      }>
    } = await req.json()

    const { importBatch, shop, orders } = body
    const orderNumbers = orders.map(o => o.orderNumber)

    // 1 query to find all existing orders at once
    const existing = await prisma.delayedOrder.findMany({
      where: { orderNumber: { in: orderNumbers } },
      select: { orderNumber: true, trackingNumber: true, shipByDate: true, orderDate: true },
    })
    const existingMap = new Map(existing.map(e => [e.orderNumber, e]))

    const toCreate = orders.filter(o => !existingMap.has(o.orderNumber))
    const toUpdate = orders.filter(o =>  existingMap.has(o.orderNumber))

    // Batch create new orders with items (parallel)
    const createOps = toCreate.map(o =>
      prisma.delayedOrder.create({
        data: {
          orderNumber:    o.orderNumber,
          platform:       o.platform,
          shop:           shop || '',
          orderStatus:    o.orderStatus,
          buyerName:      o.buyerName,
          trackingNumber: o.trackingNumber,
          shipByDate:     o.shipByDate ? new Date(o.shipByDate) : null,
          orderDate:      o.orderDate  ? new Date(o.orderDate)  : null,
          importBatch,
          status: 'PENDING',
          items: {
            create: o.items.map(item => ({
              productName: item.productName,
              sku:         item.sku,
              variantName: item.variantName,
              quantity:    item.quantity,
            })),
          },
        },
      })
    )

    // Batch update existing (parallel)
    const updateOps = toUpdate.map(o => {
      const prev = existingMap.get(o.orderNumber)!
      return prisma.delayedOrder.update({
        where: { orderNumber: o.orderNumber },
        data: {
          shop:           shop || '',
          orderStatus:    o.orderStatus,
          buyerName:      o.buyerName,
          trackingNumber: o.trackingNumber || prev.trackingNumber,
          shipByDate:     o.shipByDate ? new Date(o.shipByDate) : prev.shipByDate,
          orderDate:      o.orderDate  ? new Date(o.orderDate)  : prev.orderDate,
          importBatch,
        },
      })
    })

    // Run all in parallel inside a transaction
    await prisma.$transaction([...createOps, ...updateOps])

    return successResponse({ created: toCreate.length, updated: toUpdate.length, total: orders.length })
  } catch (e) {
    console.error(e)
    return errorResponse('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 500)
  }
}
