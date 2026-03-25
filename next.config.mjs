/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH || '/matriz-riesgo',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
