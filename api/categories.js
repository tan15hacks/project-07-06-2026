const { getSql, ensureSchema, readBody, sendJson, allowMethods } = require('../lib/neon');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'PUT'])) return;

  try {
    await ensureSchema();
    const sql = await getSql();

    if (req.method === 'GET') {
      const categories = await sql`
        SELECT id, name
        FROM categories
        ORDER BY created_at ASC, name ASC
      `;
      sendJson(res, 200, { categories });
      return;
    }

    const body = await readBody(req);
    const categories = Array.isArray(body.categories) ? body.categories : [];

    await sql`DELETE FROM categories`;
    for (const category of categories) {
      const id = String(category.id || '').trim();
      const name = String(category.name || '').trim();
      if (!id || !name) continue;
      await sql`
        INSERT INTO categories (id, name)
        VALUES (${id}, ${name})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `;
    }

    const rows = await sql`SELECT id, name FROM categories ORDER BY created_at ASC, name ASC`;
    sendJson(res, 200, { ok: true, categories: rows });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
};
