// App.jsx — decides which screen to show.
// Three screens: login → universe selector → game.
// React "state" is like a Python variable that, when changed, re-renders the UI.

import { useState, useEffect } from 'react'
import { handleCallback, getStoredToken } from './spotify.js'
import Login from './components/Login.jsx'
import UniverseSelector from './components/UniverseSelector.jsx'
import Game from './components/Game.jsx'

export default function App() {
  const [screen, setScreen] = useState('login')   // which screen is visible
  const [token, setToken] = useState(null)         // Spotify access token
  const [universe, setUniverse] = useState(null)   // selected playlist

  useEffect(() => {
    // On load, check if Spotify just redirected back with ?code=...
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Clean the code from the URL so refreshing doesn't re-trigger auth
      window.history.replaceState({}, '', window.location.pathname);

      handleCallback(code)
        .then(tok => { setToken(tok); setScreen('select'); })
        .catch(() => setScreen('login'));
      return;
    }

    // Already logged in from a previous session?
    const stored = getStoredToken();
    if (stored) { setToken(stored); setScreen('select'); }
  }, []);

  if (screen === 'login') {
    return <Login />;
  }

  if (screen === 'select') {
    return (
      <UniverseSelector
        onSelect={u => { setUniverse(u); setScreen('game'); }}
      />
    );
  }

  return (
    <Game
      token={token}
      universe={universe}
      onBack={() => setScreen('select')}
    />
  );
}
