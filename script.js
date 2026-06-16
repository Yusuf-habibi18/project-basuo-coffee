document.addEventListener("DOMContentLoaded", () => {
    // State Aplikasi Keranjang Belanja
    let cart = [];

    // DOM Elements Hooks
    const cartCountBadge = document.getElementById("cart-count");
    const cartTriggerBtn = document.getElementById("cart-trigger-btn");
    const cartModal = document.getElementById("cart-modal");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const cartItemsList = document.getElementById("cart-items-list");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const checkoutFinalBtn = document.getElementById("checkout-final-btn");
    
    // Form Input Hooks
    const customerNameInput = document.getElementById("customer-name");
    const tableNumberSelect = document.getElementById("table-number");
    const paymentMethodSelect = document.getElementById("payment-method");
    const qrisContainer = document.getElementById("qris-container");

    // 1. EVENT: Toggle QRIS Image Box Berdasarkan Pilihan Metode Bayar
    if (paymentMethodSelect && qrisContainer) {
        paymentMethodSelect.addEventListener("change", function() {
            if (this.value === "QRIS") {
                qrisContainer.style.display = "block";
            } else {
                qrisContainer.style.display = "none";
            }
        });
    }

    // Helper Format Rupiah
    function formatRupiah(angka) {
        return 'Rp ' + angka.toLocaleString('id-ID');
    }

    // 2. FUNGSI: Hitung ulang jumlah badge & total belanjaan di modal
    function updateCartUI() {
        // Update badge total barang belanjaan di navbar header
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountBadge) cartCountBadge.textContent = totalQty;

        // Render isi list item belanjaan di dalam modal box keranjang
        if (!cartItemsList) return;
        cartItemsList.innerHTML = "";

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<p style="text-align:center; color:#888; padding:20px 0;">Keranjang Anda masih kosong.</p>`;
            if (cartTotalPrice) cartTotalPrice.textContent = "Rp 0";
            return;
        }

        let subtotalKeseluruhan = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotalKeseluruhan += itemTotal;

            const itemRow = document.createElement("div");
            itemRow.style.display = "flex";
            itemRow.style.justifyContent = "space-between";
            itemRow.style.alignItems = "center";
            itemRow.style.marginBottom = "12px";
            itemRow.style.fontSize = "0.95rem";

            itemRow.innerHTML = `
                <div>
                    <strong style="color:var(--text-dark);">${item.name}</strong>
                    <div style="font-size:0.8rem; color:#666;">${formatRupiah(item.price)} x ${item.quantity}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:600; color:var(--primary-color);">${formatRupiah(itemTotal)}</span>
                    <button class="btn-remove-item" data-index="${index}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.1rem;">&times;</button>
                </div>
            `;
            cartItemsList.appendChild(itemRow);
        });

        if (cartTotalPrice) cartTotalPrice.textContent = formatRupiah(subtotalKeseluruhan);

        // Pasang trigger event hapus item satuan
        document.querySelectorAll(".btn-remove-item").forEach(btn => {
            btn.addEventListener("click", function() {
                const idx = parseInt(this.getAttribute("data-index"));
                cart.splice(idx, 1);
                updateCartUI();
            });
        });
    }

    // 3. EVENT: Klik Tombol "Tambah ke Keranjang" di setiap kartu menu
    document.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", function() {
            const menuName = this.getAttribute("data-name");
            const menuPrice = parseInt(this.getAttribute("data-price"));

            // Cek apakah item ini sudah ada di dalam keranjang belanja
            const existingItem = cart.find(item => item.name === menuName);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    name: menuName,
                    price: menuPrice,
                    quantity: 1
                });
            }

            updateCartUI();
            alert(`${menuName} berhasil dimasukkan ke keranjang belanja!`);
        });
    });

    // 4. EVENT: Buka & Tutup Modal Box Keranjang Belanja
    if (cartTriggerBtn && cartModal) {
        cartTriggerBtn.addEventListener("click", () => {
            cartModal.style.display = "flex";
            cartModal.setAttribute("aria-hidden", "false");
            updateCartUI();
        });
    }

    if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener("click", () => {
            cartModal.style.display = "none";
            cartModal.setAttribute("aria-hidden", "true");
        });
    }

    // 5. EVENT: AKSI UTAMA - KLIK TOMBOL KONFIRMASI & KIRIM PESANAN KE DASHBOARD
    if (checkoutFinalBtn) {
        checkoutFinalBtn.addEventListener("click", () => {
            // Validasi Isi Keranjang Belanja
            if (cart.length === 0) {
                alert("Gagal mengirim! Keranjang belanja Anda masih kosong, silahkan pilih menu terlebih dahulu.");
                return;
            }

            // Validasi Input Nama Pemesan
            const namaPemesan = customerNameInput.value.trim();
            if (!namaPemesan) {
                alert("Silahkan masukkan Nama Pemesan terlebih dahulu agar Barista tidak salah membuat pesanan!");
                customerNameInput.focus();
                return;
            }

            // Hitung kalkulasi akhir matematika bisnis
            const totalBayar = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const arrayItemsTeks = cart.map(item => `${item.quantity}x ${item.name}`);

            // Generator ID Unik Sistem (Format: BSO-YYMMDD-RANDOMNUM)
            const waktuSekarang = new Date();
            const formatTanggalId = waktuSekarang.toISOString().slice(2,10).replace(/-/g,"");
            const angkaAcak = Math.floor(1000 + Math.random() * 9000);
            const generatedId = `BSO-${formatTanggalId}-${angkaAcak}`;

            // Bangun Struktur Objek Data JSON Baru Sesuai Blueprint Database Kasir
            const orderBaru = {
                id_pesanan: generatedId,
                tanggal: waktuSekarang.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
                nama: namaPemesan,
                meja: tableNumberSelect.value,
                items: arrayItemsTeks,
                total_bayar: totalBayar,
                metode_bayar: paymentMethodSelect.value,
                status: "Baru"
            };

            // Ambil database antrean global browser, masukkan data baru, lalu simpan ulang
            const databaseGlobal = JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
            databaseGlobal.push(orderBaru);
            localStorage.setItem('basuo_database_orders', JSON.stringify(databaseGlobal));

            // Beri notifikasi sukses kepada pelanggan
            alert(`Terima kasih, ${namaPemesan}!\nPesanan Anda berhasil dikirim langsung ke sistem kasir.\nID Pesanan Anda: ${generatedId}`);

            // Reset total formulir input & kosongkan isi keranjang belanja kembali ke 0
            cart = [];
            customerNameInput.value = "";
            if (qrisContainer) qrisContainer.style.display = "none";
            if (paymentMethodSelect) paymentMethodSelect.value = "Transfer Bank";
            
            // Tutup modal keranjang dan sinkronisasikan antarmuka visual
            updateCartUI();
            cartModal.style.display = "none";
            cartModal.setAttribute("aria-hidden", "true");
        });
    }
});
