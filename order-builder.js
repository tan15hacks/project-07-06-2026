const cart = new Map();
const addButtons = document.querySelectorAll('[data-add-item]');
const clearButton = document.querySelector('[data-clear-order]');
const list = document.querySelector('[data-order-list]');
const total = document.querySelector('[data-order-total]');
const form = document.querySelector('[data-order-form]');

function peso(value) {
  return '₱' + value.toLocaleString('en-PH');
}

function cartLines() {
  return Array.from(cart.values()).map(function (item) {
    return item.qty + 'x ' + item.name + ' - ' + peso(item.qty * item.price);
  });
}

function cartTotal() {
  return Array.from(cart.values()).reduce(function (sum, item) {
    return sum + item.qty * item.price;
  }, 0);
}

function renderCart() {
  if (!list || !total) return;
  list.replaceChildren();

  if (!cart.size) {
    const empty = document.createElement('li');
    empty.textContent = 'No items yet. Add something from the menu.';
    list.appendChild(empty);
    total.textContent = '₱0';
    if (form) form.elements.items.value = '';
    return;
  }

  cart.forEach(function (item) {
    const row = document.createElement('li');
    const name = document.createElement('span');
    const price = document.createElement('strong');
    name.textContent = item.qty + 'x ' + item.name;
    price.textContent = peso(item.qty * item.price);
    row.append(name, price);
    list.appendChild(row);
  });

  total.textContent = peso(cartTotal());
  if (form) form.elements.items.value = cartLines().join('\n');
}

addButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const name = button.dataset.addItem;
    const price = Number(button.dataset.price || 0);
    const current = cart.get(name) || { name: name, price: price, qty: 0 };
    current.qty += 1;
    cart.set(name, current);
    renderCart();
    document.querySelector('#order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

clearButton?.addEventListener('click', function () {
  cart.clear();
  renderCart();
});

renderCart();
