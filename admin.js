document.addEventListener("DOMContentLoaded", () => {
    // 1. Element DOM Hooks
    const liveOrdersQueue = document.getElementById("live-orders-queue");
    const salesSection = document.getElementById("sales-analysis-section");
    const metricRevenue = document.getElementById("metric-revenue");
    const metricNewOrders = document.getElementById("metric-new-orders");
    const metricSuccessOrders = document.getElementById("metric-success-orders");
    const liveClock = document.getElementById("live-clock");
    const tbody = document.getElementById("sales-report-body");
    
    // Navigasi
    const navOrders = document.getElementById("nav-orders");
    const navHistory = document.getElementById("nav-history");
    const navSales = document.getElementById("nav-sales");
    const sectionTitle = document.querySelector(".orders-section h2") || document.querySelector(".section-header h2");

    let currentView = "live"; // Mode Tampilan: 'live', 'history', atau 'sales'

    // 2. Helper Functions
    function formatRupiah(angka) {
        return 'Rp ' + parseInt(angka || 0).toLocaleString('id-ID');
    }

    function getOrders() {
        return JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
    }

    // 3. Jam Digital Real-time
    if (liveClock) {
        setInterval(() => {
            const sekarang = new Date();
            liveClock.textContent = sekarang.toLocaleString('id-ID', { 
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit' 
            });
        }, 1000);
    }

    // 4. Fungsi Utama Render Tampilan Dashboard
    function renderDashboard() {
        const orders = getOrders();
        
        // Atur Visibilitas Konten Utama (Kartu Antrean vs Tabel Penjualan)
        if (currentView === "sales") {
            if (liveOrdersQueue) liveOrdersQueue.style.display = "none";
            if (salesSection) salesSection.style.display = "block";
            if (sectionTitle) sectionTitle.textContent = "Dashboard Data Penjualan";
        } else {
            if (liveOrdersQueue) liveOrdersQueue.style.display = "grid"; 
            if (salesSection) salesSection.style.display = "none";
            if (sectionTitle) {
                sectionTitle.textContent = currentView === "live" ? "Antrean Pesanan Masuk (Real-Time)" : "Riwayat Transaksi";
            }
        }

        // --- Bagian A: Render Antrean Tiket / Kartu (Live & History) ---
        if (liveOrdersQueue && currentView !== "sales") {
            liveOrdersQueue.innerHTML = "";
            const fragment = document.createDocumentFragment();
            
            // Filter data pesanan berdasarkan tab aktif
            const filteredOrders = currentView === "live" 
                ? orders.filter(o => o.status !== "Selesai")
                : orders.filter(o => o.status === "Selesai");

            if (filteredOrders.length === 0) {
                liveOrdersQueue.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: #888;">
                        <p style="font-size: 1.1rem; font-weight: 600;">Tidak ada pesanan di kategori ini.</p>
                    </div>`;
            } else {
                // Tampilkan dari yang paling baru di atas (.reverse())
                filteredOrders.slice().reverse().forEach(order => {
                    const ticketCard = document.createElement("article");
                    ticketCard.className = "order-ticket";
                    
                    let actionBtn = "";
                    if (order.status === "Baru") {
                        actionBtn = `<button class="action-btn btn-process" data-id="${order.id_pesanan}">👨‍🍳 Proses Di Barista</button>`;
                    } else if (order.status === "Diproses") {
                        actionBtn = `<button class="action-btn btn-complete" data-id="${order.id_pesanan}">✅ Siap Disajikan</button>`;
                    } else {
                        actionBtn = `<p style="text-align:center; font-size:0.85rem; color:#198754; font-weight:600;">✓ Transaksi Selesai</p>`;
                    }
                    
                    const itemsHTML = order.items ? order.items.map(i => `<li>${i}</li>`).join("") : "";
                    const mejaInfo = order.meja || "-";
                    const metodeBayar = order.metode_bayar || 'Tunai';

                    ticketCard.innerHTML = `
                        <div class="ticket-header">
                            <div>
                                <span class="ticket-id">${order.id_pesanan}</span>
                                <div class="ticket-date">${order.tanggal || order.waktu || ''}</div>
                            </div>
                            <span class="badge ${order.status.toLowerCase()}">${order.status}</span>
                        </div>
                        <div class="ticket-body">
                            <div class="cust-info">
                                <div class="cust-name">${order.nama}</div>
                                <div class="cust-table">📍 Meja: ${mejaInfo}</div>
                            </div>
                            <p class="item-list-title">Daftar Menu:</p>
                            <ul class="ticket-items">${itemsHTML}</ul>
                        </div>
                        <div class="ticket-footer">
                            <div class="ticket-total"><span>Total:</span><span>${formatRupiah(order.total_bayar)}</span></div>
                            <div style="font-size:0.75rem; color:#736A62; margin-bottom:5px; font-weight:600;">💳 ${metodeBayar}</div>
                            ${actionBtn}
                        </div>`;
                    fragment.appendChild(ticketCard);
                });
                liveOrdersQueue.appendChild(fragment);
            }
        }

        // --- Bagian B: Render Tabel Laporan Penjualan ---
        if (tbody && currentView === "sales") {
            tbody.innerHTML = '';
            
            if (orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#888;">Belum ada data penjualan.</td></tr>`;
            } else {
                orders.slice().reverse().forEach(item => {
                    const row = document.createElement('tr');
                    const menuList = item.items ? item.items.join(", ") : (item.menu || "-");
                    const totalHarga = item.total_bayar || item.total || 0;
                    
                    row.innerHTML = `
                        <td style="padding: 15px;">${item.tanggal || item.waktu || '-'}</td>
                        <td style="padding: 15px;">${item.nama}</td>
                        <td style="padding: 15px;">${menuList}</td>
                        <td style="padding: 15px; text-align: right; font-weight: 700;">${formatRupiah(totalHarga)}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }

        // --- Bagian C: Update Informasi Kartu Indikator Atas (Metrik) ---
        const totalPendapatan = orders.filter(o => o.status === "Selesai").reduce((sum, o) => sum + (o.total_bayar || 0), 0);
        if (metricRevenue) metricRevenue.textContent = formatRupiah(totalPendapatan);
        if (metricNewOrders) metricNewOrders.textContent = orders.filter(o => o.status === "Baru").length;
        if (metricSuccessOrders) metricSuccessOrders.textContent = `${orders.filter(o => o.status === "Selesai").length} Sukses`;

        bindActionButtons();
    }

    // 5. Mengatur Tombol Update Status Pesanan (Proses & Selesai)
    if (!window.actionButtonsBound) {
        window.actionButtonsBound = true;
        // Gunakan event delegation agar listener tidak hilang saat render ulang
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-process") || e.target.classList.contains("btn-complete")) {
                const id = e.target.getAttribute("data-id");
                const newStatus = e.target.classList.contains("btn-process") ? "Diproses" : "Selesai";
                let orders = getOrders().map(o => o.id_pesanan === id ? {...o, status: newStatus} : o);
                localStorage.setItem('basuo_database_orders', JSON.stringify(orders));
                renderDashboard();
            }
        });
    }
    
    // Tempat penampung kosmetik pendaftaran ulang jika diperlukan script lama
    function bindActionButtons() {}

    // 6. Controller Navigasi Pindah Tab Menu Samping
    function switchTab(activeTab, viewName) {
        [navOrders, navHistory, navSales].forEach(nav => {
            if (nav) nav.classList.remove("aktif");
        });
        if (activeTab) activeTab.classList.add("aktif");
        currentView = viewName;
        renderDashboard();
    }

    if (navOrders) navOrders.onclick = (e) => { e.preventDefault(); switchTab(navOrders, "live"); };
    if (navHistory) navHistory.onclick = (e) => { e.preventDefault(); switchTab(navHistory, "history"); };
    if (navSales) navSales.onclick = (e) => { e.preventDefault(); switchTab(navSales, "sales"); };

    // 7. Fitur Cetak / Ekspor ke File CSV
    const exportBtn = document.getElementById("export-csv-btn");
    if (exportBtn) {
        exportBtn.onclick = () => {
            const orders = getOrders();
            if (orders.length === 0) return alert("Belum ada data untuk diunduh!");

            let csvContent = "ID Pesanan,Tanggal/Waktu,Nama Pelanggan,Meja,Status,Menu Pesanan,Total Harga (Rp)\n";

            orders.forEach(o => {
                const menuClean = o.items ? o.items.join(" + ").replace(/"/g, '""') : (o.menu || "-");
                const tgl = o.tanggal || o.waktu || '-';
                const meja = o.meja || '-';
                const total = o.total_bayar || o.total || 0;
                const row = `${o.id_pesanan || ''},${tgl},${o.nama},${meja},${o.status || ''},"${menuClean}",${total}\n`;
                csvContent += row;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Data_Penjualan_Basuo_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        };
    }

    // 8. Tombol Refresh Manual & Reset Database Pusat
    const refreshBtn = document.getElementById("refresh-btn");
    const tombolReset = document.getElementById("reset-database-btn");
    
    if (refreshBtn) refreshBtn.onclick = renderDashboard;
    if (tombolReset) {
        tombolReset.onclick = () => { 
            if (confirm("⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus seluruh data transaksi dan mereset pendapatan hari ini menjadi Rp 0?")) { 
                localStorage.removeItem('basuo_database_orders'); 
                window.location.reload(); 
            }
        };
    }

    // Jalankan visualisasi database saat pertama kali sistem dibuka
    renderDashboard();
});
