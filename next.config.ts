/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: 'export', // required for GitHub Pages
  images: {
    unoptimized: true, // disable next/image optimization for static export
  },
  basePath: isProd ? '/weather-lux' : '',
  assetPrefix: isProd ? '/weather-lux/' : '',
}

module.exports = nextConfig
