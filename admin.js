(() => {
  const DEFAULT_PASSCODE = 'blk8admin2026';
  const SESSION_KEY = 'blk8-admin-session';
  const PASSCODE_KEY = 'blk8-admin-passcode';
  const ORDERS_KEY = 'blk8-placed-orders';
  const MENU_KEY = 'blk8-menu-items';
  const CATEGORIES_KEY = 'blk8-menu-categories';
  const SEEN_ORDER_KEY = 'blk8-last-seen-order';
  const NOTIFIED_ORDER_KEY = 'blk8-last-notified-order';
  const FALLBACK_IMAGE = 'assets/photo-iced-coffee.webp';

  const DEFAULT_CATEGORIES = [
    { id: 'drinks', name: 'Drinks' },
    { id: 'food', name: 'Food' },
    { id: 'snacks', name: 'Snacks' }
  ];

  const DEFAULT_MENU_ITEMS = [
    { id: 'matcha-latte', name: 'Matcha Latte', price: 120, category: 'drinks', label: 'Drink', image: 'assets/photo-matcha-latte.webp', description: 'Creamy matcha with a smooth café finish.', available: true },
    { id: 'hot-coffee-latte', name: 'Hot Coffee Latte', price: 95, category: 'drinks', label: 'Coffee', image: 'assets/photo-hot-latte.webp', description: 'Warm coffee, soft foam, and cozy table energy.', available: true },
    { id: 'iced-coffee', name: 'Iced Coffee', price: 110, category: 'drinks', label: 'Iced', image: 'assets/photo-iced-coffee.webp', description: 'Cold, creamy, and made for warm Albay afternoons.', available: true },
    { id: 'burger-fries', name: 'Burger & Fries', price: 159, category: 'food', label: 'Food', image: 'assets/photo-burger-fries.webp', description: 'A filling café meal for barkada visits.', available: true },
    { id: 'rice-meal', name: 'Rice Meal', price: 149, category: 'food', label: 'Meal', image: 'assets/photo-rice-meal.webp', description: 'Comfort food for lunch, dinner, and cravings.', available: true },
    { id: 'pasta-snacks', name: 'Pasta & Snacks', price: 139, category: 'snacks', label: 'Snack', image: 'assets/photo-pasta.webp', description: 'Pair with coffee when one drink is not enough.', available: true }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const loginView = $('[data-admin-login]');
  const dashboard = $('[data-admin-dashboard]');
  const loginForm = $('[data-login-form]');
  const loginStatus = $('[data-login-status]');
  const logoutButton = $('[data-logout]');
  const tabButtons = $$('[data-admin-tab]');
  const panels = $$('[data-panel]');
  const adminTitle = $('[data-admin-title]');
  const ordersList = $('[data-orders-list]');
  const clearOrders = $('[data-clear-orders]');
  const refreshOrders = $('[data-refresh-orders]');
  const menuForm = $('[data-menu-form]');
  const menuFormTitle = $('[data-menu-form-title]');
  const menuStatus = $('[data-menu-status]');
  const menuList = $('[data-menu-list]');
  const resetMenuForm = $('[data-reset-menu-form]');
  const resetMenu = $('[data-reset-menu]');
  const categorySelect = $('[data-category-select]');
  const categoryModal = $('[data-category-modal]');
  const openCategoryModal = $('[data-open-category-modal]');
  const closeCategoryButtons = $$('[data-close-category-modal]');
  const categoryForm = $('[data-category-form]');
  const categoryStatus = $('[data-category-status]');
  const imagePreview = $('[data-image-preview]');
  const enableNotifications = $('[data-enable-notifications]');
  const markOrdersSeen = $('[data-mark-orders-seen]');
  const notificationStatus = $('[data-notification-status]');
  const newOrderCount = $('[data-new-order-count]');
  const orderBadge = $('[data-order-badge]');
  const passcodeForm = $('[data-passcode-form]');
  const passcodeStatus = $('[data-passcode-status]');

  const statRefs = {
    todaySales: $('[data-today-sales]'),
    totalSales: $('[data-total-sales]'),
    totalOrders: $('[data-total-orders]'),
    pendingOrders: $('[data-pending-orders]'),
    ordersTotalPanel: $('[data-orders-total-panel]'),
    ordersPendingPanel: $('[data-orders-pending-panel]'),
    ordersCompletePanel: $('[data-orders-complete-panel]'),
    topItems: $('[data-top-items]'),
    salesByDay: $('[data-sales-by-day]')
  };

  function peso(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH');
  }

  function safeGet(key, fallback = '') {
    try { return localStorage.getItem(key) || fallback; } catch (error) { return fallback; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) { console.error(error); return false; }
  }

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (error) {
      localStorage.removeItem(key);
      return fallback;
    }
  }

  function slugify(text) {
    return String(text || 'item').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
  }

  function titleCase(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getPasscode() {
    return safeGet(PASSCODE_KEY, DEFAULT_PASSCODE);
  }

  function getOrders() {
    const orders = readJSON(ORDERS_KEY, []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveOrders(orders) {
    safeSet(ORDERS_KEY, JSON.stringify(orders));
  }

  function getMenuItems(syncCategories = true) {
    let items = readJSON(MENU_KEY, []);
    if (!Array.isArray(items) || !items.length) items = [...DEFAULT_MENU_ITEMS];
    items = items.map((item) => ({ ...item, image: item.image || FALLBACK_IMAGE, available: true }));
    safeSet(MENU_KEY, JSON.stringify(items));
    if (syncCategories) getCategories();
    return items;
  }

  function saveMenuItems(items) {
    safeSet(MENU_KEY, JSON.stringify(items.map((item) => ({ ...item, available: true }))));
  }

  function getCategories() {
    let categories = readJSON(CATEGORIES_KEY, []);
    if (!Array.isArray(categories) || !categories.length) categories = [...DEFAULT_CATEGORIES];

    getMenuItems(false).forEach((item) => {
      if (item.category && !categories.some((category) => category.id === item.category)) {
        categories.push({ id: item.category, name: titleCase(item.category.replace(/-/g, ' ')) });
      }
    });

    safeSet(CATEGORIES_KEY, JSON.stringify(categories));
    return categories;
  }

  function saveCategories(categories) {
    safeSet(CATEGORIES_KEY, JSON.stringify(categories));
  }

  function getCategoryName(categoryId) {
    const category = getCategories().find((item) => item.id === categoryId);
    return category?.name || titleCase(String(categoryId || 'Uncategorized').replace(/-/g, ' '));
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function updateImagePreview(src) {
    if (!imagePreview) return;
    if (!src) {
      imagePreview.textContent = 'No image uploaded yet. A default image will be used.';
      return;
    }
    imagePreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Menu item preview';
    const text = document.createElement('span');
    text.textContent = src.startsWith('data:') ? 'Uploaded image ready.' : src;
    imagePreview.append(img, text);
  }

  function renderCategoryOptions(selectedValue) {
    if (!categorySelect) return;
    const categories = getCategories();
    categorySelect.replaceChildren();
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    if (selectedValue && categories.some((category) => category.id === selectedValue)) {
      categorySelect.value = selectedValue;
    }
  }

  function latestOrderReference() {
    return getOrders()[0]?.reference || '';
  }

  function primeNotificationBaseline() {
    const latest = latestOrderReference();
    if (latest && !safeGet(NOTIFIED_ORDER_KEY, '')) safeSet(NOTIFIED_ORDER_KEY, latest);
  }

  function showDashboard() {
    if (loginView) { loginView.hidden = true; loginView.style.display = 'none'; }
    if (dashboard) { dashboard.hidden = false; dashboard.removeAttribute('hidden'); dashboard.style.display = 'grid'; }
    document.body.classList.add('admin-is-open');
    primeNotificationBaseline();
    setPanel('dashboard');
    refreshAll();
  }

  function showLogin() {
    if (loginView) { loginView.hidden = false; loginView.removeAttribute('hidden'); loginView.style.display = 'grid'; }
    if (dashboard) { dashboard.hidden = true; dashboard.setAttribute('hidden', ''); dashboard.style.display = 'none'; }
    document.body.classList.remove('admin-is-open');
  }

  function setPanel(name) {
    tabButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.adminTab === name));
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === name));
    if (adminTitle) adminTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
    refreshAll();
  }

  function getOrderDate(order) {
    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function calculateAnalytics() {
    const orders = getOrders();
    const todayKey = new Date().toISOString().slice(0, 10);
    const countedOrders = orders.filter((order) => ['pending', 'ready', 'complete'].includes(order.status || 'pending'));
    const todayOrders = countedOrders.filter((order) => getOrderDate(order).toISOString().slice(0, 10) === todayKey);
    const completed = orders.filter((order) => order.status === 'complete');
    const pending = orders.filter((order) => !order.status || order.status === 'pending');
    const totalSales = countedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const itemMap = new Map();
    countedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const current = itemMap.get(item.name) || { name: item.name, quantity: 0, sales: 0 };
        current.quantity += Number(item.quantity || 0);
        current.sales += Number(item.quantity || 0) * Number(item.price || 0);
        itemMap.set(item.name, current);
      });
    });

    const dayMap = new Map();
    countedOrders.forEach((order) => {
      const key = getOrderDate(order).toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) || 0) + Number(order.total || 0));
    });

    return {
      orders,
      pending,
      completed,
      totalSales,
      todaySales,
      topItems: Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      salesByDay: Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-7)
    };
  }

  function renderStats() {
    const data = calculateAnalytics();
    if (statRefs.todaySales) statRefs.todaySales.textContent = peso(data.todaySales);
    if (statRefs.totalSales) statRefs.totalSales.textContent = peso(data.totalSales);
    if (statRefs.totalOrders) statRefs.totalOrders.textContent = String(data.orders.length);
    if (statRefs.pendingOrders) statRefs.pendingOrders.textContent = String(data.pending.length);
    if (statRefs.ordersTotalPanel) statRefs.ordersTotalPanel.textContent = String(data.orders.length);
    if (statRefs.ordersPendingPanel) statRefs.ordersPendingPanel.textContent = String(data.pending.length);
    if (statRefs.ordersCompletePanel) statRefs.ordersCompletePanel.textContent = String(data.completed.length);
    renderTopItems(statRefs.topItems, data.topItems);
    renderSalesByDay(statRefs.salesByDay, data.salesByDay);
    renderNotifications(data.orders);
  }

  function renderTopItems(target, rows) {
    if (!target) return;
    target.replaceChildren();
    if (!rows.length) {
      target.innerHTML = '<div class="empty-state">No data yet.</div>';
      return;
    }
    const max = Math.max(...rows.map((row) => row.quantity || 1));
    rows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'analytics-row';
      item.innerHTML = `<div class="analytics-row__top"><strong>${row.name}</strong><span>${row.quantity} sold • ${peso(row.sales)}</span></div><div class="bar"><span style="width:${Math.max(8, (row.quantity / max) * 100)}%"></span></div>`;
      target.appendChild(item);
    });
  }

  function renderSalesByDay(target, rows) {
    if (!target) return;
    target.replaceChildren();
    if (!rows.length) {
      target.innerHTML = '<div class="empty-state">No sales yet.</div>';
      return;
    }
    const max = Math.max(...rows.map(([, value]) => value || 1));
    rows.forEach(([date, value]) => {
      const row = document.createElement('div');
      row.className = 'analytics-row';
      row.innerHTML = `<div class="analytics-row__top"><strong>${date}</strong><span>${peso(value)}</span></div><div class="bar"><span style="width:${Math.max(8, (value / max) * 100)}%"></span></div>`;
      target.appendChild(row);
    });
  }

  function renderNotifications(orders) {
    const latestReference = orders[0]?.reference || '';
    const seenReference = safeGet(SEEN_ORDER_KEY, '');
    const unseen = latestReference && latestReference !== seenReference ? 1 : 0;
    if (newOrderCount) newOrderCount.textContent = String(unseen);
    if (orderBadge) orderBadge.textContent = String(unseen);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  function checkNewOrderNotification() {
    const latest = getOrders()[0];
    if (!latest?.reference) return;
    const seenReference = safeGet(SEEN_ORDER_KEY, '');
    const notifiedReference = safeGet(NOTIFIED_ORDER_KEY, '');
    if (latest.reference === seenReference || latest.reference === notifiedReference) return;

    safeSet(NOTIFIED_ORDER_KEY, latest.reference);
    showToast('New order: ' + latest.reference);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New BLK.8 order', { body: `${latest.reference} • ${peso(latest.total)}` });
    }
  }

  function renderOrders() {
    const orders = getOrders();
    if (!ordersList) return;
    ordersList.replaceChildren();

    if (!orders.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No orders yet. Place a test order from menu.html on this same browser.';
      ordersList.appendChild(empty);
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      const status = order.status || 'pending';

      const itemList = (order.items || []).map((item) => `<li>${item.quantity}x ${item.name} — ${peso(item.quantity * item.price)}</li>`).join('');
      card.innerHTML = `
        <div class="order-card__top">
          <div><h3>${order.reference || 'Order'}</h3><p>${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No timestamp'}</p></div>
          <span class="badge is-${status}">${status}</span>
        </div>
        <ul>${itemList}</ul>
        <div class="order-card__meta">
          <p><strong>Total:</strong> ${peso(order.total)}</p>
          <p><strong>Customer:</strong> ${order.customer || 'Not provided'}</p>
          <p><strong>Contact:</strong> ${order.contact || 'Not provided'}</p>
          <p><strong>Type:</strong> ${order.type || 'Not provided'}</p>
          <p><strong>Time:</strong> ${order.time || 'Not specified'}</p>
          <p><strong>Payment:</strong> ${order.payment || 'Not provided'}</p>
          <p><strong>Notes:</strong> ${order.notes || 'None'}</p>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'order-card__actions';
      ['pending', 'ready', 'complete', 'cancelled'].forEach((nextStatus) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = nextStatus;
        button.addEventListener('click', () => {
          order.status = nextStatus;
          saveOrders(orders);
          refreshAll();
        });
        actions.appendChild(button);
      });
      card.appendChild(actions);
      ordersList.appendChild(card);
    });
  }

  function renderMenuManager() {
    const items = getMenuItems();
    if (!menuList) return;
    menuList.replaceChildren();

    if (!items.length) {
      menuList.innerHTML = '<div class="empty-state">No menu items yet.</div>';
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'menu-admin-item';
      row.innerHTML = `<div class="menu-admin-item__top"><div><h3>${item.name}</h3><p>${getCategoryName(item.category)} • ${peso(item.price)}</p></div><span class="badge">visible</span></div><p>${item.description || ''}</p>`;

      const actions = document.createElement('div');
      actions.className = 'menu-admin-item__actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => fillMenuForm(item));
      const del = document.createElement('button');
      del.type = 'button';
      del.dataset.deleteMenu = 'true';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (!confirm('Delete ' + item.name + '?')) return;
        saveMenuItems(getMenuItems().filter((menuItem) => menuItem.id !== item.id));
        refreshAll();
        if (menuStatus) menuStatus.textContent = item.name + ' deleted.';
      });
      actions.append(edit, del);
      row.appendChild(actions);
      menuList.appendChild(row);
    });
  }

  function fillMenuForm(item) {
    if (!menuForm) return;
    renderCategoryOptions(item.category);
    menuForm.elements.id.value = item.id;
    menuForm.elements.name.value = item.name;
    menuForm.elements.price.value = item.price;
    menuForm.elements.category.value = item.category;
    menuForm.elements.label.value = item.label || '';
    menuForm.elements.image.value = item.image || '';
    menuForm.elements.imageFile.value = '';
    menuForm.elements.description.value = item.description || '';
    updateImagePreview(item.image || '');
    if (menuFormTitle) menuFormTitle.textContent = 'Edit menu item';
    if (menuStatus) menuStatus.textContent = 'Editing ' + item.name;
    menuForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearMenuForm() {
    if (!menuForm) return;
    menuForm.reset();
    menuForm.elements.id.value = '';
    menuForm.elements.image.value = '';
    renderCategoryOptions();
    updateImagePreview('');
    if (menuFormTitle) menuFormTitle.textContent = 'Add menu item';
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();
    const data = new FormData(menuForm);
    const uploadedImage = await readImageFile(menuForm.elements.imageFile.files[0]);
    const image = uploadedImage || data.get('image') || FALLBACK_IMAGE;
    const id = data.get('id') || slugify(data.get('name')) + '-' + Date.now().toString(36);
    const item = {
      id,
      name: String(data.get('name') || '').trim(),
      price: Number(data.get('price') || 0),
      category: data.get('category'),
      label: String(data.get('label') || getCategoryName(data.get('category')) || '').trim(),
      image,
      description: String(data.get('description') || '').trim(),
      available: true
    };

    const items = getMenuItems();
    const exists = items.some((menuItem) => menuItem.id === id);
    const updated = exists ? items.map((menuItem) => menuItem.id === id ? item : menuItem) : [item, ...items];
    saveMenuItems(updated);
    clearMenuForm();
    refreshAll();
    if (menuStatus) menuStatus.textContent = exists ? 'Menu item updated.' : 'Menu item added.';
  }

  function openModal() {
    if (!categoryModal) return;
    categoryModal.hidden = false;
    categoryModal.removeAttribute('hidden');
    categoryForm?.elements.categoryName?.focus();
  }

  function closeModal() {
    if (!categoryModal) return;
    categoryModal.hidden = true;
    categoryForm?.reset();
    if (categoryStatus) categoryStatus.textContent = '';
  }

  function handleCategorySubmit(event) {
    event.preventDefault();
    const name = titleCase(new FormData(categoryForm).get('categoryName'));
    const id = slugify(name);
    if (!name || !id) return;

    const categories = getCategories();
    if (categories.some((category) => category.id === id)) {
      if (categoryStatus) categoryStatus.textContent = 'Category already exists.';
      return;
    }

    categories.push({ id, name });
    saveCategories(categories);
    renderCategoryOptions(id);
    closeModal();
    if (menuStatus) menuStatus.textContent = name + ' category added.';
  }

  function refreshAll() {
    renderCategoryOptions(menuForm?.elements.category?.value);
    renderStats();
    renderOrders();
    renderMenuManager();
  }

  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const passcode = String(new FormData(loginForm).get('passcode') || '').trim();
    if (passcode === getPasscode()) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      if (loginStatus) loginStatus.textContent = 'Opening dashboard...';
      showDashboard();
    } else if (loginStatus) {
      loginStatus.textContent = 'Wrong passcode.';
    }
  });

  logoutButton?.addEventListener('click', () => { sessionStorage.removeItem(SESSION_KEY); showLogin(); });
  tabButtons.forEach((button) => button.addEventListener('click', () => setPanel(button.dataset.adminTab)));
  clearOrders?.addEventListener('click', () => { if (confirm('Clear all locally stored orders?')) { localStorage.removeItem(ORDERS_KEY); refreshAll(); } });
  refreshOrders?.addEventListener('click', refreshAll);
  menuForm?.addEventListener('submit', handleMenuSubmit);
  resetMenuForm?.addEventListener('click', clearMenuForm);
  menuForm?.elements.imageFile?.addEventListener('change', async () => {
    const uploadedImage = await readImageFile(menuForm.elements.imageFile.files[0]);
    if (uploadedImage) {
      menuForm.elements.image.value = uploadedImage;
      updateImagePreview(uploadedImage);
    }
  });
  resetMenu?.addEventListener('click', () => {
    if (confirm('Reset menu and categories to defaults?')) {
      saveCategories(DEFAULT_CATEGORIES);
      saveMenuItems(DEFAULT_MENU_ITEMS);
      clearMenuForm();
      refreshAll();
    }
  });
  openCategoryModal?.addEventListener('click', openModal);
  closeCategoryButtons.forEach((button) => button.addEventListener('click', closeModal));
  categoryForm?.addEventListener('submit', handleCategorySubmit);
  markOrdersSeen?.addEventListener('click', () => {
    const latest = latestOrderReference();
    safeSet(SEEN_ORDER_KEY, latest);
    safeSet(NOTIFIED_ORDER_KEY, latest);
    refreshAll();
  });
  enableNotifications?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      if (notificationStatus) notificationStatus.textContent = 'Browser notifications are not supported here.';
      return;
    }
    const permission = await Notification.requestPermission();
    if (notificationStatus) notificationStatus.textContent = permission === 'granted' ? 'Notifications enabled. New orders will notify once.' : 'Notifications blocked.';
  });

  window.addEventListener('storage', (event) => {
    if ([ORDERS_KEY, MENU_KEY, CATEGORIES_KEY].includes(event.key)) {
      checkNewOrderNotification();
      refreshAll();
    }
  });

  setInterval(() => {
    if (!dashboard?.hidden) {
      checkNewOrderNotification();
      refreshAll();
    }
  }, 8000);

  renderCategoryOptions();
  updateImagePreview('');

  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
})();
