(() => {
  const ORDERS_KEY = 'blk8-placed-orders';
  const MENU_KEY = 'blk8-menu-items';
  const CATEGORIES_KEY = 'blk8-menu-categories';
  const PESO = '₱';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DEFAULT_CATEGORIES = [
    { id: 'drinks', name: 'Drinks' },
    { id: 'food', name: 'Food' },
    { id: 'snacks', name: 'Snacks' }
  ];

  const els = {
    updated: document.querySelector('[data-report-updated]'),
    rangeTitle: document.querySelector('[data-report-range-title]'),
    periodTitle: document.querySelector('[data-period-table-title]'),
    filterForm: document.querySelector('[data-report-filter-form]'),
    preset: document.querySelector('[data-report-preset]'),
    start: document.querySelector('[data-report-start]'),
    end: document.querySelector('[data-report-end]'),
    kpis: document.querySelector('[data-report-kpis]'),
    charts: document.querySelector('[data-report-charts]'),
    period: document.querySelector('[data-report-period-table]'),
    menu: document.querySelector('[data-report-menu-table]'),
    category: document.querySelector('[data-report-category-table]'),
    status: document.querySelector('[data-report-status-table]'),
    orders: document.querySelector('[data-report-order-table]'),
    excel: document.querySelector('[data-export-excel]'),
    pdf: document.querySelector('[data-export-pdf]'),
    content: document.querySelector('[data-report-content]')
  };

  function peso(amount) {
    return PESO + Number(amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });
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
    const rows = readJSON(ORDERS_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function getMenuItems() {
    const rows = readJSON(MENU_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function getCategories() {
    const rows = readJSON(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    return Array.isArray(rows) && rows.length ? rows : DEFAULT_CATEGORIES;
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function startOfWeek(date) {
    const d = startOfDay(date);
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    return d;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(date) {
    return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  function startOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
  }

  function endOfYear(date) {
    return endOfDay(new Date(date.getFullYear(), 11, 31));
  }

  function dateKey(date) {
    return startOfDay(date).toISOString().slice(0, 10);
  }

  function monthKey(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function yearKey(date) {
    return String(new Date(date).getFullYear());
  }

  function orderDate(order) {
    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function dateInputValue(date) {
    return dateKey(date);
  }

  function dateLabel(date) {
    const d = new Date(date);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function monthLabel(key) {
    const [year, month] = String(key).split('-').map(Number);
    return `${MONTHS[(month || 1) - 1]} ${year}`;
  }

  function categoryName(id) {
    const found = getCategories().find((category) => category.id === id);
    return found?.name || String(id || 'Uncategorized').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function isValidSales(order) {
    return (order.status || 'pending') !== 'cancelled';
  }

  function sumSales(orders) {
    return orders.filter(isValidSales).reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  function getFilter() {
    const preset = els.preset?.value || 'month';
    const now = new Date();
    let start = null;
    let end = null;
    let label = 'All time';

    if (preset === 'today') {
      start = startOfDay(now);
      end = endOfDay(now);
      label = 'Today';
    } else if (preset === 'week') {
      start = startOfWeek(now);
      end = endOfDay(addDays(start, 6));
      label = 'This week';
    } else if (preset === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      label = 'This month';
    } else if (preset === 'year') {
      start = startOfYear(now);
      end = endOfYear(now);
      label = 'This year';
    } else if (preset === 'custom') {
      start = els.start?.value ? startOfDay(new Date(els.start.value)) : null;
      end = els.end?.value ? endOfDay(new Date(els.end.value)) : null;
      label = start && end ? `${dateLabel(start)} to ${dateLabel(end)}` : 'Custom range';
    }

    if (preset !== 'custom') {
      if (els.start) els.start.value = start ? dateInputValue(start) : '';
      if (els.end) els.end.value = end ? dateInputValue(end) : '';
    }

    return { preset, start, end, label };
  }

  function filterOrders(orders, filter) {
    if (!filter.start && !filter.end) return orders;
    return orders.filter((order) => {
      const date = orderDate(order);
      if (filter.start && date < filter.start) return false;
      if (filter.end && date > filter.end) return false;
      return true;
    });
  }

  function daysBetween(start, end) {
    if (!start || !end) return Infinity;
    return Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  }

  function getBuckets(filter) {
    const now = new Date();
    const preset = filter.preset;

    if (preset === 'today') {
      return Array.from({ length: 24 }, (_, hour) => ({
        key: String(hour).padStart(2, '0'),
        label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        orders: 0,
        sales: 0
      }));
    }

    if (preset === 'week') {
      const start = filter.start || startOfWeek(now);
      return Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index);
        return { key: dateKey(date), label: `${MONTHS[date.getMonth()]} ${date.getDate()}`, orders: 0, sales: 0 };
      });
    }

    const span = daysBetween(filter.start, filter.end);
    if (preset === 'month' || span <= 45) {
      const start = filter.start || startOfMonth(now);
      const count = Math.min(45, daysBetween(start, filter.end || endOfMonth(now)));
      return Array.from({ length: count }, (_, index) => {
        const date = addDays(start, index);
        return { key: dateKey(date), label: `${MONTHS[date.getMonth()]} ${date.getDate()}`, orders: 0, sales: 0 };
      });
    }

    if (preset === 'year' || span <= 730) {
      const year = (filter.start || now).getFullYear();
      const startMonth = preset === 'custom' && filter.start ? filter.start.getMonth() : 0;
      const endMonth = preset === 'custom' && filter.end ? filter.end.getMonth() : 11;
      const startYear = filter.start ? filter.start.getFullYear() : year;
      const endYear = filter.end ? filter.end.getFullYear() : year;
      const buckets = [];
      for (let y = startYear; y <= endYear; y += 1) {
        const from = y === startYear ? startMonth : 0;
        const to = y === endYear ? endMonth : 11;
        for (let month = from; month <= to; month += 1) {
          const key = `${y}-${String(month + 1).padStart(2, '0')}`;
          buckets.push({ key, label: `${MONTHS[month]} ${y}`, orders: 0, sales: 0 });
        }
      }
      return buckets;
    }

    const years = new Set([2024, 2025, now.getFullYear()]);
    getOrders().forEach((order) => years.add(orderDate(order).getFullYear()));
    return Array.from(years).sort((a, b) => a - b).map((year) => ({ key: String(year), label: String(year), orders: 0, sales: 0 }));
  }

  function bucketKeyForDate(date, filter) {
    if (filter.preset === 'today') return String(date.getHours()).padStart(2, '0');
    if (filter.preset === 'week') return dateKey(date);
    const span = daysBetween(filter.start, filter.end);
    if (filter.preset === 'month' || span <= 45) return dateKey(date);
    if (filter.preset === 'year' || span <= 730) return monthKey(date);
    return yearKey(date);
  }

  function buildTrendRows(filteredOrders, filter) {
    const buckets = getBuckets(filter);
    const map = new Map(buckets.map((bucket) => [bucket.key, { ...bucket }]));
    filteredOrders.forEach((order) => {
      const key = bucketKeyForDate(orderDate(order), filter);
      const row = map.get(key);
      if (!row) return;
      row.orders += 1;
      if (isValidSales(order)) row.sales += Number(order.total || 0);
    });
    return Array.from(map.values());
  }

  function getItemRows(filteredOrders, menuItems) {
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

    filteredOrders.filter(isValidSales).forEach((order) => {
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

  function groupOrders(orders, keyName) {
    const map = new Map();
    orders.forEach((order) => {
      const key = order[keyName] || (keyName === 'status' ? 'pending' : 'Not specified');
      const current = map.get(key) || { label: key, orders: 0, sales: 0 };
      current.orders += 1;
      if (isValidSales(order)) current.sales += Number(order.total || 0);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
  }

  function getReportData() {
    const filter = getFilter();
    const allOrders = getOrders();
    const filteredOrders = filterOrders(allOrders, filter);
    const menuItems = getMenuItems();
    const validOrders = filteredOrders.filter(isValidSales);
    const itemRows = getItemRows(filteredOrders, menuItems);
    const categoryRows = getCategoryRows(menuItems, itemRows);
    const sales = sumSales(filteredOrders);
    const itemsSold = itemRows.reduce((sum, row) => sum + row.sold, 0);

    return {
      filter,
      generatedAt: new Date(),
      orders: filteredOrders,
      allOrders,
      menuItems,
      categories: getCategories(),
      trendRows: buildTrendRows(filteredOrders, filter),
      itemRows,
      categoryRows,
      statusRows: groupOrders(filteredOrders, 'status'),
      paymentRows: groupOrders(filteredOrders, 'payment'),
      typeRows: groupOrders(filteredOrders, 'type'),
      kpis: {
        orders: filteredOrders.length,
        sales,
        avgTicket: validOrders.length ? sales / validOrders.length : 0,
        itemsSold,
        menuItems: menuItems.length,
        categories: getCategories().length
      }
    };
  }

  function renderKpis(data) {
    if (!els.kpis) return;
    const kpis = [
      ['Orders', number(data.kpis.orders), data.filter.label],
      ['Sales', peso(data.kpis.sales), 'Cancelled orders excluded'],
      ['Average ticket', peso(data.kpis.avgTicket), 'Sales per valid order'],
      ['Items sold', number(data.kpis.itemsSold), 'Total menu quantity sold'],
      ['Menu items', number(data.kpis.menuItems), 'Admin-managed items'],
      ['Categories', number(data.kpis.categories), 'Admin-managed categories']
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
    const height = 250;
    const padding = { top: 18, right: 24, bottom: 52, left: 58 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const rawMax = Math.max(0, ...rows.map((row) => Number(row[valueKey] || 0)));
    const max = options.currency ? Math.max(1, rawMax) : Math.max(4, Math.ceil(rawMax));
    const points = rows.map((row, index) => {
      const x = padding.left + (rows.length <= 1 ? innerWidth / 2 : (index / (rows.length - 1)) * innerWidth);
      const y = padding.top + innerHeight - (Number(row[valueKey] || 0) / max) * innerHeight;
      return { x, y, row };
    });

    const tickValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => options.currency ? max * ratio : Math.round(max * ratio));
    const yTicks = tickValues.map((value) => {
      const ratio = max ? value / max : 0;
      const y = padding.top + innerHeight - ratio * innerHeight;
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#eadccb" stroke-width="1"/><text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="#746a60">${options.currency ? peso(value) : value}</text>`;
    }).join('');

    if (options.type === 'line') {
      const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
      const circles = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#6f8954"><title>${point.row.label}: ${options.currency ? peso(point.row[valueKey]) : number(point.row[valueKey])}</title></circle>`).join('');
      const step = Math.max(1, Math.ceil(points.length / 7));
      const xLabels = points.map((point, index) => index % step === 0 || index === points.length - 1 ? `<text x="${point.x}" y="${height - 18}" text-anchor="middle" font-size="12" fill="#746a60">${point.row.label}</text>` : '').join('');
      return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title || 'Report chart'}">${yTicks}<path d="${path}" fill="none" stroke="#6f8954" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${circles}${xLabels}</svg>`;
    }

    const gap = 10;
    const barWidth = Math.max(14, (innerWidth - gap * Math.max(0, rows.length - 1)) / Math.max(1, rows.length));
    const bars = rows.map((row, index) => {
      const value = Number(row[valueKey] || 0);
      const barHeight = (value / max) * innerHeight;
      const x = padding.left + index * (barWidth + gap);
      const y = padding.top + innerHeight - barHeight;
      const label = String(row.label).length > 13 ? String(row.label).slice(0, 12) + '…' : row.label;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="#6f8954"><title>${row.label}: ${options.currency ? peso(value) : number(value)}</title></rect><text x="${x + barWidth / 2}" y="${height - 18}" text-anchor="middle" font-size="12" fill="#746a60">${label}</text>`;
    }).join('');

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title || 'Report chart'}">${yTicks}${bars}</svg>`;
  }

  function chartCard(title, description, rows, valueKey, options = {}) {
    const chartRows = rows.length ? rows : [{ label: 'No data', [valueKey]: 0 }];
    return `
      <article class="report-chart-card">
        <h3>${title}</h3>
        <p>${description}</p>
        ${chartSvg(chartRows, valueKey, { ...options, title })}
      </article>
    `;
  }

  function renderCharts(data) {
    if (!els.charts) return;
    const topItems = data.itemRows.filter((row) => row.sold > 0).slice(0, 8).map((row) => ({ label: row.item, sold: row.sold, revenue: row.revenue }));
    const categories = data.categoryRows.filter((row) => row.revenue > 0 || row.sold > 0).map((row) => ({ label: row.category, revenue: row.revenue, sold: row.sold }));

    els.charts.innerHTML = [
      chartCard('Orders trend', `Orders for ${data.filter.label}.`, data.trendRows, 'orders', { type: 'line' }),
      chartCard('Sales trend', `Sales for ${data.filter.label}.`, data.trendRows, 'sales', { type: 'line', currency: true }),
      chartCard('Top menu items', 'Filtered by selected date range.', topItems, 'sold'),
      chartCard('Sales by category', 'Revenue by category for selected date range.', categories, 'revenue', { currency: true })
    ].join('');
  }

  function table(headers, rows, options = {}) {
    if (!rows.length) return '<div class="report-empty">No data available for this filter.</div>';
    return `
      <table class="report-table">
        ${options.caption ? `<caption>${options.caption}</caption>` : ''}
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
  }

  function renderTables(data) {
    if (els.period) {
      els.period.innerHTML = table(['Period', 'Orders', 'Sales'], data.trendRows.map((row) => [row.label, number(row.orders), peso(row.sales)]));
    }
    if (els.menu) {
      els.menu.innerHTML = table(['Item', 'Category', 'Price', 'Sold', 'Revenue'], data.itemRows.map((row) => [row.item, row.category, peso(row.price), number(row.sold), peso(row.revenue)]), { caption: 'Menu items' });
    }
    if (els.category) {
      els.category.innerHTML = table(['Category', 'Menu items', 'Avg price', 'Sold', 'Revenue'], data.categoryRows.map((row) => [row.category, number(row.menuItems), peso(row.avgPrice), number(row.sold), peso(row.revenue)]), { caption: 'Categories' });
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
    if (els.updated) els.updated.textContent = `Last updated: ${data.generatedAt.toLocaleString()} • Filter: ${data.filter.label}`;
    if (els.rangeTitle) els.rangeTitle.textContent = `${data.filter.label} overview`;
    if (els.periodTitle) els.periodTitle.textContent = `${data.filter.label} performance`;
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
      ['Filter', data.filter.label],
      ['Orders', data.kpis.orders],
      ['Sales', data.kpis.sales],
      ['Average ticket', data.kpis.avgTicket],
      ['Items sold', data.kpis.itemsSold],
      ['Menu items', data.kpis.menuItems],
      ['Categories', data.kpis.categories]
    ];

    const chartData = workbookTable('Chart Data - Period Trend', ['Period', 'Orders', 'Sales'], data.trendRows.map((row) => [row.label, row.orders, row.sales]));
    const html = `
      <html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif} table{border-collapse:collapse;margin:16px 0;width:100%} th{background:#dbe8c9} th,td{padding:8px;border:1px solid #999} h1,h2{color:#15120f}</style></head><body>
      <h1>BLK.8 CAFÉ Filtered Admin Report</h1>
      <p>Generated: ${data.generatedAt.toLocaleString()}</p>
      ${workbookTable('Summary', ['Metric', 'Value'], summaryRows)}
      ${chartData}
      ${workbookTable('Menu Item Performance', ['Item', 'Category', 'Price', 'Sold', 'Revenue'], data.itemRows.map((row) => [row.item, row.category, row.price, row.sold, row.revenue]))}
      ${workbookTable('Category Performance', ['Category', 'Menu Items', 'Average Price', 'Sold', 'Revenue'], data.categoryRows.map((row) => [row.category, row.menuItems, row.avgPrice, row.sold, row.revenue]))}
      ${workbookTable('Order Statuses', ['Status', 'Orders', 'Sales'], data.statusRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Payment Methods', ['Payment', 'Orders', 'Sales'], data.paymentRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Order Types', ['Order Type', 'Orders', 'Sales'], data.typeRows.map((row) => [row.label, row.orders, row.sales]))}
      ${workbookTable('Order Details', ['Reference', 'Date', 'Customer', 'Status', 'Items', 'Total', 'Payment', 'Notes'], data.orders.map((order) => [order.reference, order.createdAt, order.customer, order.status || 'pending', (order.items || []).map((item) => `${item.quantity}x ${item.name}`).join('; '), order.total, order.payment, order.notes]))}
      </body></html>
    `;
    downloadFile('blk8-filtered-admin-report.xls', html, 'application/vnd.ms-excel;charset=utf-8');
  }

  function exportPdf() {
    renderReports();
    const report = els.content?.cloneNode(true);
    if (!report) return;
    report.querySelectorAll('.report-actions, .report-filter').forEach((node) => node.remove());
    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>BLK.8 Filtered Admin Report</title>
          <style>
            body{font-family:Arial,sans-serif;margin:32px;color:#15120f;background:#fffaf3}
            h1,h2,h3,p{margin-top:0}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6f8954;font-weight:900}
            .panel-card,.report-chart-card,.report-kpi{border:1px solid #e5d8c8;border-radius:18px;padding:18px;margin:0 0 18px;background:#fff;break-inside:avoid}
            .report-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.report-kpi span{font-size:11px;text-transform:uppercase;color:#6f8954;font-weight:900}.report-kpi strong{display:block;font-size:24px;margin-top:6px}
            .report-chart-grid,.report-table-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.report-table-grid>article:last-child{grid-column:1/-1}.report-chart-card svg{width:100%;height:auto}
            table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #e5d8c8;padding:7px;text-align:left;vertical-align:top}th{background:#f3e7d6;text-transform:uppercase;font-size:10px}
            .admin-sidebar,.admin-topbar,.modal,.report-actions,.report-filter{display:none!important}@page{size:A4 landscape;margin:12mm}
          </style>
        </head>
        <body>
          <h1>BLK.8 CAFÉ Filtered Admin Report</h1>
          ${report.outerHTML}
          <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  function syncDateInputs() {
    const preset = els.preset?.value;
    const isCustom = preset === 'custom';
    if (els.start) els.start.disabled = !isCustom;
    if (els.end) els.end.disabled = !isCustom;
    getFilter();
  }

  els.filterForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    renderReports();
  });
  els.preset?.addEventListener('change', () => {
    syncDateInputs();
    renderReports();
  });
  els.start?.addEventListener('change', renderReports);
  els.end?.addEventListener('change', renderReports);
  els.excel?.addEventListener('click', exportExcel);
  els.pdf?.addEventListener('click', exportPdf);
  window.addEventListener('storage', (event) => {
    if ([ORDERS_KEY, MENU_KEY, CATEGORIES_KEY].includes(event.key)) renderReports();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderReports();
  });
  setInterval(renderReports, 8000);
  syncDateInputs();
  renderReports();
})();
