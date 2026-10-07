/** @type {import('next').NextConfig} */
const nextConfig = {
  // Email do portal: fontes e fotos usadas para gerar a animação
  outputFileTracingIncludes: {
    '/api/contrato-cps/aprovar': ['./lib/email-assets/**/*'],
  },
  serverExternalPackages: ['@napi-rs/canvas', 'sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/newsletter', destination: '/nl/index.html' },
    ]
  },
}

module.exports = nextConfig
