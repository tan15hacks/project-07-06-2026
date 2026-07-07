(() => {
  const ORDERS_KEY = 'blk8-placed-orders';
  const MENU_KEY = 'blk8-menu-items';
  const CATEGORIES_KEY = 'blk8-menu-categories';
  const PESO = '₱';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DEFAULT_CATEGORIES = [
    { id: 'drinks', name: 'Drinks' },
    { id: 'food', name: 'Food' },
    { id: 'snacks', name: 'Snacks' }
  ];

  const els = {
    updated: document.querySelector('[data-report-updated]'),
    kpis: document.querySelector('[data-report-kpis]'),
    charts: document.querySelector('[data-report-charts]'),
    yearly: document.querySelector('[data-report-yearly-table]'),
    monthly: document.querySelector('[data-report-monthly-table]'),
    weekly: document.querySelector('[data-report-weekly-table]'),
    menu: document.querySelector('[data-report-menu-table]'),
    category: document.querySelector('[data-report-category-table]'),
    status: document.querySelector('[data-report-status-table]'),
    orders: document.querySelector('[data-report-order-table]'),
    excel: document.querySelector('[data-export-excel]'),
    pdf: document.querySelector('[data-export-pdf]'),
    content: document.querySelector('[data-report-content]')
  };

  function peso(amount) {
    return PESO + Number(amount || 0).toLocaleString('en-PH');
  }

  function number(value) {
    return Number(value || 0).toLocaleString('en-PH');
  }

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getOrders() {
    return Array.isArray(readJSON(ORDERS_KEY, [])) ? readJSON(ORDERS_KEY, []) : [];
  }

  function getMenuItems() {
    return Array.isArray(readJSON(MENU_KEY, [])) ? readJSON(MENU_KEY, []) : [];
  }

  function getCategories() {
    const saved = readJSON(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_CATEGORIES;
  }

  function validSalesOrders(orders) {
    return orders.filter((order) => ['pending', 'ready', 'complete'].includes(order.status || 'pending'));
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function startOfWeek(date) {
    const d = startOfDay(date);
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function dateKey(date) {
    return startOfDay(date).toISOString().slice(0, 10);
  }

  function monthKey(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function weekKey(date) {
    return dateKey(startOfWeek(date));
  }

  function yearKey(date) {
    return String(new Date(date).getFullYear());
  }

  function orderDate(order) {
    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function isSameDay(a, b) {
    return dateKey(a) === dateKey(b);
  }

  function isSameWeek(a, b) {
    return weekKey(a) === weekKey(b);
  }

  function isSameMonth(a, b) {
    return monthKey(a) === monthKey(b);
  }

  function isSameYear(a, b) {
    return yearKey(a) === yearKey(b);
  }

  function dateLabel(date) {
    const d = new Date(date);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function weekLabel(weekStart) {
    const start = new Date(weekStart);
    const end = addDays(start, 6);
    return `${MONTHS[start.getMonth()]} ${start.getDate()}–${MONTHS[end.getMonth()]} ${end.getDate()}`;
  }

  function sumSales(orders) {
    return validSalesOrders(orders).reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  function countBy(rows, getKey, defaultRows = []) {
    const map = new Map(defaultRows.map((row) => [row.key, { ...row, orders: 0, sales: 0 }]));
    rows.forEach((order) => {
      const key = getKey(order);
      const current = map.get(key) || { key, label: key, orders: 0, sales: 0 };
      current.orders += 1;
      if ((order.status || 'pending') !== 'cancelled') current.sales += Number(order.total || 0);
      map.set(key, current);
    });
    return Array.from(map.values());
  }

  function getRangeRows(orders, unit) {
    const now = new Date();
    if (unit === 'daily') {
      const defaults = Array.from({ length: 14 }, (_, i) => {
        const d = addDays(now, i - 13);
        return { key: dateKey(d), label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, orders: 0, sales: 0 };
      });
      return countBy(orders, (order) => dateKey(orderDate(order)), defaults).filter((row) => defaults.some((d) => d.key === row.key));
    }

    if (unit === 'weekly') {
      const currentWeek = startOfWeek(now);
      const defaults = Array.from({ length: 8 }, (_, i) => {
        const d = addDays(currentWeek, (i - 7) * 7);
        return { key: dateKey(d), label: weekLabel(d), orders: 0, sales: 0 };
      });
      return countBy(orders, (order) => weekKey(orderDate(order)), defaults).filter((row) => defaults.some((d) => d.key === row.key));
    }

    const year = now.getFullYear();
    const defaults = MONTHS.map((month, index) => ({
      key: `${year}-${String(index + 1).padStart(2, '0')}`,
      label: month,
      orders: 0,
      sales: 0
    }));
    return countBy(orders, (order) => monthKey(orderDate(order)), defaults).filter((row) => defaults.some((d) => d.key === row.key));
  }

  function getYearRows(orders) {
    const nowYear = new Date().getFullYear();
    const years = new Set([2024, 2025, nowYear]);
    orders.forEach((order) => years.add(orderDate(order).getFullYear()));
    const sorted = Array.from(years).filter(Boolean).sort((a, b) => a - b);
    const defaults = sorted.map((year) => ({ key: String(year), label: String(year), orders: 0, sales: 0 }));
    return countBy(orders, (order) => yearKey(orderDate(order)), defaults).sort((a, b) => String(a.key).localeCompare(String(b.key)));
  }

  function getItemRows(orders, menuItems) {
    const itemMap = new Map();
    menuItems.forEach((item) => {
      itemMap.set(item.name, {
        item: item.name,
        category: categoryName(item.category),
        price: Number(item.price || 0),
        sold: 0,
        revenue: 0
      });
    });

    validSalesOrders(orders).forEach((order) => {
      (order.items || []).forEach((item) => {
        const current = itemMap.get(item.name) || {
          item: item.name,
          category: 'Uncategorized',
          price: Number(item.price || 0),
          sold: 0,
          revenue: 0
        };
        current.sold += Number(item.quantity || 0);
        current.revenue += Number(item.quantity || 0) * Number(item.price || 0);
        itemMap.set(item.name, current);
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue || b.sold - a.sold);
  }

  function getCategoryRows(menuItems, itemRows) {
    const rows = new Map();
    getCategories().forEach((category) => {
      rows.set(category.id, { category: category.name, menuItems: 0, sold: 0, revenue: 0, avgPrice: 0 });
    });

    menuItems.forEach((item) => {
      const categoryId = item.category || 'uncategorized';
      const row = rows.get(categoryId) || { category: categoryName(categoryId), menuItems: 0, sold: 0, revenue: 0, avgPrice: 0 };
      row.menuItems += 1;
      row.avgPrice += Number(item.price || 0);
      rows.set(categoryId, row);
    });

    itemRows.forEach((item) => {
      const menuItem = menuItems.find((candidate) => candidate.name === item.item);
      const categoryId = menuItem?.category || 'uncategorized';
      const row = rows.get(categoryId) || { category: categoryName(categoryId), menuItems: 0, sold: 0, revenue: 0, avgPrice: 0 };
      row.sold += item.sold;
      row.revenue += item.revenue;
      rows.set(categoryId, row);
    });

    return Array.from(rows.values()).map((row) => ({
      ...row,
      avgPrice: row.menuItems ? row.avgPrice / row.menuItems : 0
    })).sort((a, b) => b.revenue - a.revenue || b.menuItems - a.menuItems);
  }

  function categoryName(id) {
    const found = getCategories().find((category) => category.id === id);
    return found?.name || String(id || 'Uncategorized').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function groupOrders(orders, keyName) {
    const map = new Map();
    orders.forEach((order) => {
      const key = order[keyName] || 'Not specified';
      const current = map.get(key) || { label: key, orders: 0, sales: 0 };
      current.orders += 1;
      if ((order.status || 'pending') !== 'cancelled') current.sales += Number(order.total || 0);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
  }

  function getReportData() {
    const orders = getOrders();
    const menuItems = getMenuItems();
    const now = new Date();
    const todayOrders = orders.filter((order) => isSameDay(orderDate(order), now));
    const weekOrders = orders.filter((order) => isSameWeek(orderDate(order), now));
    const monthOrders = orders.filter((order) => isSameMonth(orderDate(order), now));
    const yearOrders = orders.filter((order) => isSameYear(orderDate(order), now));
    const itemRows = getItemRows(orders, menuItems);
    const categoryRows = getCategoryRows(menuItems, itemRows);
    const completeOrders = orders.filter((order) => order.status === 'complete');
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled');
    const pendingOrders = orders.filter((order) => !order.status || order.status === 'pending');
    const readyOrders = orders.filter((order) => order.status === 'ready');
    const overallSales = sumSales(orders);

    return {
      generatedAt: new Date(),
      orders,
      menuItems,
      categories: getCategories(),
      ordersKpi: {
        overall: orders.length,
        today: todayOrders.length,
        week: weekOrders.length,
        month: monthOrders.length,
        year: yearOrders.length,
        pending: pendingOrders.length,
        ready: readyOrders.length,
        complete: completeOrders.length,
        cancelled: cancelledOrders.length
      },
      salesKpi: {
        overall: overallSales,
        today: sumSales(todayOrders),
        week: sumSales(weekOrders),
        month: sumSales(monthOrders),
        year: sumSales(yearOrders),
        avgTicket: orders.length ? overallSales / Math.max(1, validSalesOrders(orders).length) : 0
      },
      dailyRows: getRangeRows(orders, 'daily'),
      weeklyRows: getRangeRows(orders, 'weekly'),
      monthlyRows: getRangeRows(orders, 'monthly'),
      yearlyRows: getYearRows(orders),
      itemRows,
      categoryRows,
      statusRows: groupOrders(orders, 'status').map((row) => ({ ...row, label: row.label || 'pending' })),
      paymentRows: groupOrders(orders, 'payment'),
      typeRows: groupOrders(orders, 'type')
    };
  }

  function renderKpis(data) {
    if (!els.kpis) return;
    const kpis = [
      ['Total orders', number(data.ordersKpi.overall), 'All placed orders'],
      ['Today orders', number(data.ordersKpi.today), 'Orders placed today'],
      ['This week orders', number(data.ordersKpi.week), 'Current week'],
      ['This month orders', number(data.ordersKpi.month), 'Current month'],
      ['This year orders', number(data.ordersKpi.year), 'Current year'],
      ['Total sales', peso(data.salesKpi.overall), 'Excludes cancelled orders'],
      ['Today sales', peso(data.salesKpi.today), 'Revenue today'],
      ['This week sales', peso(data.salesKpi.week), 'Revenue this week'],
      ['This month sales', peso(data.salesKpi.month), 'Revenue this month'],
      ['This year sales', peso(data.salesKpi.year), 'Revenue this year'],
      ['Average ticket', peso(data.salesKpi.avgTicket), 'Sales per valid order'],
      ['Menu items', number(data.menuItems.length), `${number(data.categories.length)} categories`]
    ];

    els.kpis.innerHTML = kpis.map(([label, value, note]) => `
      <article class="report-kpi">
        <span>${label}</span>
        <strong>${value}</strong>
        <p>${note}</p>
      </article>
    `).join('');
  }

  function chartSvg(rows, valueKey, options = {}) {
    const width = 760;
    const height = 280;
    const padding = { top: 20, right: 24, bottom: 56, left: 58 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
    const labels = rows.map((row) => row.label);
    const points = rows.map((row, index) => {
      const x = padding.left + (rows.length <= 1 ? innerWidth / 2 : (index / (rows.length - 1)) * innerWidth);
      const y = padding.top + innerHeight - (Number(row[valueKey] || 0) / max) * innerHeight;
      return { x, y, row };
    });

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = padding.top + innerHeight - ratio * innerHeight;
      const value = max * ratio;
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#eadccb" stroke-width="1"/><text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="#746a60">${options.currency ? peso(value).replace('.00', '') : Math.round(value)}</text>`;
    }).join('');

    if (options.type === 'line') {
      const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
      const circles = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#6f8954"><title>${point.row.label}: ${options.currency ? peso(point.row[valueKey]) : number(point.row[valueKey])}</title></circle>`).join('');
      const xLabels = points.map((point, index) => index % Math.ceil(points.length / 8) === 0 || points.length <= 8 ? `<text x="${point.x}" y="${height - 20}" text-anchor="middle" font-size="12" fill="#746a60">${point.row.label}</text>` : '').join('');
      return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title || 'Report chart'}">${yTicks}<path d="${path}" fill="none" stroke="#6f8954" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${circles}${xLabels}</svg>`;
    }

    const gap = 10;
    const barWidth = Math.max(12, (innerWidth - gap * (rows.length - 1)) / Math.max(1, rows.length));
    const bars = rows.map((row, index) => {
      const value = Number(row[valueKey] || 0);
      const barHeight = (value / max) * innerHeight;
      const x = padding.left + index * (barWidth + gap);
      const y = padding.top + innerHeight - barHeight;
      const label = String(row.label).length > 12 ? String(row.label).slice(0, 11) + '…' : row.label;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="#6f8954"><title>${row.label}: ${options.currency ? peso(value) : number(value)}</title></rect><text x="${x + barWidth / 2}" y="${height - 20}" text-anchor="middle" font-size="12" fill="#746a60">${label}</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title || 'Report chart'}">${yTicks}${bars}</svg>`;
  }

  function chartCard(title, description, rows, valueKey, options = {}) {
    const filteredRows = rows.length ? rows : [{ label: 'No data', [valueKey]: 0 }];
    return `
      <article class="report-chart-card">
        <h3>${title}</h3>
        <p>${description}</p>
        ${chartSvg(filteredRows, valueKey, { ...options, title })}
      </article>
    `;
  }

  function renderCharts(data) {
    if (!els.charts) return;
    const topItems = data.itemRows.filter((row) => row.sold > 0).slice(0, 8).map((row) => ({ label: row.item, sold: row.sold, revenue: row.revenue }));
    const categories = data.categoryRows.map((row) => ({ label: row.category, revenue: row.revenue, menuItems: row.menuItems }));
    els.charts.innerHTML = [
      chartCard('Orders by month', 'Current year order count by month.', data.monthlyRows, 'orders', { type: 'line' }),
      chartCard('Sales by month', 'Current year sales trend by month.', data.monthlyRows, 'sales', { type: 'line', currency: true }),
      chartCard('Orders by year', 'Yearly order totals including 2024, 2025, and onward.', data.yearlyRows, 'orders'),
      chartCard('Sales by year', 'Yearly sales totals excluding cancelled orders.', data.yearlyRows, 'sales', { currency: true }),
      chartCard('Top menu items sold', 'Ranked by total quantity sold.', topItems, 'sold'),
      chartCard('Sales by category', 'Revenue contribution by menu category.', categories, 'revenue', { currency: true })
    ].join('');
  }

  function table(headers, rows, options = {}) {
    if (!rows.length) return '<div class="report-empty">No data available yet.</div>';
    return `
      <table class="report-table">
        ${options.caption ? `<caption>${options.caption}</caption>` : ''}
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
  }

  function renderTables(data) {
    if (els.yearly) {
      els.yearly.innerHTML = table(['Year', 'Orders', 'Sales'], data.yearlyRows.map((row) => [row.label, number(row.orders), peso(row.sales)]));
    }
    if (els.monthly) {
      els.monthly.innerHTML = table(['Month', 'Orders', 'Sales'], data.monthlyRows.map((row) => [row.label, number(row.orders), peso(row.sales)]));
    }
    if (els.weekly) {
      const weekly = table(['Week', 'Orders', 'Sales'], data.weeklyRows.map((row) => [row.label, number(row.orders), peso(row.sales)]), { caption: 'Last 8 weeks' });
      const daily = table(['Day', 'Orders', 'Sales'], data.dailyRows.map((row) => [row.label, number(row.orders), peso(row.sales)]), { caption: 'Last 14 days' });
      els.weekly.innerHTML = weekly + '<br />' + daily;
    }
    if (els.menu) {
      els.menu.innerHTML = table(['Item', 'Category', 'Price', 'Sold', 'Revenue'], data.itemRows.map((row) => [row.item, row.category, peso(row.price), number(row.sold), peso(row.revenue)]));
    }
    if (els.category) {
      els.category.innerHTML = table(['Category', 'Menu items', 'Avg price', 'Sold', 'Revenue'], data.categoryRows.map((row) => [row.category, number(row.menuItems), peso(row.avgPrice), number(row.sold), peso(row.revenue)]));
    }
    if (els.status) {
      const status = table(['Status', 'Orders', 'Sales'], data.statusRows.map((row) => [row.label, number(row.orders), peso(row.sales)]), { caption: 'Order statuses' });
      const payment = table(['Payment', 'Orders', 'Sales'], data.paymentRows.map((row) => [row.label, number(row.orders), peso(row.sales)]), { caption: 'Payment methods' });
      const type = table(['Order type', 'Orders', 'Sales'], data.typeRows.map((row) => [row.label, number(row.orders), peso(row.sales)]), { caption: 'Order types' });
      els.status.innerHTML = status + '<br />' + payment + '<br />' + type;
    }
    if (els.orders) {
      els.orders.innerHTML = table(['Reference', 'Date', 'Customer', 'Status', 'Items', 'Total', 'Payment'], data.orders.map((order) => [
        order.reference || 'Order',
        order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No timestamp',
        order.customer || 'Not provided',
        order.status || 'pending',
        (order.items || []).map((item) => `${item.quantity}x ${item.name}`).join('; '),
        peso(order.total),
        order.payment || 'Not specified'
      ]));
    }
  }

  function renderReports() {
    if (!els.kpis && !els.charts) return;
    const data = getReportData();
    if (els.updated) els.updated.textContent = 'Last updated: ' + data.generatedAt.toLocaleString();
    renderKpis(data);
    renderCharts(data);
    renderTables(data);
  }

  function escapeCell(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function workbookTable(title, headers, rows) {
    return `
      <h2>${escapeCell(title)}</h2>
      <table border="1">
        <thead><tr>${headers.map((h) => `<th>${escapeCell(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
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

  function exportExcel() {
    const data = getReportData();
    const summaryRows = [
      ['Total orders', data.ordersKpi.overall],
      ['Today orders', data.ordersKpi.today],
      ['This week orders', data.ordersKpi.week],
      ['This month orders', data.ordersKpi.month],
      ['This year orders', data.ordersKpi.year],
      ['Total sales', data.salesKpi.overall],
      ['Today sales', data.salesKpi.today],
      ['This week sales', data.salesKpi.week],
      ['This month sales', data.salesKpi.month],
      ['This year sales', data.salesKpi.year],
      ['Average ticket', data.salesKpi.avgTicket],
      ['Menu items', data.menuItems.length],
      ['Categories', data.categories.length]
    ];

    const html = `
      <html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif} table{border-collapse:collapse;margin:16px 0;width:100%} th{background:#dbe8c9} th,td{padding:8px;border:1px solid #999} h1,h2{color:#15120f}</style></head><body>
      <h1>BLK.8 CAFÉ Admin Report</h1>
      <p>Generated: ${data.generatedAt.toLocaleString()}</p>
      ${workbookTable('Summary', ['Metric', 'Value'], summaryRows)}
      ${workbookTable('Yearly Orders and Sales', ['Year', 'Orders', 'Sales'], data.yearlyRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Monthly Performance', ['Month', 'Orders', 'Sales'], data.monthlyRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Weekly Performance', ['Week', 'Orders', 'Sales'], data.weeklyRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Daily Performance', ['Day', 'Orders', 'Sales'], data.dailyRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Menu Item Performance', ['Item', 'Category', 'Price', 'Sold', 'Revenue'], data.itemRows.map((row) => [row.item, row.category, row.price, row.sold, row.revenue]))}
      ${workbookTable('Category Performance', ['Category', 'Menu Items', 'Average Price', 'Sold', 'Revenue'], data.categoryRows.map((row) => [row.category, row.menuItems, row.avgPrice, row.sold, row.revenue]))}
      ${workbookTable('Order Statuses', ['Status', 'Orders', 'Sales'], data.statusRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Payment Methods', ['Payment', 'Orders', 'Sales'], data.paymentRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Order Types', ['Order Type', 'Orders', 'Sales'], data.typeRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Order Details', ['Reference', 'Date', 'Customer', 'Status', 'Items', 'Total', 'Payment', 'Notes'], data.orders.map((order) => [order.reference, order.createdAt, order.customer, order.status || 'pending', (order.items || []).map((item) => `${item.quantity}x ${item.name}`).join('; '), order.total, order.payment, order.notes]))}
      </body></html>
    `;
    downloadFile('blk8-admin-report.xls', html, 'application/vnd.ms-excel;charset=utf-8');
  }

  function exportPdf() {
    renderReports();
    const report = els.content?.cloneNode(true);
    if (!report) return;
    report.querySelectorAll('.report-actions').forEach((node) => node.remove());
    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>BLK.8 Admin Report</title>
          <style>
            body{font-family:Arial,sans-serif;margin:32px;color:#15120f;background:#fffaf3}
            h1,h2,h3,p{margin-top:0}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6f8954;font-weight:900}
            .panel-card,.report-chart-card,.report-kpi{border:1px solid #e5d8c8;border-radius:18px;padding:18px;margin:0 0 18px;background:#fff;break-inside:avoid}
            .report-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.report-kpi span{font-size:11px;text-transform:uppercase;color:#6f8954;font-weight:900}.report-kpi strong{display:block;font-size:24px;margin-top:6px}
            .report-chart-grid,.report-table-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.report-table-grid>article:last-child{grid-column:1/-1}.report-chart-card svg{width:100%;height:auto}
            table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #e5d8c8;padding:7px;text-align:left;vertical-align:top}th{background:#f3e7d6;text-transform:uppercase;font-size:10px}
            .admin-sidebar,.admin-topbar,.modal,.report-actions{display:none!important}@page{size:A4 landscape;margin:12mm}
          </style>
        </head>
        <body>
          <h1>BLK.8 CAFÉ Admin Report</h1>
          ${report.outerHTML}
          <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  els.excel?.addEventListener('click', exportExcel);
  els.pdf?.addEventListener('click', exportPdf);
  window.addEventListener('storage', (event) => {
    if ([ORDERS_KEY, MENU_KEY, CATEGORIES_KEY].includes(event.key)) renderReports();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderReports();
  });
  setInterval(renderReports, 8000);
  renderReports();
})();
