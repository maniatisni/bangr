import { startSpotifyLogin } from '../spotify.js'

// Vinyl record rendered purely in CSS — no image needed
function Vinyl({ size = 130, spinning = false }) {
  return (
    <div
      className="vinyl"
      style={{
        width: size, height: size,
        animation: spinning ? 'vinylSpin 4s linear infinite' : 'none',
      }}
    />
  )
}

export default function Login() {
  return (
    <div
      className="col center"
      style={{ minHeight: '100dvh', gap: 18, padding: '2rem', textAlign: 'center' }}
    >
      {/* Logotype */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 72, lineHeight: 1, letterSpacing: -2 }}>
        bangr<span style={{ color: 'var(--accent)' }}>.</span>
      </div>

      {/* Tagline */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--muted)' }}>
        can you place the hit?
      </div>

      {/* Decorative vinyl */}
      <div style={{ margin: '8px 0' }}>
        <Vinyl size={130} spinning={false} />
      </div>

      {/* CTA */}
      <button
        className="sbtn primary"
        onClick={startSpotifyLogin}
        style={{ maxWidth: 240, width: '100%', fontSize: 18, padding: '12px 24px' }}
      >
        <span className="ad" style={{ width: 8, height: 8 }} />
        login with spotify
      </button>

      {/* Fine print */}
      <div className="mono muted">v0.1 — private beta</div>
    </div>
  )
}
