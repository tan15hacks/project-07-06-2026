(() => {
  const KEYS = {
    categories: 'blk8-menu-categories',
    menu: 'blk8-menu-items',
    orders: 'blk8-placed-orders'
  };
  const watchedKeys = new Set(Object.values(KEYS));
  const syncTimers = new Map();
  let pullingFromNeon = false;
  let apiIsAvailable = false;
  let apiBase = '';

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value || 'null');
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function localApiCandidates() {
    const origin = window.location.origin;
    const candidates = [origin];

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      ['3000', '3001', '3002', '5173'].forEach((port) => {
        const candidate = `${window.location.protocol}//${window.location.hostname}:${port}`;
        if (!candidates.includes(candidate)) candidates.push(candidate);
      });
    }

    return candidates;
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${url}`);
    }
    return data;
  }

  async function request(path, options = {}) {
    if (!apiBase) await checkApi();
    if (!apiBase) throw new Error('No local Neon API server found. Run npx vercel dev.');
    return fetchJson(`${apiBase}${path}`, options);
  }

  function dispatchStorage(key) {
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: localStorage.getItem(key),
      storageArea: localStorage
    }));
  }

  function setLocalFromServer(key, value) {
    pullingFromNeon = true;
    originalSetItem.call(localStorage, key, JSON.stringify(value));
    pullingFromNeon = false;
    dispatchStorage(key);
  }

  function mergeOrders(localOrders, serverOrders) {
    const map = new Map();

    [...localOrders, ...serverOrders].forEach((order) => {
      if (!order?.reference) return;
      const existing = map.get(order.reference);
      if (!existing) {
        map.set(order.reference, order);
        return;
      }

      const existingTime = new Date(existing.createdAt || 0).getTime() || 0;
      const orderTime = new Date(order.createdAt || 0).getTime() || 0;
      map.set(order.reference, orderTime >= existingTime ? { ...existing, ...order } : { ...order, ...existing });
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function checkApi() {
    for (const candidate of localApiCandidates()) {
      try {
        await fetchJson(`${candidate}/api/health`);
        apiBase = candidate;
        apiIsAvailable = true;
        console.info(`[BLK.8 Neon] API connected at ${apiBase}`);
        return true;
      } catch (error) {
        // Try the next local port.
      }
    }

    apiBase = '';
    apiIsAvailable = false;
    console.warn('[BLK.8 Neon] API unavailable. Staying in local browser mode. Run npx vercel dev and check /api/health.');
    return false;
  }

  async function pullCategories() {
    if (!apiIsAvailable) return;
    const data = await request('/api/categories');
    if (Array.isArray(data.categories) && data.categories.length) setLocalFromServer(KEYS.categories, data.categories);
  }

  async function pullMenu() {
    if (!apiIsAvailable) return;
    const data = await request('/api/menu-items');
    if (Array.isArray(data.items) && data.items.length) setLocalFromServer(KEYS.menu, data.items);
  }

  async function pullOrders() {
    if (!apiIsAvailable) return;
    const data = await request('/api/orders');
    if (!Array.isArray(data.orders)) return;

    const localOrders = safeParse(localStorage.getItem(KEYS.orders), []);
    const merged = mergeOrders(Array.isArray(localOrders) ? localOrders : [], data.orders);
    setLocalFromServer(KEYS.orders, merged);

    if (merged.length) {
      await request('/api/orders', { method: 'PUT', body: JSON.stringify({ orders: merged }) });
    }
  }

  async function pullAll() {
    if (!(await checkApi())) return;
    try {
      await pullCategories();
      await pullMenu();
      await pullOrders();
      console.info('[BLK.8 Neon] Synced data from Neon.');
    } catch (error) {
      console.warn('[BLK.8 Neon] Pull failed:', error.message);
    }
  }

  async function syncKey(key) {
    if (pullingFromNeon || !watchedKeys.has(key)) return;
    if (!apiIsAvailable && !(await checkApi())) return;

    try {
      if (key === KEYS.categories) {
        const categories = safeParse(localStorage.getItem(KEYS.categories), []);
        if (Array.isArray(categories) && categories.length) {
          await request('/api/categories', { method: 'PUT', body: JSON.stringify({ categories }) });
        }
      }

      if (key === KEYS.menu) {
        const items = safeParse(localStorage.getItem(KEYS.menu), []);
        if (Array.isArray(items) && items.length) {
          await request('/api/menu-items', { method: 'PUT', body: JSON.stringify({ items }) });
        }
      }

      if (key === KEYS.orders) {
        const orders = safeParse(localStorage.getItem(KEYS.orders), []);
        if (Array.isArray(orders) && orders.length) {
          await request('/api/orders', { method: 'PUT', body: JSON.stringify({ orders }) });
        }
      }
    } catch (error) {
      console.warn('[BLK.8 Neon] Sync failed:', key, error.message);
    }
  }

  function scheduleSync(key) {
    if (pullingFromNeon || !watchedKeys.has(key)) return;
    clearTimeout(syncTimers.get(key));
    syncTimers.set(key, setTimeout(() => syncKey(key), 550));
  }

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && watchedKeys.has(key)) scheduleSync(key);
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && watchedKeys.has(key)) scheduleSync(key);
  };

  window.BLK8Neon = {
    pullAll,
    pullOrders,
    pullMenu,
    pullCategories,
    syncKey,
    checkApi,
    isAvailable: () => apiIsAvailable,
    apiBase: () => apiBase
  };

  document.addEventListener('DOMContentLoaded', pullAll);
})();
