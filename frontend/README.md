# Frontend

Vue 3 web app na nagpapakita ng opportunity cost ng government contracts — kung magkano bilhin ng bigas, silid-aralan, o librong pang-eskwela sa halip na ang pondo.

## Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS v4

## Setup

```bash
bun install
bun dev    # http://localhost:5173
```

## Environment Variables

```env
# .env.local (for local dev)
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=your-api-key

# .env.production (already set — points to live backend)
VITE_API_URL=https://pondo-converter-yvw8.vercel.app/api
```

## Pages

| Route | Description |
|---|---|
| `/` | Main converter — search contracts, view receipt |
| `/prices` | Live commodity price table |
| `/about` | About the tool |

## Deploy

Import the `frontend/` folder to Vercel. It auto-detects Vite. No extra config needed — `vercel.json` handles SPA routing.
