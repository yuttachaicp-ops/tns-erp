import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Auto-reconnect: ถ้า connection หลุด ให้ reconnect อัตโนมัติ
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(() => {
    // connection จะ retry เองตอน query ครั้งแรก
  })
}
