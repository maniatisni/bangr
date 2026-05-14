// Game.jsx — SideRuler layout (design handoff variation B)
//
// Left column: vertical year ruler. Tap to select a year → snaps to nearest gap.
// Right column: mystery card + play button + waveform + drop readout + place button.
// After placing: full-screen result splash, then next card.

import { useState, useEffect, useRef, useCallback } from 'react'
import { getPreviewUrl } from '../spotify.js'
import { fetchPlaylist, shuffle } from '../playlists.js'

const YEAR_MIN   = 1950
const YEAR_MAX   = 2025
const WIN_SCORE  = 10
const SKIP_LIMIT = 5
const DECADES    = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
const WAVE_BARS  = 22

// ── Year / ruler math ─────────────────────────────────────────────────────────

const yearToPct = y => ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100
const pctToYear = p => Math.round(YEAR_MIN + (p / 100) * (YEAR_MAX - YEAR_MIN))

// Given a year and a sorted list of placed cards, return the gap index where that year falls
function gapIndexForYear(year, placed) {
  for (let i = 0; i < placed.length; i++) {
    if (year < placed[i].year) return i
  }
  return placed.length
}

// Returns [lowerYear, upperYear] bounds of the gap
function gapBounds(gapIndex, placed) {
  const lo = placed[gapIndex - 1]?.year ?? YEAR_MIN
  const hi = placed[gapIndex]?.year ?? YEAR_MAX
  return [lo, hi]
}

// ── Wave bars ─────────────────────────────────────────────────────────────────

function Wave({ playing }) {
  const heights = Array.from({ length: WAVE_BARS }, (_, i) =>
    6 + Math.abs(Math.sin(i * 0.9)) * 22
  )
  return (
    <div className={`wave ${playing ? 'playing' : ''}`} style={{ flex: 1 }}>
      {heights.map((h, i) => (
        <span key={i} style={{ height: h, transformOrigin: 'bottom' }} />
      ))}
    </div>
  )
}

// ── Result screens ────────────────────────────────────────────────────────────

function ResultCorrect({ card, round, score, streak, onNext }) {
  return (
    <div
      className="splash-correct col fade-up"
      style={{ minHeight: '100dvh', padding: '1.5rem' }}
    >
      <div className="row between center">
        <div className="chip accent">+1 point</div>
        <div className="chip">round {round}/20</div>
      </div>

      <div className="col center grow" style={{ gap: 14, marginTop: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 64, color: 'var(--ink)', textAlign: 'center', lineHeight: 1 }}>
          correct!
        </div>
        <div className="muted" style={{ fontFamily: 'var(--font-display)', fontSize: 20, textAlign: 'center' }}>
          nailed it{streak > 1 ? ` · streak ×${streak}` : ''}
        </div>

        {/* Revealed card */}
        <div className="sbox thick rot-l" style={{ width: 220, padding: 16, marginTop: 8 }}>
          <div className="mono muted">artist</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{card.artist}</div>
          <div className="squiggle" style={{ margin: '8px 0' }} />
          <div className="mono muted">title</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{card.title}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 78, color: 'var(--accent)', textAlign: 'center',
            marginTop: 8, lineHeight: 1,
            WebkitTextStroke: '1.5px var(--border)',
          }}>
            {card.year}
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginTop: 'auto' }}>
        <button className="sbtn ghost grow" style={{ color: 'var(--ink)', borderColor: 'var(--border)' }}>
          ♥ save
        </button>
        <button className="sbtn primary grow" onClick={onNext}>
          next card →
        </button>
      </div>
    </div>
  )
}

