const { getSql, ensureSchema, sendJson, allowMethods } = require('../lib/neon');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    await ensureSchema();
    const sql = await getSql();
    const rows = await sql`SELECT NOW() AS now`;
    sendJson(res, 200, { ok: true, now: rows[0]?.now || null });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
};
