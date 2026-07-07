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

  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${path}`);
    }
    return data;
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

  async function checkApi() {
    try {
      await request('/api/health');
      apiIsAvailable = true;
      return true;
    } catch (error) {
      apiIsAvailable = false;
      console.warn('[BLK.8 Neon] API unavailable. Staying in local browser mode.', error.message);
      return false;
    }
  }

  async function pullCategories() {
    if (!apiIsAvailable) return;
    const data = await request('/api/categories');
    if (Array.isArray(data.categories)) setLocalFromServer(KEYS.categories, data.categories);
  }

  async function pullMenu() {
    if (!apiIsAvailable) return;
    const data = await request('/api/menu-items');
    if (Array.isArray(data.items) && data.items.length) setLocalFromServer(KEYS.menu, data.items);
  }

  async function pullOrders() {
    if (!apiIsAvailable) return;
    const data = await request('/api/orders');
    if (Array.isArray(data.orders)) setLocalFromServer(KEYS.orders, data.orders);
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
    if (pullingFromNeon || !apiIsAvailable || !watchedKeys.has(key)) return;

    try {
      if (key === KEYS.categories) {
        const categories = safeParse(localStorage.getItem(KEYS.categories), []);
        await request('/api/categories', { method: 'PUT', body: JSON.stringify({ categories }) });
      }

      if (key === KEYS.menu) {
        const items = safeParse(localStorage.getItem(KEYS.menu), []);
        await request('/api/menu-items', { method: 'PUT', body: JSON.stringify({ items }) });
      }

      if (key === KEYS.orders) {
        const orders = safeParse(localStorage.getItem(KEYS.orders), []);
        await request('/api/orders', { method: 'PUT', body: JSON.stringify({ orders }) });
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
    isAvailable: () => apiIsAvailable
  };

  document.addEventListener('DOMContentLoaded', pullAll);
})();
