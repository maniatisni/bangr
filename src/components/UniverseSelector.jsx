import { useState, useEffect } from 'react'
import { fetchUniverses } from '../playlists.js'

const FLAG_MAP = {
  ca: '🇨🇦', de: '🇩🇪', fr: '🇫🇷', hu: '🇭🇺',
  nl: '🇳🇱', pl: '🇵🇱', nordics: '🇸🇪',
}

function flagFor(filename) {
  const m = filename.match(/bangr-([a-z]+)/)
  return FLAG_MAP[m?.[1]] ?? '🎵'
}

// Shorten the game name for display — strip "bangr " prefix
function shortName(gameName) {
  return gameName.replace(/^bangr\s*/i, '')
}

export default function UniverseSelector({ onSelect }) {
  const [universes, setUniverses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUniverses()
      .then(data => { setUniverses(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="col center" style={{ minHeight: '100dvh' }}>
        <div className="mono muted">loading universes…</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.25rem', minHeight: '100dvh' }}>

      {/* Header */}
      <div className="row between center" style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>
          pick a universe
        </div>
        <div className="chip">⚙</div>
      </div>

      <div className="mono muted" style={{ marginBottom: 14 }}>
        {universes.length} decks · more soon
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {universes.map((u, i) => {
          const featured = i === 0
          return (
            <button
              key={u.File}
              onClick={() => onSelect(u)}
              className={`sbox ${featured ? 'thick accent' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '10px 10px', textAlign: 'left',
                cursor: 'pointer', color: 'var(--ink)',
                transition: 'opacity 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.opacity = '0.75'}
              onMouseUp={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div className="flag">{flagFor(u.File)}</div>

              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>
                {shortName(u.Game)}
              </div>

              <div className="row between center" style={{ marginTop: 'auto' }}>
                <span className="mono muted">bangr</span>
                <span className={`tag ${featured ? 'accent' : ''}`}>
                  {featured ? 'play →' : 'go'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
