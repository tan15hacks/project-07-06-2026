-- BLK.8 CAFÉ Neon Postgres schema
-- The Vercel API auto-creates these tables on first request.
-- You can also paste this into the Neon SQL Editor manually.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  label TEXT,
  image TEXT,
  description TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  reference TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  customer TEXT,
  contact TEXT,
  type TEXT,
  preferred_time TEXT,
  payment TEXT,
  notes TEXT,
  total NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_reference TEXT NOT NULL REFERENCES orders(reference) ON DELETE CASCADE,
  menu_item_id TEXT,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 1
);
