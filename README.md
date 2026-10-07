# React frontend

## Local development

From this directory:

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:5173`. By default, it proxies `/api` requests to the Act 5 backend at `http://localhost/villamor-riesbelle-lavalust-main`. If LavaLust is available at a different local origin or path, set `VITE_DEV_API_ORIGIN` (origin only) and `VITE_DEV_API_PREFIX` (path prefix) in `.env.local`. For example, for a Laragon virtual host use `VITE_DEV_API_ORIGIN=http://villamor-riesbelle-lavalust-main.test` and `VITE_DEV_API_PREFIX=`.

Copy `.env.example` to `.env.local` if you need to change the default backend location. Leave `VITE_API_BASE_URL` empty for local development through the Vite proxy.

## Production

For the separate `villamor-riesbelle-crud` Render Static Site:

- Repository: `https://github.com/riesbelle12/villamor-riesbelle-crud.git`
- Branch: `main`
- Root Directory: leave blank
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://villamor-riesbelle-lavalust-back.onrender.com`

If the repository contains this app in a `react-frontend` subdirectory, set that as Render's Root Directory. Add a Render rewrite from `/*` to `/index.html` with status `200` if the site needs client-side routes.

The frontend uses the LavaLust JSON API for sign-in, token refresh, sign-out, and product `GET`, `POST`, `PUT`, and `DELETE` calls. Set `VITE_API_BASE_URL` to the deployed API base URL for production. Configure `FRONTEND_ORIGINS` in LavaLust with the exact frontend origin and keep the API signing secrets private in the backend environment. Never put database credentials or signing secrets in frontend environment variables; Vite variables are public in the built assets.

The root `Dockerfile` also builds this app at `/react/` in the combined application image. It sets `VITE_BASE_PATH=/react/` for that deployment; standalone Render deployments use `/` by default.