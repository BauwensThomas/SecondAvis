import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Avisbox - Obtenez un avis professionnel en moins de 24h'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Génère automatiquement l'image Open Graph pour les partages sur réseaux sociaux
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
        }}
      >
        {/* Cercle décoratif en haut à gauche */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          backgroundColor: '#1e40af',
          opacity: 0.15,
          display: 'flex',
        }} />

        {/* Cercle décoratif en bas à droite */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          opacity: 0.1,
          display: 'flex',
        }} />

        {/* Nom du site */}
        <div style={{
          fontSize: '56px',
          fontWeight: 'bold',
          color: '#3b82f6',
          marginBottom: '24px',
          letterSpacing: '-1px',
          display: 'flex',
        }}>
          Avisbox
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: '32px',
          color: '#f1f5f9',
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: '900px',
          marginBottom: '48px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          Obtenez un avis professionnel vérifié en moins de 24h
        </div>

        {/* Badges */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            'Experts vérifiés',
            'Réponse en moins de 24h',
            'Remboursé si délai dépassé',
          ].map((badge) => (
            <div key={badge} style={{
              backgroundColor: '#1e3a5f',
              border: '1px solid #2563eb',
              borderRadius: '50px',
              padding: '10px 24px',
              color: '#93c5fd',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              {/* Cercle vert a la place du symbole checkmark */}
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'flex',
                flexShrink: 0,
              }} />
              {badge}
            </div>
          ))}
        </div>

        {/* URL en bas */}
        <div style={{
          position: 'absolute',
          bottom: '56px',
          left: '80px',
          color: '#475569',
          fontSize: '20px',
          display: 'flex',
        }}>
          Avisbox.be
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
