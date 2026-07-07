const { getSql, ensureSchema, readBody, sendJson, allowMethods, normalizeOrder } = require('../lib/neon');

async function fetchOrders(sql) {
  const orders = await sql`
    SELECT reference, created_at, status, customer, contact, type, preferred_time, payment, notes, total
    FROM orders
    ORDER BY created_at DESC
  `;

  const items = await sql`
    SELECT order_reference, menu_item_id, name, price, quantity
    FROM order_items
    ORDER BY id ASC
  `;

  const itemMap = new Map();
  for (const item of items) {
    const list = itemMap.get(item.order_reference) || [];
    list.push({
      id: item.menu_item_id || item.name,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0)
    });
    itemMap.set(item.order_reference, list);
  }

  return orders.map((order) => ({
    reference: order.reference,
    createdAt: order.created_at,
    status: order.status || 'pending',
    customer: order.customer || '',
    contact: order.contact || '',
    type: order.type || '',
    time: order.preferred_time || '',
    payment: order.payment || '',
    notes: order.notes || '',
    total: Number(order.total || 0),
    items: itemMap.get(order.reference) || []
  }));
}

async function upsertOrder(sql, rawOrder) {
  const order = normalizeOrder(rawOrder);
  if (!order.reference) return;

  await sql`
    INSERT INTO orders (reference, created_at, status, customer, contact, type, preferred_time, payment, notes, total)
    VALUES (${order.reference}, ${order.createdAt}, ${order.status}, ${order.customer}, ${order.contact}, ${order.type}, ${order.time}, ${order.payment}, ${order.notes}, ${order.total})
    ON CONFLICT (reference) DO UPDATE SET
      created_at = EXCLUDED.created_at,
      status = EXCLUDED.status,
      customer = EXCLUDED.customer,
      contact = EXCLUDED.contact,
      type = EXCLUDED.type,
      preferred_time = EXCLUDED.preferred_time,
      payment = EXCLUDED.payment,
      notes = EXCLUDED.notes,
      total = EXCLUDED.total
  `;

  await sql`DELETE FROM order_items WHERE order_reference = ${order.reference}`;
  for (const item of order.items) {
    await sql`
      INSERT INTO order_items (order_reference, menu_item_id, name, price, quantity)
      VALUES (${order.reference}, ${item.id || item.name || ''}, ${item.name || 'Item'}, ${Number(item.price || 0)}, ${Number(item.quantity || 1)})
    `;
  }
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST', 'PUT'])) return;

  try {
    await ensureSchema();
    const sql = await getSql();

    if (req.method === 'GET') {
      sendJson(res, 200, { orders: await fetchOrders(sql) });
      return;
    }

    const body = await readBody(req);

    if (req.method === 'POST') {
      await upsertOrder(sql, body.order || body);
      sendJson(res, 200, { ok: true, orders: await fetchOrders(sql) });
      return;
    }

    const orders = Array.isArray(body.orders) ? body.orders : [];
    await sql`DELETE FROM order_items`;
    await sql`DELETE FROM orders`;
    for (const order of orders) {
      await upsertOrder(sql, order);
    }

    sendJson(res, 200, { ok: true, orders: await fetchOrders(sql) });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
};
