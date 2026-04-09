/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/matriz-riesgos',
  assetPrefix: '/matriz-riesgos',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/matriz-riesgos',
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig