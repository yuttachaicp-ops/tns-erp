const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'] },
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src')
    return config
  },
}
module.exports = nextConfig