(() => {
  const MENU_KEY = 'blk8-menu-items';
  const CATEGORIES_KEY = 'blk8-menu-categories';
  const ORDERS_KEY = 'blk8-placed-orders';
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

  const cart = new Map();
  const menuGrid = document.querySelector('.order-menu-grid');
  const filterContainer = document.querySelector('.menu-filters');
  const cartList = document.querySelector('[data-cart-list]');
  const cartTotal = document.querySelector('[data-cart-total]');
  const cartMiniTotal = document.querySelector('[data-cart-mini-total]');
  const cartCount = document.querySelector('[data-cart-count]');
  const navCartCount = document.querySelector('[data-nav-cart-count]');
  const clearCartButton = document.querySelector('[data-clear-cart]');
  const menuOrderForm = document.querySelector('[data-menu-order-form]');
  const statusText = document.querySelector('[data-cart-status]');
  const placeOrderButton = document.querySelector('[data-place-order]');
  const confirmation = document.querySelector('[data-order-confirmation]');
  const orderReference = document.querySelector('[data-order-reference]');
  const newOrderButton = document.querySelector('[data-new-order]');
  let activeFilter = 'all';

  function formatPeso(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH');
  }

  function titleCase(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getMenuItems() {
    try {
      const saved = JSON.parse(localStorage.getItem(MENU_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) {
        return saved.map((item) => ({ ...item, image: item.image || FALLBACK_IMAGE, available: true }));
      }
    } catch (error) {
      localStorage.removeItem(MENU_KEY);
    }
    localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
    return [...DEFAULT_MENU_ITEMS];
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

    getMenuItems().forEach((item) => {
      if (item.category && !categories.some((category) => category.id === item.category)) {
        categories.push({ id: item.category, name: titleCase(item.category.replace(/-/g, ' ')) });
      }
    });

    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return categories;
  }

  function getCategoryName(categoryId) {
    const category = getCategories().find((item) => item.id === categoryId);
    return category?.name || titleCase(String(categoryId || '').replace(/-/g, ' '));
  }

  function getTotal() {
    let total = 0;
    cart.forEach(function (item) {
      total += item.price * item.quantity;
    });
    return total;
  }

  function getCount() {
    let count = 0;
    cart.forEach(function (item) {
      count += item.quantity;
    });
    return count;
  }

  function setStatus(message, type) {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.classList.remove('is-success', 'is-error');
    if (type) statusText.classList.add(type);
  }

  function renderFilters() {
    if (!filterContainer) return;
    const categories = getCategories();
    const activeExists = activeFilter === 'all' || categories.some((category) => category.id === activeFilter);
    if (!activeExists) activeFilter = 'all';

    filterContainer.replaceChildren();
    const allButton = document.createElement('button');
    allButton.className = 'chip' + (activeFilter === 'all' ? ' is-active' : '');
    allButton.type = 'button';
    allButton.dataset.menuFilter = 'all';
    allButton.textContent = 'All';
    filterContainer.appendChild(allButton);

    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = 'chip' + (activeFilter === category.id ? ' is-active' : '');
      button.type = 'button';
      button.dataset.menuFilter = category.id;
      button.textContent = category.name;
      filterContainer.appendChild(button);
    });
  }

  function createMenuCard(item) {
    const article = document.createElement('article');
    article.className = 'order-item';
    article.dataset.menuCategory = item.category;
    article.dataset.menuItem = item.id;

    const img = document.createElement('img');
    img.src = item.image || FALLBACK_IMAGE;
    img.alt = item.name;
    img.loading = 'lazy';
    img.onerror = function () {
      img.src = FALLBACK_IMAGE;
    };

    const body = document.createElement('div');
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = item.label || getCategoryName(item.category);
    const title = document.createElement('h3');
    title.textContent = item.name;
    const desc = document.createElement('p');
    desc.textContent = item.description || 'Freshly prepared café item.';

    const bottom = document.createElement('div');
    bottom.className = 'order-item__bottom';
    const price = document.createElement('strong');
    price.textContent = formatPeso(item.price);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.addOrder = 'true';
    button.dataset.id = item.id;
    button.dataset.name = item.name;
    button.dataset.price = String(item.price);
    button.textContent = 'Add';

    bottom.append(price, button);
    body.append(pill, title, desc, bottom);
    article.append(img, body);
    return article;
  }

  function renderMenu() {
    if (!menuGrid) return;
    renderFilters();
    const items = getMenuItems();
    const visibleItems = items.filter((item) => activeFilter === 'all' || item.category === activeFilter);
    menuGrid.replaceChildren();

    if (!visibleItems.length) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      empty.textContent = 'No menu items available in this category yet.';
      menuGrid.appendChild(empty);
      return;
    }

    visibleItems.forEach((item) => menuGrid.appendChild(createMenuCard(item)));
    updateAddButtons();
  }

  function updateAddButtons() {
    document.querySelectorAll('[data-add-order]').forEach(function (button) {
      const item = cart.get(button.dataset.id || button.dataset.name);
      const card = button.closest('.order-item');
      if (item) {
        button.textContent = 'Add (' + item.quantity + ')';
        button.classList.add('is-added');
        card?.classList.add('is-in-cart');
      } else {
        button.textContent = 'Add';
        button.classList.remove('is-added');
        card?.classList.remove('is-in-cart');
      }
    });
  }

  function updateSummary() {
    const count = getCount();
    const total = getTotal();
    const label = count === 1 ? '1 item' : count + ' items';

    if (cartTotal) cartTotal.textContent = formatPeso(total);
    if (cartMiniTotal) cartMiniTotal.textContent = formatPeso(total);
    if (cartCount) cartCount.textContent = label;
    if (navCartCount) navCartCount.textContent = String(count);
    if (placeOrderButton) placeOrderButton.disabled = count === 0;

    if (count === 0) setStatus('Add at least one item to place an order.');
  }

  function renderCart() {
    if (!cartList) return;
    cartList.replaceChildren();

    if (cart.size === 0) {
      const empty = document.createElement('li');
      empty.className = 'cart-empty';
      empty.textContent = 'No items yet. Tap Add on any menu item.';
      cartList.appendChild(empty);
      updateAddButtons();
      updateSummary();
      return;
    }

    cart.forEach(function (item) {
      const row = document.createElement('li');
      row.className = 'cart-item';

      const top = document.createElement('div');
      top.className = 'cart-item__top';
      const titleWrap = document.createElement('div');
      const name = document.createElement('span');
      const unit = document.createElement('small');
      name.textContent = item.name;
      unit.textContent = formatPeso(item.price) + ' each';
      titleWrap.append(name, unit);
      const subtotal = document.createElement('strong');
      subtotal.textContent = formatPeso(item.price * item.quantity);
      top.append(titleWrap, subtotal);

      const controls = document.createElement('div');
      controls.className = 'cart-item__controls';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.addEventListener('click', function () {
        item.quantity -= 1;
        if (item.quantity <= 0) cart.delete(item.id);
        renderCart();
      });
      const quantity = document.createElement('span');
      quantity.className = 'cart-qty';
      quantity.textContent = 'Qty: ' + item.quantity;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.addEventListener('click', function () {
        item.quantity += 1;
        cart.set(item.id, item);
        renderCart();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', function () {
        cart.delete(item.id);
        renderCart();
        setStatus(item.name + ' removed from order.');
      });

      controls.append(minus, quantity, plus, remove);
      row.append(top, controls);
      cartList.appendChild(row);
    });

    updateAddButtons();
    updateSummary();
  }

  function makeReference() {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'BLK8-' + randomPart;
  }

  function savePlacedOrder(order) {
    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    } catch (error) {
      orders = [];
    }
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 50)));
  }

  menuGrid?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-add-order]');
    if (!button) return;
    const id = button.dataset.id || button.dataset.name;
    const name = button.dataset.name;
    const price = Number(button.dataset.price || 0);
    const item = cart.get(id) || { id: id, name: name, price: price, quantity: 0 };
    item.quantity += 1;
    cart.set(id, item);
    renderCart();
    setStatus(name + ' added to order.', 'is-success');
  });

  clearCartButton?.addEventListener('click', function () {
    cart.clear();
    renderCart();
    setStatus('Order cleared.');
  });

  filterContainer?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-menu-filter]');
    if (!button) return;
    activeFilter = button.dataset.menuFilter;
    renderMenu();
  });

  menuOrderForm?.addEventListener('submit', function (event) {
    event.preventDefault();

    if (cart.size === 0) {
      setStatus('Add at least one item before placing an order.', 'is-error');
      return;
    }

    if (!menuOrderForm.checkValidity()) {
      menuOrderForm.reportValidity();
      return;
    }

    const data = new FormData(menuOrderForm);
    const reference = makeReference();
    const total = getTotal();

    savePlacedOrder({
      reference,
      createdAt: new Date().toISOString(),
      status: 'pending',
      items: Array.from(cart.values()),
      total,
      customer: data.get('customer'),
      contact: data.get('contact'),
      type: data.get('type'),
      time: data.get('time') || 'Not specified',
      payment: data.get('payment'),
      notes: data.get('notes') || 'None'
    });

    setStatus('Order placed. Reference: ' + reference, 'is-success');

    if (orderReference) {
      orderReference.textContent = 'Reference: ' + reference + ' • Estimated total: ' + formatPeso(total);
    }
    if (confirmation) confirmation.hidden = false;
  });

  newOrderButton?.addEventListener('click', function () {
    cart.clear();
    menuOrderForm?.reset();
    if (confirmation) confirmation.hidden = true;
    renderCart();
    setStatus('New order started. Add items from the menu.');
  });

  window.addEventListener('storage', function (event) {
    if ([MENU_KEY, CATEGORIES_KEY].includes(event.key)) {
      renderMenu();
    }
  });

  renderMenu();
  renderCart();
})();
