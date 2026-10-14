# 🎬 SceneHouse

A web shop for digital movies — rent a movie for 48 hours or buy it to keep.
Movie data comes live from [The Movie Database (TMDB)](https://www.themoviedb.org).

**Live:** https://scenehouse-ochre.vercel.app

## Features

- **Catalog** — popular movies in a responsive grid, with "Load more"
- **Search, genre filter and sorting** — stored in the URL, so Back and shared links keep them
- **Movie detail page** — backdrop, poster, age rating, runtime, genres, cast and director
- **Rent (48 h) or buy** — prices in SEK, based on the movie's age and rating
- **Cart** — navbar badge, slide-in drawer and a cart page; remove items or clear the cart
- **Every data view handles loading, error (with "Try again"), empty and success**
- **Keyboard accessible** — the cart drawer works with Tab, Enter and Esc
- **Dark and light theme** — follows the operating system setting

## Tech stack

| | |
|---|---|
| UI | React 19 + TypeScript (strict mode) |
| Build | Vite |
| Routing | React Router (`react-router`) |
| State | Redux Toolkit — for the cart only |
| Styling | CSS Modules + CSS custom properties (design tokens) |
| Data | TMDB API |
| Quality | ESLint · GitHub Actions CI (lint + build on every push and PR) |
| Hosting | Vercel — deploys `main`, preview link for every pull request |

## Getting started

### 1. Requirements

- [Node.js](https://nodejs.org) 24 (the version CI uses) and npm
- A free TMDB account for an API key

### 2. Get a TMDB API key

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Key** (the short key — not the long "API Read Access Token").

### 3. Clone and install

```bash
git clone https://github.com/PatrikNoordh/scenehouse.git
cd scenehouse
npm install
```

### 4. Add your key

Copy the example file and paste your key after `VITE_TMDB_KEY=`:

```bash
cp .env.example .env
```

```env
VITE_TMDB_KEY=your_tmdb_api_key
```

Only `VITE_TMDB_KEY` is needed right now. The other variables in `.env.example`
can stay empty.

`.env` is gitignored, so the key never reaches GitHub. Note that every variable
starting with `VITE_` is built into the JavaScript that runs in the browser, so
it is visible to anyone using the site. That is acceptable for TMDB's free,
read-only key — never put a secret key in a `VITE_` variable.

### 5. Run it

```bash
npm run dev
```

Open http://localhost:5173. Restart `npm run dev` after changing `.env` —
Vite only reads it at startup.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type check, then build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── main.tsx          # entry — Redux Provider, router, global styles
├── App.tsx           # route table
├── config.ts         # language, currency and region settings
├── routes.ts         # route paths — paths.movie(id)
├── types/            # TypeScript types for the app's data
├── api/              # TMDB client — fetch, normalize, in-memory cache
├── hooks/            # data hooks — loading / error / data
├── app/              # Redux store + typed hooks
├── features/cart/    # cart slice — reducers, actions, selectors
├── utils/            # pure functions — pricing, age rating, URL filters
├── pages/            # one folder per route
├── components/       # shared presentational components
└── styles/           # design tokens + global styles
```

Data flows one way: **page → hook → API layer → TMDB**. Components never fetch;
they get data as props and report user actions through callbacks. TMDB's raw
response shape is only known inside `src/api/tmdb.ts`.

## Conventions

- **Branches:** `type/SH-NNN-short-description` — e.g. `feat/SH-005-catalog-grid`
- **Commits:** `type [SH-NNN] Present tense description` — e.g. `feat [SH-005] Add movie grid`
- **Types:** `feat` · `fix` · `style` · `refactor` · `test` · `chore` · `docs`
- One ticket = one branch = one pull request into `main`. CI must be green before merging.

## Known limitations

- **No checkout or payment** — the cart is the end of the flow.
- **The cart is not saved yet** — it empties on page reload.
- **Prices are made up** — TMDB has no prices; they are calculated in `src/utils/pricing.ts`.
- **English only** — prices are shown in SEK.
- **The TMDB key is visible in the browser** — see "Add your key" above.

## Attribution

<img src="public/tmdb-logo.svg" alt="The Movie Database (TMDB)" width="160">

This product uses the TMDB API but is not endorsed or certified by TMDB.
Movie data and images are provided by [The Movie Database (TMDB)](https://www.themoviedb.org).