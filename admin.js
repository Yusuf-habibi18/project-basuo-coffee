document.addEventListener("DOMContentLoaded", () => {

  // ── DOM Refs ──────────────────────────────────────────────────
  const liveOrdersQueue     = document.getElementById("live-orders-queue");
  const salesSection        = document.getElementById("sales-analysis-section");
  const metricRevenue       = document.getElementById("metric-revenue");
  const metricNewOrders     = document.getElementById("metric-new-orders");
  const metricSuccess       = document.getElementById("metric-success-orders");
  const liveClock           = document.getElementById("live-clock");
  const tbody               = document.getElementById("sales-report-body");
  const navOrders           = document.getElementById("nav-orders");
  const navHistory          = document.getElementById("nav-history");
  const navSales            = document.getElementById("nav-sales");
  const ordersSectionEl     = document.getElementById("orders-section-container");
  const orderCountPill      = document.getElementById("order-count-pill");
  const sidebarBadgeNew     = document.getElementById("sidebar-badge-new");
  const topbarTitle         = document.getElementById("topbar-title");

  let currentView = "live";
  let revenueChartInstance = null;

  // ── Helpers ───────────────────────────────────────────────────
  function formatRupiah(n) {
    return 'Rp ' + parseInt(n || 0).toLocaleString('id-ID');
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
  }

  // ── Toast System ──────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-dot"></span>${msg}`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  // ── Animated Counter ──────────────────────────────────────────
  function animateCounter(el, target, prefix = '', suffix = '') {
    const start = 0;
    const duration = 700;
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + eased * (target - start));
      el.textContent = prefix + (prefix === 'Rp ' ? val.toLocaleString('id-ID') : val) + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = prefix + (prefix === 'Rp ' ? target.toLocaleString('id-ID') : target) + suffix;
    }
    requestAnimationFrame(update);
  }

  // ── Clock ─────────────────────────────────────────────────────
  if (liveClock) {
    const tick = () => {
      liveClock.textContent = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  // ── Chart ─────────────────────────────────────────────────────
  function renderRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const completed = orders.filter(o => o.status === "Selesai");
    const revenueMap = {};
    completed.forEach(o => {
      let dk = (o.tanggal || o.waktu || "N/A").split(",")[0].trim();
      let val = typeof o.total_bayar === 'string'
        ? parseInt(o.total_bayar.replace(/[^0-9]/g, '')) || 0
        : parseInt(o.total_bayar || 0);
      revenueMap[dk] = (revenueMap[dk] || 0) + val;
    });

    const labels = Object.keys(revenueMap);
    const data = Object.values(revenueMap);

    if (revenueChartInstance) revenueChartInstance.destroy();

    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = "'Inconsolata', monospace";

    revenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ["Belum Ada Data"],
        datasets: [{
          label: 'Pendapatan (Rp)',
          data: data.length ? data : [0],
          borderColor: '#1A7AE8',
          backgroundColor: 'rgba(26, 122, 232, 0.06)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#1A7AE8',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#1A7AE8',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            borderColor: 'rgba(26,122,232,0.3)',
            borderWidth: 1,
            titleColor: '#7DB9FF',
            bodyColor: '#94A3B8',
            padding: 14,
            cornerRadius: 10,
            callbacks: {
              label: ctx => '  ' + formatRupiah(ctx.raw)
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(26,122,232,0.05)', drawBorder: false },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(26,122,232,0.06)', drawBorder: false },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: v => 'Rp ' + Number(v).toLocaleString('id-ID')
            }
          }
        }
      }
    });
  }

  // ── Render Dashboard ──────────────────────────────────────────
  function renderDashboard() {
    const orders = getOrders();

    // — Metrics —
    const totalPendapatan = orders.filter(o => o.status === "Selesai")
      .reduce((s, o) => s + parseInt(o.total_bayar || 0), 0);
    const newCount     = orders.filter(o => o.status === "Baru").length;
    const doneCount    = orders.filter(o => o.status === "Selesai").length;

    if (metricRevenue) {
      animateCounter(metricRevenue, totalPendapatan, 'Rp ');
    }
    if (metricNewOrders) {
      animateCounter(metricNewOrders, newCount);
    }
    if (metricSuccess) {
      animateCounter(metricSuccess, doneCount);
    }
    if (sidebarBadgeNew) {
      sidebarBadgeNew.textContent = newCount;
      sidebarBadgeNew.style.display = newCount > 0 ? '' : 'none';
    }

    // — View Toggle —
    if (currentView === "sales") {
      if (ordersSectionEl) ordersSectionEl.style.display = "none";
      if (salesSection) salesSection.style.display = "block";
      if (topbarTitle) topbarTitle.textContent = "Laporan Penjualan";
      setTimeout(() => renderRevenueChart(orders), 60);
    } else {
      if (ordersSectionEl) ordersSectionEl.style.display = "block";
      if (salesSection) salesSection.style.display = "none";

      const titleText = document.getElementById("section-title-text");
      if (titleText) {
        titleText.textContent = currentView === "live"
          ? "Antrean Pesanan Live"
          : "Riwayat Transaksi";
      }
      if (topbarTitle) {
        topbarTitle.textContent = currentView === "live"
          ? "Antrean Pesanan Live"
          : "Riwayat Transaksi";
      }
    }

    // — Order Cards —
    if (liveOrdersQueue && currentView !== "sales") {
      liveOrdersQueue.innerHTML = "";

      const filtered = currentView === "live"
        ? orders.filter(o => o.status !== "Selesai")
        : orders.filter(o => o.status === "Selesai");

      if (orderCountPill) {
        orderCountPill.textContent = filtered.length + ' tiket';
      }

      if (filtered.length === 0) {
        liveOrdersQueue.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">◈</div>
            <p>Tidak ada pesanan di kategori ini.</p>
          </div>`;
        return;
      }

      const frag = document.createDocumentFragment();
      filtered.slice().reverse().forEach((order, idx) => {
        const card = document.createElement("article");
        card.className = "order-ticket";
        card.setAttribute("data-status", order.status);
        card.style.animationDelay = (idx * 60) + 'ms';

        let actionBtn = "";
        if (order.status === "Baru") {
          actionBtn = `<button class="action-btn btn-process" data-id="${order.id_pesanan}">Proses di Barista</button>`;
        } else if (order.status === "Diproses") {
          actionBtn = `<button class="action-btn btn-complete" data-id="${order.id_pesanan}">✓ Siap Disajikan</button>`;
        } else {
          actionBtn = `<div class="ticket-done-text">✓ Transaksi Selesai</div>`;
        }

        const itemsHTML = order.items
          ? order.items.map(i => `<li>${i}</li>`).join("")
          : "";

        card.innerHTML = `
          <div class="ticket-header">
            <div>
              <span class="ticket-id">${order.id_pesanan}</span>
              <div class="ticket-date">${order.tanggal || order.waktu || ''}</div>
            </div>
            <span class="badge ${order.status.toLowerCase()}">${order.status}</span>
          </div>
          <div class="ticket-body">
            <div class="cust-name">${order.nama}</div>
            <div class="cust-table">◈ Meja: ${order.meja || '—'}</div>
            <p class="item-list-title">Daftar Menu</p>
            <ul class="ticket-items">${itemsHTML}</ul>
          </div>
          <div class="ticket-footer">
            <div class="ticket-total">
              <span>Total Bayar</span>
              <span>${formatRupiah(order.total_bayar)}</span>
            </div>
            <div class="ticket-payment">💳 ${order.metode_bayar || 'Tunai'}</div>
            ${actionBtn}
          </div>`;

        frag.appendChild(card);
      });
      liveOrdersQueue.appendChild(frag);
    }

    // — Sales Table —
    if (tbody && currentView === "sales") {
      tbody.innerHTML = '';
      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">Belum ada data penjualan.</td></tr>`;
        return;
      }
      orders.slice().reverse().forEach(item => {
        const tr = document.createElement('tr');
        const menu = item.items ? item.items.join(", ") : (item.menu || "-");
        const total = item.total_bayar || item.total || 0;
        tr.innerHTML = `
          <td>${item.tanggal || item.waktu || '-'}</td>
          <td>${item.nama}</td>
          <td>${menu}</td>
          <td>${formatRupiah(total)}</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // ── Event: Status Buttons ─────────────────────────────────────
  document.addEventListener("click", e => {
    if (e.target.classList.contains("btn-process")) {
      const id = e.target.getAttribute("data-id");
      let orders = getOrders().map(o => o.id_pesanan === id ? { ...o, status: "Diproses" } : o);
      localStorage.setItem('basuo_database_orders', JSON.stringify(orders));
      showToast('Pesanan diteruskan ke barista.', 'info');
      renderDashboard();
    }
    if (e.target.classList.contains("btn-complete")) {
      const id = e.target.getAttribute("data-id");
      let orders = getOrders().map(o => o.id_pesanan === id ? { ...o, status: "Selesai" } : o);
      localStorage.setItem('basuo_database_orders', JSON.stringify(orders));
      showToast('Pesanan selesai disajikan!', 'success');
      renderDashboard();
    }
  });

  // ── Nav Tabs ──────────────────────────────────────────────────
  function switchTab(activeNav, view) {
    [navOrders, navHistory, navSales].forEach(n => n && n.classList.remove("aktif"));
    if (activeNav) activeNav.classList.add("aktif");
    currentView = view;
    renderDashboard();
  }

  if (navOrders)  navOrders.onclick  = e => { e.preventDefault(); switchTab(navOrders, "live"); };
  if (navHistory) navHistory.onclick = e => { e.preventDefault(); switchTab(navHistory, "history"); };
  if (navSales)   navSales.onclick   = e => { e.preventDefault(); switchTab(navSales, "sales"); };

  // ── Export CSV ───────────────────────────────────────────────
  const exportBtn = document.getElementById("export-csv-btn");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const orders = getOrders();
      if (!orders.length) return showToast('Belum ada data untuk diunduh.', 'warning');

      let csv = "ID Pesanan,Tanggal,Nama,Meja,Status,Menu,Total\n";
      orders.forEach(o => {
        const menu = (o.items ? o.items.join(" + ") : (o.menu || "-")).replace(/"/g, '""');
        csv += `${o.id_pesanan || ''},${o.tanggal || o.waktu || ''},${o.nama},${o.meja || '-'},${o.status},"${menu}",${o.total_bayar || 0}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Basuo_Penjualan_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      showToast('File CSV berhasil diunduh.', 'success');
    };
  }

  // ── Refresh & Reset ──────────────────────────────────────────
  const refreshBtn = document.getElementById("refresh-btn");
  const resetBtn   = document.getElementById("reset-database-btn");

  if (refreshBtn) refreshBtn.onclick = () => { renderDashboard(); showToast('Data diperbarui.', 'info'); };

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm("⚠️ Reset semua data pesanan?\n\nData tidak bisa dikembalikan.")) {
        localStorage.removeItem('basuo_database_orders');
        showToast('Semua data telah direset.', 'error');
        renderDashboard();
      }
    };
  }

  // ── Init ─────────────────────────────────────────────────────
  renderDashboard();
});
