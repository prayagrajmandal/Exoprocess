# TMS Split Flow Structure 

This project is now separated into two apps:

- `frontend/` - Next.js UI application
- `backend/` - FastAPI Python API application

Run both from the root:

- `npm run dev`

Or run them separately:

- `npm run dev:frontend`
- `npm run dev:backend`

The frontend proxies `/api/*` requests to the backend with `BACKEND_URL`.

Use `http://127.0.0.1:8001` for local development unless you have changed the backend port.
