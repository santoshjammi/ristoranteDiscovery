/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output for production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Use a separate build directory for production to avoid cache conflicts with dev
  distDir: process.env.NODE_ENV === 'production' ? '.next-prod' : '.next',
  // Fix workspace root inference with multiple lockfiles
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
