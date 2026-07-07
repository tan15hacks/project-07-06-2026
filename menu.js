const cart = new Map();
const addButtons = document.querySelectorAll('[data-add-order]');
const filterButtons = document.querySelectorAll('[data-menu-filter]');
const menuItems = document.querySelectorAll('[data-menu-category]');
const cartList = document.querySelector('[data-cart-list]');
const cartTotal = document.querySelector('[data-cart-total]');
const cartMiniTotal = document.querySelector('[data-cart-mini-total]');
const cartCount = document.querySelector('[data-cart-count]');
const navCartCount = document.querySelector('[data-nav-cart-count]');
const clearCartButton = document.querySelector('[data-clear-cart]');
const orderForm = document.querySelector('[data-menu-order-form]');
const statusText = document.querySelector('[data-cart-status]');
const placeOrderButton = document.querySelector('[data-place-order]');
const confirmation = document.querySelector('[data-order-confirmation]');
const orderReference = document.querySelector('[data-order-reference]');
const newOrderButton = document.querySelector('[data-new-order]');

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

function updateAddButtons() {
  addButtons.forEach(function (button) {
    const item = cart.get(button.dataset.name);
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
      if (item.quantity <= 0) cart.delete(item.name);
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
      cart.set(item.name, item);
      renderCart();
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', function () {
      cart.delete(item.name);
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

addButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const name = button.dataset.name;
    const price = Number(button.dataset.price || 0);
    const item = cart.get(name) || { name: name, price: price, quantity: 0 };
    item.quantity += 1;
    cart.set(name, item);
    renderCart();
    setStatus(name + ' added to order.', 'is-success');
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

orderForm?.addEventListener('submit', function (event) {
  event.preventDefault();

  if (cart.size === 0) {
    setStatus('Add at least one item before placing an order.', 'is-error');
    return;
  }

  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    return;
  }

  const reference = makeReference();
  const total = getTotal();
  setStatus('Order placed. Reference: ' + reference, 'is-success');

  if (orderReference) {
    orderReference.textContent = 'Reference: ' + reference + ' • Estimated total: ' + formatPeso(total);
  }
  if (confirmation) confirmation.hidden = false;
});

newOrderButton?.addEventListener('click', function () {
  cart.clear();
  orderForm?.reset();
  if (confirmation) confirmation.hidden = true;
  renderCart();
  setStatus('New order started. Add items from the menu.');
});

renderCart();
