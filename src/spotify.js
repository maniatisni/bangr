// Spotify PKCE OAuth + API helpers
//
// PKCE (Proof Key for Code Exchange) is a browser-safe OAuth flow.
// Instead of a secret key (which would be visible in browser JS), we generate
// a random "verifier" locally, hash it into a "challenge", send the challenge
// to Spotify, then later prove we have the original verifier to get a token.
// Spotify never sees the verifier — only the hash — so it can't be faked.

const CLIENT_ID = '5ba0418a0db6444f9cd8b1d265a3bd26';

// import.meta.env.DEV is true when running `npm run dev`, false after `npm run build`
const REDIRECT_URI = import.meta.env.DEV
  ? 'http://127.0.0.1:5173'
  : 'https://maniatisni.github.io/bangr/';

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(digest);
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

// Step 1: Redirect the user to Spotify's login page
export async function startSpotifyLogin() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier so we can use it when Spotify redirects back
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'user-read-private', // minimal scope — just enough to authenticate
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Step 2: Spotify sends us back with ?code=... — exchange it for an access token
export async function handleCallback(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) throw new Error('Spotify token exchange failed');

  const data = await response.json();

  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }

  sessionStorage.removeItem('pkce_verifier');
  return data.access_token;
}

// Returns stored token if valid, null if missing or expired
export function getStoredToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expires = localStorage.getItem('spotify_token_expires');
  if (!token || !expires) return null;
  if (Date.now() > parseInt(expires)) return null;
  return token;
}

export function logout() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_token_expires');
  localStorage.removeItem('spotify_refresh_token');
}

// ── Spotify API ───────────────────────────────────────────────────────────────

// Search Spotify for a song and return its 30-second preview URL.
// Returns null if no preview is available for any match.
export async function getPreviewUrl(token, artist, title) {
  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const tracks = data.tracks?.items ?? [];

  // Take the first track that has a preview
  const match = tracks.find(t => t.preview_url);
  return match?.preview_url ?? null;
}
