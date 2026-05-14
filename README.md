<p align="center">
  <img src="public/logo.svg" alt="bangr." width="360" />
</p>

<p align="center">
  <b>Can you place the banger?</b><br/>
  A browser-based music timeline game — listen to a 30s clip and place it in the right year.
</p>

<p align="center">
  <a href="https://maniatisni.github.io/bangr/">🎵 Play now</a> &nbsp;·&nbsp;
  <img src="https://github.com/maniatisni/bangr/actions/workflows/deploy.yml/badge.svg" alt="deploy status" />
</p>

---

## How to play

1. **Login with Spotify** — no Premium needed
2. **Pick a universe** — choose a song deck (Netherlands, France, Nordics, …)
3. **Listen** — a 30-second mystery clip plays
4. **Place it** — tap the year ruler to guess when the song was released
5. **Build your timeline** — correct guesses stay, wrong ones are discarded
6. **Goal** — place 10 songs correctly to win

## Stack

- **React + Vite** — static site, no backend
- **Spotify Web API** — PKCE OAuth + 30s track previews
- **GitHub Pages** — hosted via GitHub Actions on every push
- **Song data** — [andygruber/songseeker-hitster-playlists](https://github.com/andygruber/songseeker-hitster-playlists)

## Run locally

```bash
npm install
npm run dev
# → http://127.0.0.1:5173
```

> Requires a Spotify Developer app with `http://127.0.0.1:5173` as a redirect URI.
