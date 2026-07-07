const cart = new Map();
const addButtons = document.querySelectorAll('[data-add-order]');
const filterButtons = document.querySelectorAll('[data-menu-filter]');
const menuItems = document.querySelectorAll('[data-menu-category]');
const cartList = document.querySelector('[data-cart-list]');
const cartTotal = document.querySelector('[data-cart-total]');
const clearCartButton = document.querySelector('[data-clear-cart]');
const orderForm = document.querySelector('[data-menu-order-form]');
const statusText = document.querySelector('[data-cart-status]');

function formatPeso(amount) {
  return '₱' + amount.toLocaleString('en-PH');
}

function getTotal() {
  let total = 0;
  cart.forEach(function (item) {
    total += item.price * item.quantity;
  });
  return total;
}

function getLines() {
  const lines = [];
  cart.forEach(function (item) {
    lines.push(item.quantity + 'x ' + item.name + ' - ' + formatPeso(item.price * item.quantity));
  });
  return lines;
}

function setStatus(message) {
  if (statusText) statusText.textContent = message;
}

function renderCart() {
  if (!cartList || !cartTotal) return;
  cartList.replaceChildren();

  if (cart.size === 0) {
    const empty = document.createElement('li');
    empty.className = 'cart-empty';
    empty.textContent = 'No items yet.';
    cartList.appendChild(empty);
    cartTotal.textContent = '₱0';
    return;
  }

  cart.forEach(function (item) {
    const row = document.createElement('li');
    row.className = 'cart-item';

    const top = document.createElement('div');
    top.className = 'cart-item__top';

    const name = document.createElement('span');
    name.textContent = item.name;

    const subtotal = document.createElement('strong');
    subtotal.textContent = formatPeso(item.price * item.quantity);

    top.append(name, subtotal);

    const controls = document.createElement('div');
    controls.className = 'cart-item__controls';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease ' + item.name);
    minus.addEventListener('click', function () {
      item.quantity -= 1;
      if (item.quantity <= 0) cart.delete(item.name);
      renderCart();
    });

    const quantity = document.createElement('span');
    quantity.textContent = 'Qty: ' + item.quantity;

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase ' + item.name);
    plus.addEventListener('click', function () {
      item.quantity += 1;
      cart.set(item.name, item);
      renderCart();
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', function () {
      cart.delete(item.name);
      renderCart();
    });

    controls.append(minus, quantity, plus, remove);
    row.append(top, controls);
    cartList.appendChild(row);
  });

  cartTotal.textContent = formatPeso(getTotal());
}

addButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const name = button.dataset.name;
    const price = Number(button.dataset.price || 0);
    const existing = cart.get(name) || { name: name, price: price, quantity: 0 };
    existing.quantity += 1;
    cart.set(name, existing);
    renderCart();
    setStatus(name + ' added to order.');
  });
});

clearCartButton?.addEventListener('click', function () {
  cart.clear();
  renderCart();
  setStatus('Order cleared.');
});

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const category = button.dataset.menuFilter;

    filterButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn === button);
    });

    menuItems.forEach(function (item) {
      const show = category === 'all' || item.dataset.menuCategory === category;
      item.hidden = !show;
    });
  });
});

orderForm?.addEventListener('submit', async function (event) {
  event.preventDefault();

  if (cart.size === 0) {
    setStatus('Add at least one item before copying an order.');
    return;
  }

  const data = new FormData(orderForm);
  const orderMessage = [
    'Hello BLK.8 CAFÉ! I would like to order:',
    '',
    getLines().join('\n'),
    '',
    'Estimated total: ' + formatPeso(getTotal()),
    'Name: ' + data.get('customer'),
    'Contact: ' + data.get('contact'),
    'Order type: ' + data.get('type'),
    'Preferred time: ' + (data.get('time') || 'Not specified'),
    'Notes: ' + (data.get('notes') || 'None')
  ].join('\n');

  try {
    await navigator.clipboard.writeText(orderMessage);
    setStatus('Order message copied. Paste it into Messenger to send.');
  } catch (error) {
    setStatus('Copy failed. Please manually copy your order details.');
  }
});

renderCart();
