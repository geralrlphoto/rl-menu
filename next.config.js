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
  // Apresentações online às leads: link secreto, sem login, protegido por cabeçalhos
  async headers() {
    const seguranca = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    return [
      { source: '/apresentacao/:path*', headers: seguranca },
      { source: '/apresentacoes/:path*', headers: seguranca },
    ]
  },
  async rewrites() {
    return [
      { source: '/newsletter', destination: '/nl/index.html' },
      { source: '/lp/casamentos', destination: '/lp/casamentos/index.html' },
      { source: '/apresentacao/:slug', destination: '/apresentacoes/:slug/index.html' },
    ]
  },
}

module.exports = nextConfig
