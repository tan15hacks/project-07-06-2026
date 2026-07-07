let cachedSql;
let schemaReady = false;

async function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL. Add your Neon connection string to .env.local and Vercel Environment Variables.');
  }

  if (!cachedSql) {
    const { neon } = await import('@neondatabase/serverless');
    cachedSql = neon(process.env.DATABASE_URL);
  }

  return cachedSql;
}

async function ensureSchema() {
  if (schemaReady) return;
  const sql = await getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
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
    )
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_reference TEXT NOT NULL REFERENCES orders(reference) ON DELETE CASCADE,
      menu_item_id TEXT,
      name TEXT NOT NULL,
      price NUMERIC DEFAULT 0,
      quantity INTEGER DEFAULT 1
    )
  `;

  schemaReady = true;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (error) {
      return {};
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        resolve({});
      }
    });
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function allowMethods(req, res, methods) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return false;
  }

  if (!methods.includes(req.method)) {
    sendJson(res, 405, { error: `Method ${req.method} not allowed` });
    return false;
  }

  return true;
}

function normalizeOrder(order = {}) {
  return {
    reference: String(order.reference || '').trim(),
    createdAt: order.createdAt || new Date().toISOString(),
    status: order.status || 'pending',
    customer: order.customer || '',
    contact: order.contact || '',
    type: order.type || '',
    time: order.time || order.preferred_time || '',
    payment: order.payment || '',
    notes: order.notes || '',
    total: Number(order.total || 0),
    items: Array.isArray(order.items) ? order.items : []
  };
}

module.exports = {
  getSql,
  ensureSchema,
  readBody,
  sendJson,
  allowMethods,
  normalizeOrder
};
