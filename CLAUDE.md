# CLAUDE.md

Guidance for AI assistants (Claude Code) working in this repository.

## Overview

This repository (`meu-precificador`) hosts **two independent applications** that
share a Git repo but are otherwise unrelated. The codebase and UI are in
**Brazilian Portuguese (pt-BR)** — keep all user-facing strings, variable names,
comments, and commit messages consistent with the existing pt-BR style.

| App | Location | Stack | Purpose |
|-----|----------|-------|---------|
| **Precificador Show de Delicias** | `index.html`, `cardapio.html` | Single-file HTML + vanilla JS, Firebase, Gemini | Pricing calculator + digital menu for a food/marmita (lunchbox) business |
| **Professor IA** | `professor-ia/` | Flask + SQLite + Docker | Self-hosted math tutor (separate product, separate deploy) |

> There is **no build system, package manager, or test suite** for the main app.
> `index.html` and `cardapio.html` are static files edited directly and served as-is.

---

## App 1 — Precificador Show de Delicias (`index.html`)

A ~5,600-line single-page application contained entirely in `index.html`. All
HTML, CSS, and JavaScript live in this one file. `cardapio.html` is the
companion public-facing digital menu (~940 lines).

### Tech stack (all via CDN — no local dependencies)
- **Tailwind CSS v2.2.19** for styling. ⚠️ This is Tailwind **v2**, not v3+.
  Classes like `emerald-*` do **not** exist in v2 (a real bug fixed in commit
  `77fca06`). Verify a utility class exists in v2 before using it.
- **Firebase v11.6.1** (ES modules from `gstatic.com`): Auth + Firestore.
- **Chart.js v4.4.7** for dashboard charts.
- **Litepicker** for date ranges.

### Firebase
Config is hard-coded near the top of the main `<script type="module">` block
(around `index.html:1404`). Project: `meu-precificador-show`.

- **Auth**: Google sign-in (popup) + email/password (with password reset).
  Firebase error codes are translated to pt-BR via `traduzirErroFirebase()`.
- **Firestore data model** — all per-user, namespaced under an `appId`
  (`'precificador-show-de-delicias'`):
  ```
  artifacts/{appId}/users/{userId}/{collection}
  ```
  Helpers: `getCollectionRef(name)` and `getConfigDocRef()`.
  Collections / docs:
  | Collection | Notes |
  |------------|-------|
  | `insumos` | Raw ingredients (with unit conversion + FC/loss factor) |
  | `produtos` | Products/recipes built from insumos + embalagens |
  | `embalagens` | Packaging items |
  | `pedidos` | Orders coming from the digital menu |
  | `configuracoes/main` | App config (revenue, operational costs, sales channels, Gemini key/model) |

  Data flows reactively via `onSnapshot` listeners set up in
  `initializeAppState()`. In-memory caches (`insumosCache`, `produtosCache`,
  `embalagensCache`, `configCache`) mirror Firestore and are exposed through
  `window.appState`. **Re-render functions are called from snapshot callbacks** —
  update the cache via Firestore writes and let listeners trigger re-renders;
  don't mutate caches directly.

### Tabs (UI sections)
Navigation is via `changeTab(tabName)` (`index.html:2040`), which toggles
`{tabName}-tab` element visibility. Tabs: `simulador`, `montador`, `produtos`,
`insumos`, `embalagens`, `analise`, `relatorios`, `configuracoes`, `cardapio`,
`pedidos`, `dashboard`. Each tab has lazy-render hooks inside `changeTab`.

Key concepts:
- **Simulador**: price simulation per sales channel (iFood plans, etc.),
  including iFood promotion break-even calculations.
- **Montador**: "marmita builder" — compose a lunchbox from component categories
  and price it.
- **FC (Fator de Correção / correction factor)**: loss factor applied to insumos
  so raw-purchase cost reflects usable yield. Packaging (`embalagem`) is treated
  as **pass-through cost (repasse)** and is **excluded from the margin
  calculation** (commit `f0f234d`) — preserve this rule.
- **Relatórios iFood**: CSV upload + parsing (`parseCSV`) to analyze iFood
  reports.
- **Dashboard**: summary cards, profitability tables, charts.

### Gemini AI integration (client-side)
The market-analysis feature calls the **Gemini API directly from the browser**.
- API key comes from the config input / `configCache` / `localStorage`
  (`geminiApiKey`) — see `getGeminiApiKey()` (`index.html:1909`).
- `callGeminiAPI(prompt)` — basic generateContent call.
- `callGeminiWithSearch(prompt, systemInstruction)` — uses **Search Grounding**
  for live market analysis.
