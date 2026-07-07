# BLK.8 CAFÉ Neon Postgres Setup

This project now supports Neon Postgres through Vercel API functions.

## 1. Create a Neon project

1. Go to Neon Console.
2. Create a new project.
3. Click **Connect**.
4. Copy the connection string that starts with `postgresql://`.

## 2. Add your environment variable locally

Create a file named `.env.local` in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOSTNAME/DBNAME?sslmode=require"
```

Do not commit `.env.local`. It is already ignored by `.gitignore`.

## 3. Install dependencies

```powershell
npm install
```

## 4. Run with Vercel dev

Do not use `python -m http.server` when testing Neon, because Python cannot run `/api/*` routes.

Use:

```powershell
npx vercel dev
```

Then open:

```text
http://localhost:3000/menu.html
http://localhost:3000/blk8-admin.html
```

## 5. Test the connection

Open this in the browser:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{ "ok": true }
```

The API auto-creates these tables on first request:

- `categories`
- `menu_items`
- `orders`
- `order_items`

You can also paste `db/schema.sql` into the Neon SQL Editor manually.

## 6. Add DATABASE_URL to Vercel

In Vercel:

1. Open the project.
2. Go to **Settings** > **Environment Variables**.
3. Add `DATABASE_URL` with your Neon connection string.
4. Redeploy.

## Notes

- If `/api/health` fails, the website falls back to browser-only localStorage.
- The customer menu and admin panel now load `neon-bridge.js`, which syncs localStorage data with the API.
- For production security, the next step is adding real admin authentication and protecting the write API endpoints.
