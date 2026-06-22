document.addEventListener("DOMContentLoaded", () => {
    // 1. Element DOM Hooks
    const liveOrdersQueue = document.getElementById("live-orders-queue");
    const salesSection = document.getElementById("sales-analysis-section");
    const ordersSectionContainer = document.getElementById("orders-section-container");
    
    const metricRevenue = document.getElementById("metric-revenue");
    const metricNewOrders = document.getElementById("metric-new-orders");
    const metricSuccessOrders = document.getElementById("metric-success-orders");
    
    const liveClock = document.getElementById("live-clock");
    const tbody = document.getElementById("sales-report-body");
    const sectionTitleText = document.getElementById("section-title-text");

    // Navigasi Sidebar
    const navOrders = document.getElementById("nav-orders");
    const navHistory = document.getElementById("nav-history");
    const navSales = document.getElementById("nav-sales");

    let currentView = "live"; 
    let salesChartInstance = null; // Menyimpan instance grafik agar tidak duplikat bug grafik

    // 2. Helper Functions
    function formatRupiah(angka) {
        return 'Rp ' + parseInt(angka).toLocaleString('id-ID');
    }

    function getOrders() {
        return JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
    }

    // 3. FUNGSI UTAMA INTEGRASI CHART.JS (PILIHAN 2)
    function renderChart(orders) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Filter hanya pesanan yang sukses/selesai
        const completedOrders = orders.filter(o => o.status === "Selesai");

        // Kelompokkan omset berdasarkan tanggal unik
        const revenueData = {};
        completedOrders.forEach(o => {
            let dateKey = o.tanggal ? o.tanggal.split(' ')[0] : new Date().toLocaleDateString('id-ID'); 
            let total = parseInt(o.total_bayar || o.total || 0);
            revenueData[dateKey] = (revenueData[dateKey] || 0) + total;
        });

        // Urutkan Tanggal Secara Kronologis (Kiri Ke Kanan / Lama Ke Baru)
        const sortedLabels = Object.keys(revenueData).sort((a, b) => {
            const parseDate = (str) => {
                const parts = str.split(/[-\/]/);
                return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(str);
            };
            return parseDate(a) - parseDate(b);
        });

        // Ambil data uang yang sudah terurut sesuai tanggalnya
        const dataPoints = sortedLabels.map(date => revenueData[date]);

        // Hancurkan grafik lama jika layar di-refresh/render ulang agar tidak tumpang tindih
        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        // Tampilan Grafik Garis Premium ala Aplikasi Kasir Moka POS
        salesChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: sortedLabels.length > 0 ? sortedLabels : ['Belum Ada Transaksi Selesai'],
                datasets: [{
                    label: 'Omset Harian',
                    data: dataPoints.length > 0 ? dataPoints : [0],
                    borderColor: '#0D6EFD', // Warna Biru Elegan
                    backgroundColor: 'rgba(13, 110, 253, 0.08)',
                    borderWidth: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#0D6EFD',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.25 // Efek kelengkungan halus
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' Pendapatan: ' + formatRupiah(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return formatRupiah(value); }
                        }
                    }
                }
            }
        });
    }

    // 4. FUNGSI UTAMA RENDER DASHBOARD
    function renderDashboard() {
        const orders = getOrders();
        
        // --- A. Atur Tampilan Menu Navigasi ---
        if (currentView === "sales") {
            liveOrdersQueue.style.display = "none";
            ordersSectionContainer.style.display = "none"; 
            salesSection.style.display = "block";
            renderChart(orders); // Aktifkan grafik saat masuk tab Data Penjualan
        } else {
            salesSection.style.display = "none";
            ordersSectionContainer.style.display = "block";
            liveOrdersQueue.style.display = "grid"; 
            if (sectionTitleText) {
                sectionTitleText.textContent = currentView === "live" ? "Antrean Pesanan Masuk" : "Riwayat Transaksi (Selesai)";
            }
        }

        // --- B. Render Kartu Pesanan ---
        if (liveOrdersQueue && currentView !== "sales") {
            liveOrdersQueue.innerHTML = "";
            const fragment = document.createDocumentFragment();
            
            const filteredOrders = currentView === "live" 
                ? orders.filter(o => o.status !== "Selesai")
                : orders.filter(o => o.status === "Selesai");

            if (filteredOrders.length === 0) {
                liveOrdersQueue.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: #888;">Tidak ada pesanan di kategori ini.</div>`;
            } else {
                filteredOrders.slice().reverse().forEach(order => {
                    const ticketCard = document.createElement("article");
                    ticketCard.className = "order-ticket";
                    
                    let actionBtn = order.status === "Baru" ? `<button class="action-btn btn-process" data-id="${order.id_pesanan}">👨‍🍳 Proses</button>` :
                                    order.status === "Diproses" ? `<button class="action-btn btn-complete" data-id="${order.id_pesanan}">✅ Siap Saji</button>` : 
                                    `<p style="text-align:center; font-size:0.8rem; color:green; font-weight:600;">✓ Transaksi Selesai</p>`;
                    
                    const itemsArray = Array.isArray(order.items) ? order.items : [];
                    const itemsHTML = itemsArray.map(i => `<li>${i}</li>`).join("");

                    ticketCard.innerHTML = `
                        <div class="ticket-header">
                            <div><span class="ticket-id">${order.id_pesanan || '#INV-000'}</span><div class="ticket-date">${order.tanggal || '-'}</div></div>
                            <span class="badge ${order.status.toLowerCase()}">${order.status}</span>
                        </div>
                        <div class="ticket-body">
                            <div class="cust-name">${order.nama}</div>
                            <div class="cust-table">📍 ${order.meja}</div>
                            <ul class="ticket-items">${itemsHTML}</ul>
                        </div>
                        <div class="ticket-footer">
                            <div class="ticket-total"><span>Total:</span><span>${formatRupiah(order.total_bayar || order.total || 0)}</span></div>
                            ${actionBtn}
                        </div>`;
                    fragment.appendChild(ticketCard);
                });
                liveOrdersQueue.appendChild(fragment);
            }
        }

        // --- C. Render Baris Tabel Laporan ---
        if (tbody && currentView === "sales") {
            tbody.innerHTML = '';
            orders.slice().reverse().forEach(item => {
                if(item.status === "Selesai") {
                    const itemsArray = Array.isArray(item.items) ? item.items : [item.menu]; 
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 15px;">${item.tanggal || item.waktu || '-'}</td>
                        <td style="padding: 15px;">${item.nama}</td>
                        <td style="padding: 15px;">${itemsArray.join(", ")}</td>
                        <td style="padding: 15px; text-align: right; font-weight: 700;">${formatRupiah(item.total_bayar || item.total || 0)}</td>
                    `;
                    tbody.appendChild(row);
                }
            });
        }

        // --- D. Mengisi 3 Kartu Metrik Ringkasan ---
        const totalPendapatan = orders.filter(o => o.status === "Selesai").reduce((sum, o) => sum + parseInt(o.total_bayar || o.total || 0), 0);
        if (metricRevenue) metricRevenue.textContent = formatRupiah(totalPendapatan);
        if (metricNewOrders) metricNewOrders.textContent = orders.filter(o => o.status === "Baru").length;
        if (metricSuccessOrders) metricSuccessOrders.textContent = `${orders.filter(o => o.status === "Selesai").length} Transaksi`;

        bindActionButtons();
    }

    // 5. Controller Pengubah Status Transaksi
    function bindActionButtons() {
        document.querySelectorAll(".btn-process, .btn-complete").forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute("data-id");
                const newStatus = btn.classList.contains("btn-process") ? "Diproses" : "Selesai";
                let orders = getOrders().map(o => o.id_pesanan === id ? {...o, status: newStatus} : o);
                localStorage.setItem('basuo_database_orders', JSON.stringify(orders));
                renderDashboard();
            };
        });
    }

    function switchTab(activeTab, viewName) {
        [navOrders, navHistory, navSales].forEach(nav => {
            if(nav) nav.classList.remove("aktif");
        });
        activeTab.classList.add("aktif");
        currentView = viewName;
        renderDashboard();
    }

    if (navOrders) navOrders.onclick = (e) => { e.preventDefault(); switchTab(navOrders, "live"); };
    if (navHistory) navHistory.onclick = (e) => { e.preventDefault(); switchTab(navHistory, "history"); };
    if (navSales) navSales.onclick = (e) => { e.preventDefault(); switchTab(navSales, "sales"); };

    // 6. Fitur Ekspor File CSV Excel
    const exportBtn = document.getElementById("export-csv-btn");
    if (exportBtn) {
        exportBtn.onclick = () => {
            const orders = getOrders().filter(o => o.status === "Selesai"); 
            if (orders.length === 0) return alert("Belum ada data penjualan selesai untuk diekspor!");

            let csvContent = "ID Pesanan,Waktu,Nama Pelanggan,Meja,Status,Menu Pesanan,Total Harga\n";

            orders.forEach(o => {
                const itemsArray = Array.isArray(o.items) ? o.items : [o.menu];
                const menuClean = itemsArray.join(" + ").replace(/"/g, '""'); 
                const harga = o.total_bayar || o.total || 0;
                
                const row = `${o.id_pesanan || '-'},${o.tanggal || o.waktu || '-'},${o.nama},${o.meja || '-'},${o.status},"${menuClean}",${harga}\n`;
                csvContent += row;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Laporan_Omset_Basuo_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        };
    }

    // 7. Tombol Segarkan & Jam Digital
    const refreshBtn = document.getElementById("refresh-btn");
    const tombolReset = document.getElementById("reset-database-btn");
    if(refreshBtn) refreshBtn.onclick = renderDashboard;
    if(tombolReset) tombolReset.onclick = () => { if(confirm("Yakin ingin menghapus seluruh data transaksi di sistem?")) { localStorage.removeItem('basuo_database_orders'); window.location.reload(); }};
    if(liveClock) setInterval(() => liveClock.textContent = new Date().toLocaleString('id-ID'), 1000);

    // Booting awal dashboard ketika pertama dimuat
    renderDashboard();
});
