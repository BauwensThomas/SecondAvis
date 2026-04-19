import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

// En dev, Next.js Fast Refresh (webpack) a besoin de 'unsafe-eval' pour le hot reload
// En production, on supprime 'unsafe-eval' pour respecter la securite maximale
const isDev = process.env.NODE_ENV === 'development'

// Politique de sécurité du contenu (CSP) - liste blanche des ressources autorisées
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} js.stripe.com *.sentry.io va.vercel-scripts.com pagead2.googlesyndication.com *.googlesyndication.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: *.supabase.co *.googlesyndication.com *.doubleclick.net;
  font-src 'self' data:;
  connect-src 'self' *.supabase.co wss://*.supabase.co api.stripe.com *.sentry.io *.ingest.de.sentry.io *.googlesyndication.com *.doubleclick.net ep1.adtrafficquality.google;
  frame-src js.stripe.com *.stripe.com googleads.g.doubleclick.net tpc.googlesyndication.com pagead2.googlesyndication.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

// Headers de sécurité HTTP appliqués à toutes les réponses du site
const securityHeaders = [
  {
    // Content Security Policy : restreint les sources de scripts, styles, images, connexions
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
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
    // Force HTTPS pendant 1 an
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    // Désactive les fonctionnalités navigateur non utilisées (caméra, micro, géolocalisation)
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Active la prélecture DNS pour les domaines autorisés
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "avisbox-kj",

  project: "avisbox-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

