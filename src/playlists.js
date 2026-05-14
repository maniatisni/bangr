// Song data is pre-built by scripts/seed.py and stored in public/songs.json.
// The game reads that file at runtime — no live API calls needed for song data.

// Load all songs from the pre-built JSON file
let _cache = null;
async function loadSongs() {
  if (_cache) return _cache;
  const res = await fetch(`${import.meta.env.BASE_URL}songs.json`);
  if (!res.ok) throw new Error('Failed to load songs.json');
  _cache = await res.json();
  return _cache;
}

// Returns unique universes present in songs.json: [{ File, Game, count }, ...]
export async function fetchUniverses() {
  const songs = await loadSongs();
  const map = {};
  for (const s of songs) {
    if (!map[s.file]) map[s.file] = { File: s.file, Game: `Hitster ${s.playlist}`, count: 0 };
    map[s.file].count++;
  }
  return Object.values(map);
}

// Returns songs for a given universe file, only those with a preview URL
export async function fetchPlaylist(filename) {
  const songs = await loadSongs();
  return songs
    .filter(s => s.file === filename && s.previewUrl)
    .map(s => ({
      artist:     s.artist,
      title:      s.title,
      year:       s.year,
      previewUrl: s.previewUrl,
    }));
}

// Fisher-Yates shuffle — produces a new array, doesn't mutate the original
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
