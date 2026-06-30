document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // 1. ADVANCED VIEWPORT INTERSECTION OBSERVER (DYNAMIC SMOOTH REVEAL)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.12,  /* Triggered saat 12% komponen masuk viewport */
        rootMargin: "0px 0px -20px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Tambahkan delay staggered secara dinamis jika item berupa grid/list
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Hanya animasikan sekali saat scroll turun
            }
        });
    }, revealOptions);

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // ==========================================================================
    // 2. DYNAMIC SCROLL CONTROLLER (HEADER EFFECT)
    // ==========================================================================
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================================================
    // 3. RESPONSIVE MOBILE OVERLAY NAVIGATION SYSTEM
    // ==========================================================================
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Tutup menu otomatis jika link diklik (UX Improvement)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================================================
    // 4. PERSISTENT SHOPPING CART ENGINE (COMPATIBLE ACROSS SITES)
    // ==========================================================================
    let cart = [];

    // DOM Elements Hooks (Aman digunakan di index.html, tidak akan memicu error crash)
    const cartCountBadge = document.getElementById("cart-count");
    const cartTriggerBtn = document.getElementById("cart-trigger-btn");
    const cartModal = document.getElementById("cart-modal");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const cartItemsList = document.getElementById("cart-items-list");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const checkoutFinalBtn = document.getElementById("checkout-final-btn");
    
    const customerNameInput = document.getElementById("customer-name");
    const tableNumberSelect = document.getElementById("table-number");
    const paymentMethodSelect = document.getElementById("payment-method");
    const qrisContainer = document.getElementById("qris-container");

    if (paymentMethodSelect && qrisContainer) {
        paymentMethodSelect.addEventListener("change", function() {
            qrisContainer.style.display = (this.value === "QRIS") ? "block" : "none";
        });
    }

    function formatRupiah(angka) {
        return 'Rp ' + angka.toLocaleString('id-ID');
    }

    function updateCartUI() {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountBadge) cartCountBadge.textContent = totalQty;

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
            itemRow.style.marginBottom = "14px";

            itemRow.innerHTML = `
                <div>
                    <strong style="color:var(--text-dark); display:block; font-size:0.95rem;">${item.name}</strong>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${formatRupiah(item.price)} &times; ${item.quantity}</div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:600; color:var(--accent-clay); font-size:0.95rem;">${formatRupiah(itemTotal)}</span>
                    <button class="btn-remove-item" data-index="${index}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.3rem; line-height:1;">&times;</button>
                </div>
            `;
            cartItemsList.appendChild(itemRow);
        });

        if (cartTotalPrice) cartTotalPrice.textContent = formatRupiah(subtotalKeseluruhan);

        document.querySelectorAll(".btn-remove-item").forEach(btn => {
            btn.addEventListener("click", function() {
                const idx = parseInt(this.getAttribute("data-index"));
                cart.splice(idx, 1);
                updateCartUI();
            });
        });
    }

    document.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", function() {
            const menuName = this.getAttribute("data-name");
            const menuPrice = parseInt(this.getAttribute("data-price"));

            const existingItem = cart.find(item => item.name === menuName);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ name: menuName, price: menuPrice, quantity: 1 });
            }

            updateCartUI();
            alert(`${menuName} berhasil masuk keranjang!`);
        });
    });

    if (cartTriggerBtn && cartModal) {
        cartTriggerBtn.addEventListener("click", () => {
            cartModal.style.display = "flex";
            updateCartUI();
        });
    }

    if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener("click", () => {
            cartModal.style.display = "none";
        });
    }

    if (checkoutFinalBtn) {
        checkoutFinalBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("Keranjang belanja kosong!");
                return;
            }

            const namaPemesan = customerNameInput.value.trim();
            if (!namaPemesan) {
                alert("Silahkan masukkan Nama Pemesan!");
                customerNameInput.focus();
                return;
            }

            const totalBayar = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const arrayItemsTeks = cart.map(item => `${item.quantity}x ${item.name}`);

            const waktuSekarang = new Date();
            const formatTanggalId = waktuSekarang.toISOString().slice(2,10).replace(/-/g,"");
            const angkaAcak = Math.floor(1000 + Math.random() * 9000);
            const generatedId = `BSO-${formatTanggalId}-${angkaAcak}`;

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

            const databaseGlobal = JSON.parse(localStorage.getItem('basuo_database_orders')) || [];
            databaseGlobal.push(orderBaru);
            localStorage.setItem('basuo_database_orders', JSON.stringify(databaseGlobal));

            alert(`Terima kasih, ${namaPemesan}!\nPesanan sukses terkirim.\nID: ${generatedId}`);

            cart = [];
            customerNameInput.value = "";
            if (qrisContainer) qrisContainer.style.display = "none";
            if (paymentMethodSelect) paymentMethodSelect.value = "Transfer Bank";
            
            updateCartUI();
            cartModal.style.display = "none";
        });
    }
});
