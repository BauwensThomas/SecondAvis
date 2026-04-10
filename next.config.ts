import type { NextConfig } from "next";

// Headers de sécurité HTTP appliqués à toutes les réponses du site
const securityHeaders = [
  {
    // Bloque le chargement de la page dans une iframe (protection clickjacking)
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Empêche le navigateur de deviner le type MIME (protection MIME sniffing)
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Contrôle les informations envoyées dans le header Referer
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Force HTTPS pendant 1 an (activer uniquement en production)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    // Désactive les fonctionnalités navigateur non utilisées (caméra, micro, géolocalisation)
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Désactive la prélecture DNS pour les pages externes
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Applique les headers de sécurité à toutes les routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
