document.addEventListener("DOMContentLoaded", () => {
    
    // Element DOM Hooks
    const liveOrdersQueue = document.getElementById("live-orders-queue");
    const metricRevenue = document.getElementById("metric-revenue");
    const metricNewOrders = document.getElementById("metric-new-orders");
    const metricSuccessOrders = document.getElementById("metric-success-orders");
    const refreshBtn = document.getElementById("refresh-btn");
    const tombolReset = document.getElementById("reset-database-btn"); // Hook tombol reset baru
    const liveClock = document.getElementById("live-clock");

    // Mode Halaman Aktif (Live Queue vs History)
    let currentView = "live"; 

    // 1. JAM LIVE DIGITAL DASHBOARD
    if (liveClock) {
        setInterval(() => {
            const sekarang = new Date();
            liveClock.textContent = sekarang.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
        }, 1000);
    }

    // Helper Format Rupiah
    function formatRupiah(angka) {
        return 'Rp ' + angka.toLocaleString('id-ID');
    }

    // 2. FUNGSI UTAMA ENGINE BACKEND: BACA & TAMPILKAN DATABASE
    function loadDashboardData() {
        // Ambil baris data antrean dari localStorage pusat
        let databasePesanan = JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
        
        
        // Bersihkan area papan antrean sebelum render ulang
        if (liveOrdersQueue) liveOrdersQueue.innerHTML = "";

        // Deklarasi variabel penampung hitungan matematika keuangan
        let totalPendapatan = 0;
        let jumlahPesananBaru = 0;
        let jumlahPesananSelesai = 0;

        // Penampung sementara fragmen HTML agar render aman & tombol tidak macet
        const fragment = document.createDocumentFragment();

        // Lakukan perulangan data (Looping Inverse agar orderan paling baru muncul di atas)
        for (let i = databasePesanan.length - 1; i >= 0; i--) {
            const order = databasePesanan[i];

            // Kalkulasi matematika bisnis untuk Counter Cards indikator atas
            if (order.status === "Selesai") {
                totalPendapatan += order.total_bayar;
                jumlahPesananSelesai++;
            } else if (order.status === "Baru") {
                jumlahPesananBaru++;
            }

            // Filter Tampilan Berdasarkan Menu Navigasi Samping (Live vs History)
            if (currentView === "live" && order.status === "Selesai") continue;
            if (currentView === "history" && order.status !== "Selesai") continue;

            // Membangun Komponen HTML Kartu Tiket Pesanan Barista
            const ticketCard = document.createElement("article");
            ticketCard.className = "order-ticket";

            // Atur tombol aksi dinamis berdasarkan status operasional
            let actionButtonHTML = "";
            if (order.status === "Baru") {
                actionButtonHTML = `<button class="action-btn btn-process" data-id="${order.id_pesanan}">👨‍🍳 Proses Di Barista</button>`;
            } else if (order.status === "Diproses") {
                actionButtonHTML = `<button class="action-btn btn-complete" data-id="${order.id_pesanan}">✅ Siap Disajikan</button>`;
            } else {
                actionButtonHTML = `<p style="text-align:center; font-size:0.85rem; color:var(--text-muted); font-weight:600;">✓ Transaksi Selesai</p>`;
            }

            // Susun item menu belanjaan
            const itemsHTML = order.items.map(item => `<li>${item}</li>`).join("");

            ticketCard.innerHTML = `
                <div class="ticket-header">
                    <div>
                        <span class="ticket-id">${order.id_pesanan}</span>
                        <div class="ticket-date">${order.tanggal}</div>
                    </div>
                    <span class="badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="ticket-body">
                    <div class="cust-info">
                        <div class="cust-name">${order.nama}</div>
                        <div class="cust-table">📍 ${order.meja}</div>
                    </div>
                    <p class="item-list-title">Daftar Menu:</p>
                    <ul class="ticket-items">
                        ${itemsHTML}
                    </ul>
                </div>
                <div class="ticket-footer">
                    <div class="ticket-total">
                        <span>Total:</span>
                        <span>${formatRupiah(order.total_bayar)}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:5px; font-weight:600;">
                        💳 ${order.metode_bayar || 'Tunai'}
                    </div>
                    ${actionButtonHTML}
                </div>
            `;

            fragment.appendChild(ticketCard);
        }

        // Masukkan semua kartu ke container utama
        if (liveOrdersQueue) {
            if (fragment.children.length === 0) {
                liveOrdersQueue.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: var(--text-muted);">
                        <p style="font-size: 1.1rem; font-weight: 600;">Tidak ada pesanan dalam kategori ini.</p>
                    </div>
                `;
            } else {
                liveOrdersQueue.appendChild(fragment);
            }
        }

        // Suntikkan hasil hitungan matematika keuangan ke Counter Cards atas secara real-time
        if (metricRevenue) metricRevenue.textContent = formatRupiah(totalPendapatan);
        if (metricNewOrders) metricNewOrders.textContent = jumlahPesananBaru;
        if (metricSuccessOrders) metricSuccessOrders.textContent = `${jumlahPesananSelesai} Sukses`;

        // Daftarkan ulang Event Listener klik tombol aksi setelah kartu disuntik ke DOM
        bindActionButtons();
    }

    // 3. FUNGSI CONTROLLER: UBAH STATUS ANTRIAN PESANAN
    function bindActionButtons() {
        // Pemicu Klik Tombol "Proses Di Barista"
        document.querySelectorAll(".btn-process").forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Hapus sisa duplikasi event listener lama
        });
        document.querySelectorAll(".btn-process").forEach(btn => {
            btn.addEventListener("click", function() {
                const idTarget = this.getAttribute("data-id");
                updateOrderStatus(idTarget, "Diproses");
            });
        });

        // Pemicu Klik Tombol "Siap Disajikan"
        document.querySelectorAll(".btn-complete").forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll(".btn-complete").forEach(btn => {
            btn.addEventListener("click", function() {
                const idTarget = this.getAttribute("data-id");
                updateOrderStatus(idTarget, "Selesai");
            });
        });
    }

    function updateOrderStatus(id, statusBaru) {
        let databasePesanan = JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
        
        // Cari ID pesanan di database lalu timpa status lamanya
        databasePesanan = databasePesanan.map(order => {
            if (order.id_pesanan === id) {
                order.status = statusBaru;
            }
            return order;
        });

        // Tulis ulang database baru yang sudah diupdate ke localStorage
        localStorage.setItem('basuo_database_orders', JSON.stringify(databasePesanan));
        
        // Segarkan layar dashboard kasir detik itu juga
        loadDashboardData();
    }

    // 4. NAVIGASI SIDEBAR CONTROLLER
    const navOrders = document.getElementById("nav-orders");
    const navHistory = document.getElementById("nav-history");
    const sectionTitle = document.querySelector(".orders-section h2") || document.querySelector(".section-header h2");

    if (navOrders && navHistory) {
        navOrders.addEventListener("click", (e) => {
            e.preventDefault();
            currentView = "live";
            navOrders.classList.add("aktif");
            navHistory.classList.remove("aktif");
            if (sectionTitle) sectionTitle.textContent = "Antrean Pesanan Masuk (Real-Time)";
            loadDashboardData();
        });

        navHistory.addEventListener("click", (e) => {
            e.preventDefault();
            currentView = "history"; // Typos huruf 'a' nyasar di kode lama sudah dibersihkan di sini
            navHistory.classList.add("aktif");
            navOrders.classList.remove("aktif");
            if (sectionTitle) sectionTitle.textContent = "Riwayat Transaksi";
            loadDashboardData();
        });
    }

    // Trigger tombol refresh manual
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadDashboardData);
    }

    // ==========================================================================
    // LOGIKA PENGAKTIF TOMBOL RESET DATABASE (INTEGRASI BARU)
    // ==========================================================================
    if (tombolReset) {
        tombolReset.addEventListener("click", () => {
            const konfirmasi = confirm("⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus seluruh data transaksi dan mereset pendapatan hari ini menjadi Rp 0?");
            if (konfirmasi) {
                localStorage.removeItem('basuo_database_orders'); // Hapus memori browser
                alert("Database berhasil dibersihkan!");
                window.location.reload(); // Muat ulang halaman
            }
        });
    }

    // Jalankan render data otomatis saat pertama kali halaman admin dibuka
    loadDashboardData();
});