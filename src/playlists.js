// Fetches song lists (CSVs) from the andygruber/songseeker-bangr-playlists repo.
// We read the files directly from GitHub at runtime — no database needed.

import Papa from 'papaparse';

const RAW =
  'https://raw.githubusercontent.com/andygruber/songseeker-bangr-playlists/main/';

async function fetchCSV(filename) {
  const res = await fetch(RAW + filename);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}`);
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

// Returns the list of available universes: [{ File, Game }, ...]
export async function fetchUniverses() {
  return fetchCSV('playlists.csv');
}

// Loads a universe's songs: [{ artist, title, year }, ...]
export async function fetchPlaylist(filename) {
  const rows = await fetchCSV(filename);
  return rows
    .map(row => ({
      artist: row['Artist']?.trim(),
      title: row['Title']?.trim(),
      year: parseInt(row['Year']),
    }))
    .filter(card => card.artist && card.title && !isNaN(card.year));
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
