/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'] },
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
}
module.exports = nextConfig
