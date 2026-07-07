(() => {
  const DEFAULT_PASSCODE = 'blk8admin2026';
  const SESSION_KEY = 'blk8-admin-session';
  const PASSCODE_KEY = 'blk8-admin-passcode';
  const ORDERS_KEY = 'blk8-placed-orders';
  const NOTES_KEY = 'blk8-admin-notes';

  const loginView = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const loginForm = document.querySelector('[data-login-form]');
  const loginStatus = document.querySelector('[data-login-status]');
  const logoutButton = document.querySelector('[data-logout]');
  const tabButtons = document.querySelectorAll('[data-admin-tab]');
  const panels = document.querySelectorAll('[data-panel]');
  const adminTitle = document.querySelector('[data-admin-title]');
  const ordersList = document.querySelector('[data-orders-list]');
  const totalOrders = document.querySelector('[data-total-orders]');
  const pendingOrders = document.querySelector('[data-pending-orders]');
  const totalSales = document.querySelector('[data-total-sales]');
  const clearOrders = document.querySelector('[data-clear-orders]');
  const menuNoteForm = document.querySelector('[data-menu-note-form]');
  const menuNoteStatus = document.querySelector('[data-menu-note-status]');
  const passcodeForm = document.querySelector('[data-passcode-form]');
  const passcodeStatus = document.querySelector('[data-passcode-status]');

  function peso(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH');
  }

  function getPasscode() {
    return localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    } catch (error) {
      localStorage.removeItem(ORDERS_KEY);
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboard.hidden = false;
    renderOrders();
    loadNotes();
  }

  function showLogin() {
    loginView.hidden = false;
    dashboard.hidden = true;
  }

  function setPanel(name) {
    tabButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.adminTab === name);
    });
    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === name);
    });
    if (adminTitle) adminTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  function renderOrders() {
    const orders = getOrders();
    const pending = orders.filter((order) => !order.status || order.status === 'pending');
    const sales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    if (totalOrders) totalOrders.textContent = String(orders.length);
    if (pendingOrders) pendingOrders.textContent = String(pending.length);
    if (totalSales) totalSales.textContent = peso(sales);
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

      const top = document.createElement('div');
      top.className = 'order-card__top';

      const title = document.createElement('div');
      const h3 = document.createElement('h3');
      const small = document.createElement('p');
      h3.textContent = order.reference || 'Order';
      small.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No timestamp';
      title.append(h3, small);

      const badge = document.createElement('span');
      const status = order.status || 'pending';
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
      const rows = [
        ['Total', peso(order.total)],
        ['Customer', order.customer || 'Not provided'],
        ['Contact', order.contact || 'Not provided'],
        ['Type', order.type || 'Not provided'],
        ['Time', order.time || 'Not specified'],
        ['Payment', order.payment || 'Not provided'],
        ['Notes', order.notes || 'None']
      ];
      rows.forEach(([label, value]) => {
        const p = document.createElement('p');
        p.innerHTML = '<strong>' + label + ':</strong> ' + value;
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
          renderOrders();
        });
        actions.appendChild(button);
      });

      card.append(top, list, meta, actions);
      ordersList.appendChild(card);
    });
  }

  function loadNotes() {
    if (!menuNoteForm) return;
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    menuNoteForm.elements.menuNote.value = notes.menuNote || '';
    menuNoteForm.elements.internalNote.value = notes.internalNote || '';
  }

  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const passcode = new FormData(loginForm).get('passcode');

    if (passcode === getPasscode()) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      loginStatus.textContent = '';
      showDashboard();
    } else {
      loginStatus.textContent = 'Wrong passcode.';
    }
  });

  logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setPanel(button.dataset.adminTab));
  });

  clearOrders?.addEventListener('click', () => {
    if (!confirm('Clear all locally stored orders?')) return;
    localStorage.removeItem(ORDERS_KEY);
    renderOrders();
  });

  menuNoteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(menuNoteForm);
    localStorage.setItem(NOTES_KEY, JSON.stringify({
      menuNote: data.get('menuNote'),
      internalNote: data.get('internalNote')
    }));
    menuNoteStatus.textContent = 'Notes saved.';
  });

  passcodeForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const newPasscode = new FormData(passcodeForm).get('newPasscode');
    localStorage.setItem(PASSCODE_KEY, newPasscode);
    passcodeForm.reset();
    passcodeStatus.textContent = 'Passcode updated for this browser.';
  });

  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
})();
