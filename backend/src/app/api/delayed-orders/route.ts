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

    const { importBatch, orders } = body
    let created = 0
    let updated = 0

    for (const o of orders) {
      const existing = await prisma.delayedOrder.findUnique({
        where: { orderNumber: o.orderNumber },
      })

      if (existing) {
        // Update metadata from Excel but don't change status if already PACKED/SHIPPED
        await prisma.delayedOrder.update({
          where: { orderNumber: o.orderNumber },
          data: {
            orderStatus:   o.orderStatus,
            buyerName:     o.buyerName,
            trackingNumber: o.trackingNumber || existing.trackingNumber,
            shipByDate:    o.shipByDate ? new Date(o.shipByDate) : existing.shipByDate,
            orderDate:     o.orderDate  ? new Date(o.orderDate)  : existing.orderDate,
            importBatch,
          },
        })
        updated++
      } else {
        await prisma.delayedOrder.create({
          data: {
            orderNumber:   o.orderNumber,
            platform:      o.platform,
            orderStatus:   o.orderStatus,
            buyerName:     o.buyerName,
            trackingNumber: o.trackingNumber,
            shipByDate:    o.shipByDate ? new Date(o.shipByDate) : null,
            orderDate:     o.orderDate  ? new Date(o.orderDate)  : null,
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
        created++
      }
    }

    return successResponse({ created, updated, total: orders.length })
  } catch (e) {
    console.error(e)
    return errorResponse('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 500)
  }
}
