import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin1234', 12)
  const staffPassword = await bcrypt.hash('staff1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tns.co.th' },
    update: {},
    create: {
      email: 'admin@tns.co.th',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@tns.co.th' },
    update: {},
    create: {
      email: 'staff@tns.co.th',
      password: staffPassword,
      name: 'Staff User',
      role: 'STAFF',
    },
  })

  await prisma.photoQueue.createMany({
    data: [
      { productName: 'กระเป๋าหนังแท้ สีน้ำตาล', sku: 'BAG-001', category: 'กระเป๋า', quantity: 5, status: 'PENDING', createdBy: admin.id },
      { productName: 'รองเท้าแตะยาง รุ่น Summer', sku: 'SHOE-001', category: 'รองเท้า', quantity: 3, status: 'IN_PROGRESS', createdBy: staff.id },
      { productName: 'หมวกแก็ปปักลาย TNS', sku: 'HAT-001', category: 'หมวก', quantity: 10, status: 'PENDING', createdBy: admin.id },
    ],
  })

  await prisma.listingQueue.createMany({
    data: [
      { productName: 'กระเป๋าหนังแท้ สีน้ำตาล', sku: 'BAG-001', platform: 'SHOPEE', quantity: 5, status: 'PENDING', assignedTo: staff.name, createdBy: admin.id },
      { productName: 'รองเท้าแตะยาง รุ่น Summer', sku: 'SHOE-001', platform: 'LAZADA', quantity: 3, status: 'IN_PROGRESS', assignedTo: staff.name, createdBy: staff.id },
    ],
  })

  await prisma.dailyLog.createMany({
    data: [
      { workTitle: 'ถ่ายรูปสินค้าชุดใหม่', workDetail: 'ถ่ายรูปสินค้า 10 ชิ้น background ขาว', workCategory: 'ถ่ายรูป', priority: 'HIGH', status: 'TODO', assignedUser: staff.name, createdBy: admin.id },
      { workTitle: 'ลงขายสินค้าบน Shopee', workDetail: 'ลงขายสินค้า 5 รายการ พร้อมกรอก description', workCategory: 'ลงขาย', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedUser: staff.name, createdBy: staff.id },
    ],
  })

  console.log('Seed completed!')
  console.log('Admin: admin@tns.co.th / admin1234')
  console.log('Staff: staff@tns.co.th / staff1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })