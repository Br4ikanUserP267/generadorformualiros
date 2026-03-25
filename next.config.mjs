/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/matriz-riesgos',
    assetPrefix: '/matriz-riesgos/',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