function ResultWrong({ card, placed, round, onNext }) {
  const sorted = [...placed].sort((a, b) => a.year - b.year)
  const correctIdx = sorted.findIndex(c => c.title === card.title && c.artist === card.artist)

  // Find the two neighbours in the correct position (sorted without the current card)
  const rest = sorted.filter(c => !(c.title === card.title && c.artist === card.artist))
  const correctGap = gapIndexForYear(card.year, rest)
  const before = rest[correctGap - 1]
  const after  = rest[correctGap]

  return (
    <div
      className="splash-wrong col fade-up"
      style={{ minHeight: '100dvh', padding: '1.5rem' }}
    >
      <div className="row between center">
        <div className="chip" style={{ background: 'var(--warn)', color: 'var(--ink)', borderColor: 'var(--warn)' }}>
          wrong
        </div>
        <div className="chip">round {round}/20</div>
      </div>

      <div className="col center grow" style={{ gap: 8, marginTop: 16 }}>
        <div className="muted" style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
          the song was from
        </div>
        <div className="slam" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 140, lineHeight: 1, color: 'var(--ink)' }}>
          {card.year}
        </div>

        {/* Song identity */}
        <div className="sbox" style={{ padding: '10px 14px', textAlign: 'center', marginTop: 6 }}>
          <div className="mono muted">song</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
            {card.artist} — {card.title}
          </div>
        </div>

        {/* Mini timeline correction */}
        {(before || after) && (
          <div className="row center" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {before && (
              <div className="tcard rot-l" style={{ width: 64, height: 80 }}>
                <div className="yr" style={{ fontSize: 18 }}>{before.year}</div>
                <div className="art">{before.artist}</div>
              </div>
            )}
            <div style={{ color: 'var(--accent)', fontSize: 18 }}>✓</div>
            <div className="tcard rot-r" style={{ width: 64, height: 80, borderColor: 'var(--accent)', boxShadow: '2px 2px 0 var(--accent)' }}>
              <div className="yr" style={{ fontSize: 18, color: 'var(--accent)' }}>{card.year}</div>
              <div className="art">{card.title}</div>
            </div>
            {after && (
              <>
                <div style={{ color: 'var(--muted)', fontSize: 18 }}>·</div>
                <div className="tcard rot-l" style={{ width: 64, height: 80 }}>
                  <div className="yr" style={{ fontSize: 18 }}>{after.year}</div>
                  <div className="art">{after.artist}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button className="sbtn primary block" onClick={onNext} style={{ marginTop: 'auto' }}>
        next card →
      </button>
    </div>
  )
}

function WinScreen({ score, onBack }) {
  return (
    <div className="col center fade-up" style={{ minHeight: '100dvh', gap: 16, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem' }}>🏆</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48 }}>you did it!</div>
      <div className="muted" style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
        {score} cards placed correctly
      </div>
      <button className="sbtn primary" style={{ fontSize: 18, padding: '12px 32px', marginTop: 8 }} onClick={onBack}>
        play again
      </button>
    </div>
  )
}

// ── Year Ruler ─────────────────────────────────────────────────────────────────

function YearRuler({ placed, selectedGap, onSelectGap }) {
  const rulerRef = useRef(null)

  function handleClick(e) {
    const rect = rulerRef.current.getBoundingClientRect()
    const pct = ((e.clientY - rect.top) / rect.height) * 100
    const year = pctToYear(Math.max(0, Math.min(100, pct)))
    const gap = gapIndexForYear(year, placed)
    onSelectGap(gap, year)
  }

  // Position of selected gap highlight on the ruler
  const [gapLo, gapHi] = selectedGap !== null
    ? gapBounds(selectedGap, placed)
    : [null, null]

  return (
    <div
      ref={rulerRef}
      className="ruler"
      onClick={handleClick}
      style={{ width: 26, height: '100%', cursor: 'crosshair', flexShrink: 0 }}
    >
      {/* Decade ticks */}
      {DECADES.map(y => (
        <div key={y} style={{ position: 'absolute', top: `${yearToPct(y)}%`, left: 0, right: 0 }}>
          <div className="tick" />
          <div className="tick-label">{y}</div>
        </div>
      ))}

      {/* Placed card dots */}
      {placed.map((c, i) => (
        <div
          key={i}
          className="ad"
          style={{ position: 'absolute', top: `${yearToPct(c.year)}%`, left: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12 }}
        />
      ))}

      {/* Selected gap highlight */}
      {selectedGap !== null && (
        <div
          className="ruler-gap"
          style={{
            top: `${yearToPct(gapLo)}%`,
            bottom: `${100 - yearToPct(gapHi)}%`,
            minHeight: 8,
          }}
        />
      )}
    </div>
  )
}

// ── Main Game component ───────────────────────────────────────────────────────

export default function Game({ token, universe, onBack }) {
  const [allCards,  setAllCards]  = useState([])
  const [deckIdx,   setDeckIdx]   = useState(0)
  const [placed,    setPlaced]    = useState([])   // sorted by year
  const [current,   setCurrent]   = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [phase,     setPhase]     = useState('init')  // init|loading|playing|result-correct|result-wrong|won
  const [selectedGap,  setSelectedGap]  = useState(null)  // gap index
  const [selectedYear, setSelectedYear] = useState(null)  // tapped year (display only)
  const [isPlaying, setIsPlaying]  = useState(false)
  const [round,     setRound]      = useState(1)
  const [score,     setScore]      = useState(0)
  const [streak,    setStreak]     = useState(0)
  const [resultCard, setResultCard] = useState(null)
  const audioRef = useRef(null)

  // Load playlist on mount
  useEffect(() => {
    fetchPlaylist(universe.File).then(cards => {
      const sh = shuffle(cards)
      setAllCards(sh)
    })
  }, [])

  // When allCards populated, load the first card
  useEffect(() => {
    if (allCards.length > 0 && phase === 'init') {
      loadCard(0, allCards)
    }
  }, [allCards])

  const loadCard = useCallback(async (startIdx, cards) => {
    setPhase('loading')
    setSelectedGap(null)
    setSelectedYear(null)
    setIsPlaying(false)
    setResultCard(null)

    // Skip cards with no Spotify preview (up to SKIP_LIMIT)
    let idx = startIdx
    let skipped = 0
    while (skipped <= SKIP_LIMIT && idx < cards.length) {
      const card = cards[idx]
      const url = await getPreviewUrl(token, card.artist, card.title)
      if (url) {
        setCurrent(card)
        setDeckIdx(idx + 1)
        setPreviewUrl(url)
        setPhase('playing')
        return
      }
      idx++
      skipped++
    }
    setPhase('no-preview')
  }, [token])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.currentTime = 0; audio.play(); setIsPlaying(true) }
  }

  function handleSelectGap(gapIdx, year) {
    setSelectedGap(gapIdx)
    setSelectedYear(year)
  }

  function confirmPlace() {
    if (selectedGap === null) return
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false) }

    const [lo, hi] = gapBounds(selectedGap, placed)
    const correct = current.year >= lo && current.year <= hi

    setResultCard(current)
    setRound(r => r + 1)

    if (correct) {
      const newPlaced = [...placed, current].sort((a, b) => a.year - b.year)
      setPlaced(newPlaced)
      const newScore = score + 1
      setScore(newScore)
      setStreak(s => s + 1)
      if (newScore >= WIN_SCORE) { setPhase('won'); return }
      setPhase('result-correct')
    } else {
      setStreak(0)
      setPhase('result-wrong')
    }
  }

  function nextCard() {
    loadCard(deckIdx, allCards)
  }

  // ── Render ──

  if (phase === 'won') return <WinScreen score={score} onBack={onBack} />

  if (phase === 'result-correct') {
    return (
      <ResultCorrect
        card={resultCard}
        round={round} score={score} streak={streak}
        onNext={nextCard}
      />
    )
  }

  if (phase === 'result-wrong') {
    return (
      <ResultWrong
        card={resultCard}
        placed={placed}
        round={round}
        onNext={nextCard}
      />
    )
  }

  const [gapLo, gapHi] = selectedGap !== null
    ? gapBounds(selectedGap, placed)
    : [null, null]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem', height: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="row between center" style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
          round {round}
        </div>
        <div className="chip accent">{score} ✓</div>
      </div>
      <div className="mono muted" style={{ marginBottom: 12 }}>
        tap the ruler to place · {universe.Game.replace(/^Hitster\s*/i, '')}
      </div>

      {/* Main layout: ruler | content */}
      <div className="row" style={{ flex: 1, gap: 10, overflow: 'hidden' }}>

        {/* Left: year ruler */}
        <YearRuler
          placed={placed}
          selectedGap={selectedGap}
          onSelectGap={handleSelectGap}
        />

        {/* Right: mystery + controls */}
        <div className="col grow" style={{ gap: 12, paddingLeft: 36, overflow: 'hidden' }}>

          {/* Mystery card */}
          <div className="mystery rot-r" style={{ height: 160 }}>
            <div className="corner tl">mystery</div>
            <div className="qmark" style={{ fontSize: phase === 'loading' ? 48 : 80 }}>
              {phase === 'loading' ? '…' : '?'}
            </div>
          </div>

          {/* Play button + waveform */}
          {phase === 'playing' && (
            <>
              <audio ref={audioRef} src={previewUrl} onEnded={() => setIsPlaying(false)} />
              <div className="row center" style={{ gap: 12 }}>
                <button
                  className={`pulse-ring ${isPlaying ? 'playing' : ''}`}
                  onClick={togglePlay}
                  style={{ width: 46, height: 46, fontSize: 18, flexShrink: 0 }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <Wave playing={isPlaying} />
              </div>
            </>
          )}

          {/* Drop readout */}
          <div
            className="sbox dashed"
            style={{
              borderColor: selectedGap !== null ? 'var(--accent)' : 'var(--border)',
              padding: '8px 12px',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
          >
            {selectedGap !== null ? (
              <>
                <div className="mono muted">drop near</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>
                  {selectedYear}
                </div>
                <div className="mono muted" style={{ marginTop: 2 }}>
                  {gapLo === YEAR_MIN ? 'before' : gapLo} – {gapHi === YEAR_MAX ? 'now' : gapHi}
                </div>
              </>
            ) : (
              <div className="mono muted" style={{ padding: '4px 0' }}>tap the ruler to choose a year</div>
            )}
          </div>

          {/* Place button */}
          <button
            className="sbtn primary"
            onClick={confirmPlace}
            disabled={selectedGap === null || phase !== 'playing'}
            style={{
              width: '100%', padding: '12px 16px', fontSize: 18, marginTop: 'auto',
              opacity: selectedGap === null || phase !== 'playing' ? 0.35 : 1,
              cursor: selectedGap === null || phase !== 'playing' ? 'not-allowed' : 'pointer',
            }}
          >
            place →
          </button>
        </div>
      </div>

      {/* Back link */}
      <button
        onClick={onBack}
        className="mono muted"
        style={{ marginTop: 10, textAlign: 'center', fontSize: 10 }}
      >
        ← back to universes
      </button>
    </div>
  )
}
