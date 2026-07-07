const { getSql, ensureSchema, readBody, sendJson, allowMethods } = require('../lib/neon');

function normalizeItem(item = {}) {
  return {
    id: String(item.id || '').trim(),
    name: String(item.name || '').trim(),
    price: Number(item.price || 0),
    category: item.category || '',
    label: item.label || '',
    image: item.image || '',
    description: item.description || '',
    available: item.available !== false
  };
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'PUT'])) return;

  try {
    await ensureSchema();
    const sql = await getSql();

    if (req.method === 'GET') {
      const items = await sql`
        SELECT id, name, price, category, label, image, description, available
        FROM menu_items
        ORDER BY created_at ASC, name ASC
      `;
      sendJson(res, 200, { items });
      return;
    }

    const body = await readBody(req);
    const items = Array.isArray(body.items) ? body.items.map(normalizeItem).filter((item) => item.id && item.name) : [];

    await sql`DELETE FROM menu_items`;
    for (const item of items) {
      await sql`
        INSERT INTO menu_items (id, name, price, category, label, image, description, available, updated_at)
        VALUES (${item.id}, ${item.name}, ${item.price}, ${item.category}, ${item.label}, ${item.image}, ${item.description}, ${item.available}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          category = EXCLUDED.category,
          label = EXCLUDED.label,
          image = EXCLUDED.image,
          description = EXCLUDED.description,
          available = EXCLUDED.available,
          updated_at = NOW()
      `;
    }

    const rows = await sql`
      SELECT id, name, price, category, label, image, description, available
      FROM menu_items
      ORDER BY created_at ASC, name ASC
    `;
    sendJson(res, 200, { ok: true, items: rows });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
};