- Model is user-selectable: `gemini-2.5-flash`, `gemini-2.5-pro`,
  `gemini-3.1-pro-preview`.

### Backup
Manual JSON export/import of all collections (buttons in the header) lets users
back up and restore their data outside Firestore.

### `cardapio.html` (digital menu)
Public-facing menu, also backed by the same Firebase project's Firestore. Reads
store config / products and writes `pedidos` (orders). Supports a **preview
mode** that reads from `localStorage` key `cardapio_preview` (set by the main
app) and remembers customer details in `cliente_cardapio`.

---

## App 2 — Professor IA (`professor-ia/`)

A **completely separate**, self-hosted Flask application — a Socratic math tutor
for kids. It analyzes photographed questions with Gemini Vision and renders a
step-by-step "lousa" (chalkboard) explanation. See `professor-ia/SETUP.md` for
full deploy docs.

### Structure
```
professor-ia/
├── app.py               # Flask backend: auth, Gemini calls, lousa generator, history
├── gunicorn.conf.py     # Production server config (initializes DB on_starting)
├── requirements.txt     # flask, Pillow, gunicorn, requests
├── Dockerfile           # python:3.12-slim + dejavu fonts
├── docker-compose.yml   # One-command deploy (port 5000, persistent volume)
├── .env.example         # SECRET_KEY, GEMINI_API_KEY, PORT
├── templates/index.html # Full frontend (chat, lousa, login)
└── static/
```

### Key facts
- **Storage**: SQLite (`DB_PATH`, default `professor_ia.db`; `/app/data/...` in
  Docker). Tables: `usuarios`, `conversas`, `mensagens`. WAL mode enabled.
- **Auth**: own login/register. Passwords hashed with SHA-256 + per-password
  salt (`hash_senha` / `verificar_senha`). Sessions persist 30 days.
  ⚠️ Note: `requirements` mentions bcrypt in a docstring but the code uses
  SHA-256+salt — match the actual implementation when editing.
- **Gemini**: server-side `chamar_gemini()` → `gemini-2.0-flash` Vision endpoint.
  Returns structured JSON (saudacao, passos_lousa, resposta_final, etc.).
  Key from per-user `gemini_key` or `GEMINI_API_KEY` env.
- **Lousa generator**: `/api/lousa` draws a PNG chalkboard with Pillow.
- API routes are documented in `professor-ia/SETUP.md` (`/api/cadastro`,
  `/api/login`, `/api/perguntar`, `/api/conversas`, `/api/lousa`,
  `/api/health`, …).

### Running Professor IA
```bash
cd professor-ia
pip install -r requirements.txt
python app.py            # dev, http://localhost:5000

# or production:
docker-compose up -d --build
```
Env vars: `SECRET_KEY` (required), `GEMINI_API_KEY` (optional global key),
`PORT`, `FLASK_DEBUG`, `DB_PATH`.

---

## Development workflow

- **Git flow**: feature branches (e.g. `claude/<topic>`) → Pull Request →
  squash/merge into `main`. The repo history is almost entirely merged PRs.
- **No CI, no tests, no linter** are configured. Verify changes by opening the
  HTML file in a browser (main app) or running the Flask app (Professor IA).
- **No build step** for the main app — editing `index.html` / `cardapio.html`
  is the deploy artifact. **Deployment is via Vercel** (static hosting), which
  auto-deploys pushes/PRs and reports status back on the PR. Note the Firebase
  *project* (`meu-precificador-show`) provides Auth + Firestore for the app, but
  is not where the static files are hosted.
- When asked to push, push to the designated feature branch with
  `git push -u origin <branch>` and open a **draft PR** if none exists.

### Conventions to follow
- **Language**: pt-BR for everything (identifiers, UI text, comments, commits).
- **Commit messages**: follow the existing `tipo: descrição` style
  (`feat:`, `fix:`, …) in Portuguese, e.g.
  `fix: embalagem não deve entrar no cálculo da margem - apenas repasse`.
- **Main app edits**: keep everything inline in the single HTML file — don't
  introduce a bundler, npm, or external JS files unless explicitly requested.
- **Tailwind v2 only** — confirm utility classes exist in v2.
- **Firestore writes** go through the `window.appState` helpers; let
  `onSnapshot` listeners drive re-renders rather than calling render functions
  manually after a write.
- Treat the two apps as separate; a change to one almost never affects the other.

## Security note
Firebase web config and the `appId` are intentionally client-side (normal for
Firebase web apps; security relies on Firestore rules + Auth). The **Gemini API
key is user-supplied and stored in the browser** — never hard-code a Gemini key
into the repo, and don't add the model identifier or any secret to commits.
