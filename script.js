document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // 1. SMART STICKY HEADER (Navigasi Berubah Halus Saat Di-scroll)
    // ==========================================================================
    const header = document.querySelector("header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }, { passive: true });

    // ==========================================================================
    // 2. INTERACTIVE SCROLL REVEAL (Efek Muncul Mengalir / Fade-In-Up)
    // ==========================================================================
    // Menambahkan target kelas baru (.menu-card, .info-block, .map-block)
    const revealElements = document.querySelectorAll(
        ".reveal, .menu-card, .info-block, .map-block, .try-our-menu, .address-card, .hours-card"
    );
    
    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Efek stagger (kemunculan beruntun satu per satu secara elegan)
                setTimeout(() => {
                    entry.target.classList.add("reveal-active");
                }, index * 100); 
                revealOnScroll.unobserve(entry.target); // Berhenti mengamati jika sudah muncul demi performa
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(element => {
        element.classList.add("reveal-prepare"); // Menyuntikkan state awal animasi
        revealOnScroll.observe(element);
    });

    // ==========================================================================
    // 3. MODERN HOVER 3D/TILT EFFECTS (Interaksi Kartu Mengikuti Kursor)
    // ==========================================================================
    const interactiveCards = document.querySelectorAll(".menu-card, .address-card, .hours-card, .map-block");

    interactiveCards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // Posisi X kursor di dalam kartu
            const y = e.clientY - rect.top;  // Posisi Y kursor di dalam kartu

            // Menghitung derajat rotasi (maksimal 3 derajat agar tetap elegan & tidak pusing)
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const angleX = (yc - y) / yc * 3;
            const angleY = (x - xc) / xc * 3;

            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-5px)`;
        });

        // Kembalikan ke posisi semula saat kursor keluar dari kartu
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
            card.style.transition = "transform 0.5s ease";
        });

        card.addEventListener("mouseenter", () => {
            card.style.transition = "transform 0.1s ease";
        });
    });

    // ==========================================================================
    // 4. MINANG PHILOSOPHICAL QUOTES (Transisi Kebatinan yang Halus)
    // ==========================================================================
    const quotes = [
        "\"Sajauah-jauah bangau tabang, jikok lai jodoh, ka kubangan sato barasuo baliak. Setiap perpisahan hanyalah jeda sebelum pertemuan hangat berikutnya.\"",
        "\"Aroma randang dan seduhan kopi selalu punya cara rahasia untuk memanggil pulang mereka yang pernah melangkah pergi.\"",
        "\"Garih rasaki buliah taserak, namun di sinan barasuo cangkir bapatuik, silaturahmi kito ka jalin baliak.\"",
        "\"Meja kosong yang ditinggalkan hari ini bukanlah akhir cerita, melainkan sebuah ruang tunggu yang lapang bagi kepulanganmu nanti.\""
    ];

    const quoteText = document.getElementById("philosophical-quote");
    if (quoteText) {
        let currentQuoteIndex = 0;
        // Inisialisasi gaya transisi via JS agar aman
        quoteText.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        
        setInterval(() => {
            quoteText.style.opacity = 0;
            quoteText.style.transform = "translateY(10px)";
            
            setTimeout(() => {
                currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
                quoteText.textContent = quotes[currentQuoteIndex];
                quoteText.style.opacity = 1;
                quoteText.style.transform = "translateY(0)";
            }, 800);
        }, 7000);
    }
});