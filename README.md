# Dolphin Stage

React + Vite app with MUI for UI and Three.js / React Three Fiber for 3D.

## Development

Requires Node 24 (see `.nvmrc`).

```sh
nvm use
npm install
npm run dev
```

- `npm run build` — type-check and build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — lint with oxlint

## Deployment

Pushes to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.
One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

The site is served from `/dolphin-stage/`; if the repo is renamed, update `base` in `vite.config.ts`.
