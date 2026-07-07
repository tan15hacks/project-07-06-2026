(() => {
  const DEFAULT_PASSCODE = 'blk8admin2026';
  const SESSION_KEY = 'blk8-admin-session';
  const PASSCODE_KEY = 'blk8-admin-passcode';
  const ORDERS_KEY = 'blk8-placed-orders';
  const MENU_KEY = 'blk8-menu-items';
  const CATEGORIES_KEY = 'blk8-menu-categories';
  const SEEN_ORDER_KEY = 'blk8-last-seen-order';
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

  const loginView = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const loginForm = document.querySelector('[data-login-form]');
  const loginStatus = document.querySelector('[data-login-status]');
  const logoutButton = document.querySelector('[data-logout]');
  const tabButtons = document.querySelectorAll('[data-admin-tab]');
  const panels = document.querySelectorAll('[data-panel]');
  const adminTitle = document.querySelector('[data-admin-title]');
  const ordersList = document.querySelector('[data-orders-list]');
  const clearOrders = document.querySelector('[data-clear-orders]');
  const refreshOrders = document.querySelector('[data-refresh-orders]');
  const menuForm = document.querySelector('[data-menu-form]');
  const menuFormTitle = document.querySelector('[data-menu-form-title]');
  const menuStatus = document.querySelector('[data-menu-status]');
  const menuList = document.querySelector('[data-menu-list]');
  const resetMenuForm = document.querySelector('[data-reset-menu-form]');
  const resetMenu = document.querySelector('[data-reset-menu]');
  const categorySelect = document.querySelector('[data-category-select]');
  const categoryModal = document.querySelector('[data-category-modal]');
  const openCategoryModal = document.querySelector('[data-open-category-modal]');
  const closeCategoryButtons = document.querySelectorAll('[data-close-category-modal]');
  const categoryForm = document.querySelector('[data-category-form]');
  const categoryStatus = document.querySelector('[data-category-status]');
  const imagePreview = document.querySelector('[data-image-preview]');
  const exportCsv = document.querySelector('[data-export-csv]');
  const exportJson = document.querySelector('[data-export-json]');
  const reportSummary = document.querySelector('[data-report-summary]');
  const enableNotifications = document.querySelector('[data-enable-notifications]');
  const markOrdersSeen = document.querySelector('[data-mark-orders-seen]');
  const notificationStatus = document.querySelector('[data-notification-status]');
  const newOrderCount = document.querySelector('[data-new-order-count]');
  const orderBadge = document.querySelector('[data-order-badge]');
  const passcodeForm = document.querySelector('[data-passcode-form]');
  const passcodeStatus = document.querySelector('[data-passcode-status]');

  const statRefs = {
    todaySales: document.querySelector('[data-today-sales]'),
    totalSales: document.querySelector('[data-total-sales]'),
    totalOrders: document.querySelector('[data-total-orders]'),
    pendingOrders: document.querySelector('[data-pending-orders]'),
    ordersTotalPanel: document.querySelector('[data-orders-total-panel]'),
    ordersPendingPanel: document.querySelector('[data-orders-pending-panel]'),
    ordersCompletePanel: document.querySelector('[data-orders-complete-panel]'),
    topItems: document.querySelector('[data-top-items]'),
    salesByDay: document.querySelector('[data-sales-by-day]')
  };

  function peso(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH');
  }

  function safeGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (error) { return fallback; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) { console.error(error); return false; }
  }

  function getPasscode() {
    return safeGet(PASSCODE_KEY, DEFAULT_PASSCODE);
  }

  function slugify(text) {
    return String(text || 'item').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
  }

  function titleCase(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
    catch (error) { localStorage.removeItem(ORDERS_KEY); return []; }
  }

  function saveOrders(orders) {
    safeSet(ORDERS_KEY, JSON.stringify(orders));
  }

  function getCategories() {
    let categories = [];
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) categories = saved;
    } catch (error) {
      localStorage.removeItem(CATEGORIES_KEY);
    }

    if (!categories.length) categories = [...DEFAULT_CATEGORIES];

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

  function getMenuItems(syncCategories = true) {
    let items = [];
    try {
      const saved = JSON.parse(localStorage.getItem(MENU_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) items = saved;
    } catch (error) {
      localStorage.removeItem(MENU_KEY);
    }

    if (!items.length) items = [...DEFAULT_MENU_ITEMS];

    items = items.map((item) => ({
      ...item,
      image: item.image || FALLBACK_IMAGE,
      available: true
    }));

    safeSet(MENU_KEY, JSON.stringify(items));
    if (syncCategories) getCategories();
    return items;
  }

  function saveMenuItems(items) {
    safeSet(MENU_KEY, JSON.stringify(items.map((item) => ({ ...item, available: true }))));
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }
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

  function showDashboard() {
    if (loginView) { loginView.hidden = true; loginView.style.display = 'none'; }
    if (dashboard) { dashboard.hidden = false; dashboard.removeAttribute('hidden'); dashboard.style.display = 'grid'; }
    document.body.classList.add('admin-is-open');
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
    return order.createdAt ? new Date(order.createdAt) : new Date();
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
    renderReportSummary(data);
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
    const orders = getOrders();
    const latest = orders[0];
    if (!latest) return;
    const seenReference = safeGet(SEEN_ORDER_KEY, '');
    if (latest.reference === seenReference) return;
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
      const top = document.createElement('div');
      top.className = 'order-card__top';
      const title = document.createElement('div');
      const h3 = document.createElement('h3');
      const small = document.createElement('p');
      h3.textContent = order.reference || 'Order';
      small.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No timestamp';
      title.append(h3, small);
      const badge = document.createElement('span');
      badge.className = 'badge is-' + status;
      badge.textContent = status;
      top.append(title, badge);

      const list = document.createElement('ul');
      (order.items || []).forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.quantity + 'x ' + item.name + ' — ' + peso(item.quantity * item.price);
        list.appendChild(li);
      });

      const meta = document.createElement('div');
      meta.className = 'order-card__meta';
      [
        ['Total', peso(order.total)],
        ['Customer', order.customer || 'Not provided'],
        ['Contact', order.contact || 'Not provided'],
        ['Type', order.type || 'Not provided'],
        ['Time', order.time || 'Not specified'],
        ['Payment', order.payment || 'Not provided'],
        ['Notes', order.notes || 'None']
      ].forEach(([label, value]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = label + ': ';
        p.append(strong, String(value));
        meta.appendChild(p);
      });

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

      card.append(top, list, meta, actions);
      ordersList.appendChild(card);
    });
  }

  function getCategoryName(categoryId) {
    const category = getCategories().find((item) => item.id === categoryId);
    return category?.name || titleCase(String(categoryId || '').replace(/-/g, ' '));
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
        renderMenuManager();
        renderReportSummary();
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
    renderMenuManager();
    renderReportSummary();
    if (menuStatus) menuStatus.textContent = exists ? 'Menu item updated.' : 'Menu item added.';
  }

  function renderReportSummary(data = calculateAnalytics()) {
    if (!reportSummary) return;
    reportSummary.innerHTML = '';
    const rows = [
      ['Total orders', data.orders.length],
      ['Pending orders', data.pending.length],
      ['Completed orders', data.completed.length],
      ['Today sales', peso(data.todaySales)],
      ['Total sales', peso(data.totalSales)],
      ['Menu items', getMenuItems().length],
      ['Categories', getCategories().length]
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'report-row';
      row.innerHTML = `<strong>${label}</strong><p>${value}</p>`;
      reportSummary.appendChild(row);
    });
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportOrdersCsv() {
    const orders = getOrders();
    const header = ['reference', 'createdAt', 'status', 'customer', 'contact', 'type', 'time', 'payment', 'total', 'items', 'notes'];
    const rows = orders.map((order) => [
      order.reference,
      order.createdAt,
      order.status,
      order.customer,
      order.contact,
      order.type,
      order.time,
      order.payment,
      order.total,
      (order.items || []).map((item) => `${item.quantity}x ${item.name}`).join('; '),
      order.notes
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    downloadFile('blk8-orders-report.csv', csv, 'text/csv');
  }

  function exportOrdersJson() {
    downloadFile('blk8-orders-backup.json', JSON.stringify({ orders: getOrders(), menu: getMenuItems(), categories: getCategories() }, null, 2), 'application/json');
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
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
        if (loginStatus) loginStatus.textContent = 'Opening dashboard...';
        showDashboard();
      } catch (error) {
        console.error(error);
        if (loginStatus) loginStatus.textContent = 'Dashboard failed to open. Check the browser console.';
      }
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
  exportCsv?.addEventListener('click', exportOrdersCsv);
  exportJson?.addEventListener('click', exportOrdersJson);
  openCategoryModal?.addEventListener('click', openModal);
  closeCategoryButtons.forEach((button) => button.addEventListener('click', closeModal));
  categoryForm?.addEventListener('submit', handleCategorySubmit);
  markOrdersSeen?.addEventListener('click', () => { const latest = getOrders()[0]?.reference || ''; safeSet(SEEN_ORDER_KEY, latest); refreshAll(); });
  enableNotifications?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      if (notificationStatus) notificationStatus.textContent = 'Browser notifications are not supported here.';
      return;
    }
    const permission = await Notification.requestPermission();
    if (notificationStatus) notificationStatus.textContent = permission === 'granted' ? 'Notifications enabled.' : 'Notifications blocked.';
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
    try { showDashboard(); } catch (error) { console.error(error); showLogin(); }
  } else {
    showLogin();
  }
})();
