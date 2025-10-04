/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir as it's no longer needed in Next.js 14
  output: 'standalone',
  env: {
    // Only include environment variables that should be available on the client side
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Server-side environment variables are automatically available in API routes
}

module.exports = nextConfig
