# Novex Digital Website

Futuristic Vite-powered static website for Novex Digital, ready to deploy on Vercel.

## CRM backend

The site now includes a Vercel serverless CRM backend and a `/crm` workspace.

- `POST /api/leads` captures website enquiries.
- `GET|POST|PATCH|DELETE /api/leads`
- `GET|POST|PATCH|DELETE /api/contacts`
- `GET|POST|PATCH|DELETE /api/deals`
- `GET|POST|PATCH|DELETE /api/tasks`
- `GET|POST|PATCH|DELETE /api/notes`
- `GET /api/dashboard`

For persistent production storage, add either Upstash Redis REST variables or Vercel KV-compatible variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Without Redis, the API uses a local temporary JSON file for development only.

Optional security variables:

- `CRM_API_TOKEN` protects CRM reads and write operations from `/crm`.
- `NOVEX_WEBHOOK_TOKEN` protects external webhook writes when enabled.

## Vercel settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Files

- `index.html` - page structure and content
- `styles.css` - responsive visual design
- `script.js` - animated background, mobile navigation, and lead submission
- `api/` - CRM serverless endpoints
- `public/crm/` - CRM workspace app
- `vercel.json` - Vercel routing, CRM rewrites, and security headers
