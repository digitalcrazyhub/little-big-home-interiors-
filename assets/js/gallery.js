/* LITTLE BIG HOME INTERIORS — Gallery (vanilla JS) */
(function () {
    "use strict";

    var BASE = "/assets/image/gallery/";

    var ITEMS = [
        { file: "urban-zen-residence.jpg", fb: "1600607687939-ce8a6c25118c", cat: "residential", label: "Residential", title: "Urban Zen Residence", desc: "A warm contemporary home shaped by natural textures and soft light.", alt: "Warm contemporary living room with natural textures", ratio: "tall" },
        { file: "minimalist-living-room.jpg", fb: "1618221195710-dd6b41faaea6", cat: "living", label: "Living Space", title: "Minimalist Living Room", desc: "Clean geometry balanced with warm materials and natural light.", alt: "Minimalist living room with clean geometry", ratio: "short" },
        { file: "quiet-luxury-bedroom.jpg", fb: "1616594039964-ae9021a400a0", cat: "bedroom", label: "Bedroom", title: "Quiet Luxury Bedroom", desc: "A calming retreat designed around softness, proportion and texture.", alt: "Calm luxury bedroom with soft neutral bedding", ratio: "medium" },
        { file: "modern-heritage-villa.jpg", fb: "1600585154340-be6161a56a0c", cat: "residential", label: "Luxury Residential", title: "Modern Heritage Villa", desc: "A refined blend of timeless architecture and contemporary comfort.", alt: "Modern heritage villa exterior at dusk", ratio: "medium" },
        { file: "contemporary-kitchen.jpg", fb: "1556909212-d5b604d0c90d", cat: "kitchen", label: "Kitchen", title: "Contemporary Kitchen", desc: "Functional planning meets understated elegance.", alt: "Contemporary kitchen with stone island", ratio: "tall" },
        { file: "executive-workspace.jpg", fb: "1497366754035-f200968a6e72", cat: "commercial", label: "Commercial", title: "Executive Workspace", desc: "A sophisticated workplace designed for focus and collaboration.", alt: "Sophisticated executive office workspace", ratio: "short" },
        { file: "modern-studio.jpg", fb: "1524758631624-e2822e304c36", cat: "office", label: "Office", title: "Modern Studio", desc: "A refined workspace built around simplicity and productivity.", alt: "Modern studio workspace with timber desk", ratio: "short" },
        { file: "sculpted-dining-room.jpg", fb: "1615874959474-d609969a20ed", cat: "residential", label: "Residential", title: "Sculpted Dining Room", desc: "An intimate dining space anchored by sculptural lighting.", alt: "Elegant dining room with sculptural pendant lighting", ratio: "tall" },
        { file: "stone-lounge.jpg", fb: "1616486338812-3dadae4b4ace", cat: "living", label: "Living Space", title: "Stone & Linen Lounge", desc: "Layered neutrals composed for slow, unhurried living.", alt: "Neutral lounge with stone and linen finishes", ratio: "medium" },
        { file: "atelier-bedroom.jpg", fb: "1522708323590-d24dbb6b0267", cat: "bedroom", label: "Bedroom", title: "Atelier Bedroom Suite", desc: "Quiet tonality framed by handcrafted joinery.", alt: "Bedroom suite with handcrafted joinery", ratio: "short" },
        { file: "marble-pantry.jpg", fb: "1600489000022-c2086d79f9d4", cat: "kitchen", label: "Kitchen", title: "Marble Pantry Kitchen", desc: "Veined stone and matte timber in careful conversation.", alt: "Marble kitchen pantry with matte timber cabinetry", ratio: "tall" },
        { file: "boardroom-nine.jpg", fb: "1604328698692-f76ea9498e76", cat: "commercial", label: "Commercial", title: "Boardroom Nine", desc: "A restrained meeting space built for presence and clarity.", alt: "Restrained corporate boardroom interior", ratio: "medium" },
        { file: "library-study.jpg", fb: "1505409628601-edc9af17fda6", cat: "office", label: "Office", title: "The Library Study", desc: "A private study lined with warm oak and low light.", alt: "Private home study lined with oak shelving", ratio: "short" },
        { file: "courtyard-residence.jpg", fb: "1600566753190-17f0baa2a6c3", cat: "residential", label: "Luxury Residential", title: "Courtyard Residence", desc: "Interior and garden dissolved into one continuous plane.", alt: "Courtyard residence opening onto a garden", ratio: "medium" },
        { file: "penthouse-living.jpg", fb: "1600121848594-d8644e57abab", cat: "living", label: "Living Space", title: "Penthouse Living", desc: "Skyline framed by deep tones and tailored upholstery.", alt: "Penthouse living room with skyline views", ratio: "tall" },
        { file: "cocoon-bedroom.jpg", fb: "1618220179428-22790b461013", cat: "bedroom", label: "Bedroom", title: "Cocoon Guest Room", desc: "A softly enveloped room made for rest and retreat.", alt: "Soft neutral guest bedroom", ratio: "short" },
        { file: "chef-kitchen.jpg", fb: "1600607687920-4e2a09cf159d", cat: "kitchen", label: "Kitchen", title: "Chef's Galley", desc: "Precision layout dressed in brushed metal and stone.", alt: "Chef style galley kitchen in brushed metal", ratio: "medium" },
        { file: "reception-lounge.jpg", fb: "1497215728101-856f4ea42174", cat: "commercial", label: "Commercial", title: "Reception Lounge", desc: "A first impression composed of light, scale and calm.", alt: "Commercial reception lounge with soft seating", ratio: "tall" }
    ];

    var PER_PAGE = 9;
    var grid = document.getElementById("lbhgGrid");
    var emptyMsg = document.getElementById("lbhgEmpty");
    var loadMoreBtn = document.getElementById("lbhgLoadMore");
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".lbhg-filter-btn"));

    var activeFilter = "all";
    var visibleCount = PER_PAGE;
    var nodes = [];
    var currentList = [];
    var currentIndex = 0;

    function unsplash(id, w) {
        return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80";
    }

    function attachFallback(img, id, w) {
        img.addEventListener("error", function handler() {
            img.removeEventListener("error", handler);
            img.src = unsplash(id, w);
        });
    }

    /* ---------- build grid ---------- */
    ITEMS.forEach(function (item, i) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "lbhg-item gallery-reveal";
        el.setAttribute("data-lbhg-category", item.cat);
        el.setAttribute("data-lbhg-ratio", item.ratio);
        el.setAttribute("data-lbhg-index", String(i));
        el.setAttribute("aria-label", "Open " + item.title + " in gallery viewer");

        var img = document.createElement("img");
        img.className = "lbhg-item-image";
        img.src = BASE + item.file;
        img.alt = item.alt;
        img.loading = "lazy";
        img.decoding = "async";
        attachFallback(img, item.fb, 900);

        var overlay = document.createElement("span");
        overlay.className = "lbhg-item-overlay";

        var content = document.createElement("span");
        content.className = "lbhg-item-content";
        content.innerHTML =
            '<span class="lbhg-item-category">' + item.label + "</span>" +
            '<span class="lbhg-item-title">' + item.title + "</span>" +
            '<span class="lbhg-item-desc">' + item.desc + "</span>";

        el.appendChild(img);
        el.appendChild(overlay);
        el.appendChild(content);
        el.addEventListener("click", function () { openLightbox(i); });

        grid.appendChild(el);
        nodes.push(el);
    });

    // titles/categories are spans inside button: promote semantics via classes only
    Array.prototype.forEach.call(grid.querySelectorAll(".lbhg-item-title, .lbhg-item-category, .lbhg-item-desc"),
        function (n) { n.style.display = "block"; });

    /* ---------- filtering + load more ---------- */
    function matching() {
        return nodes.filter(function (n) {
            return activeFilter === "all" || n.getAttribute("data-lbhg-category") === activeFilter;
        });
    }

    function render(animateIn) {
        var list = matching();
        currentList = list.slice(0, visibleCount).map(function (n) {
            return ITEMS[parseInt(n.getAttribute("data-lbhg-index"), 10)];
        });

        nodes.forEach(function (n) { n.classList.add("is-hidden"); });

        list.slice(0, visibleCount).forEach(function (n, idx) {
            n.classList.remove("is-hidden", "is-leaving");
            if (animateIn) {
                n.classList.add("is-entering");
                setTimeout(function () { n.classList.remove("is-entering"); }, 40 + idx * 55);
            }
            revealObserver.observe(n);
        });

        emptyMsg.hidden = list.length !== 0;
        loadMoreBtn.hidden = visibleCount >= list.length;
    }

    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var next = btn.getAttribute("data-lbhg-filter");
            if (next === activeFilter) return;

            filterBtns.forEach(function (b) {
                b.classList.toggle("is-current", b === btn);
                b.setAttribute("aria-pressed", b === btn ? "true" : "false");
            });

            nodes.forEach(function (n) { if (!n.classList.contains("is-hidden")) n.classList.add("is-leaving"); });

            setTimeout(function () {
                activeFilter = next;
                visibleCount = PER_PAGE;
                render(true);
            }, 280);
        });
    });

    loadMoreBtn.addEventListener("click", function () {
        visibleCount += PER_PAGE;
        render(true);
    });

    /* ---------- scroll reveal ---------- */
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            setTimeout(function () { el.classList.add("is-visible"); }, i * 70);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    Array.prototype.forEach.call(
        document.querySelectorAll(".gallery-reveal, .gallery-reveal-left, .gallery-reveal-right, .gallery-reveal-scale"),
        function (el) { revealObserver.observe(el); }
    );

    /* ---------- lightbox ---------- */
    var lightbox = document.getElementById("lbhgLightbox");
    var lbImage = document.getElementById("lbhgLightboxImage");
    var lbCat = document.getElementById("lbhgLightboxCategory");
    var lbTitle = document.getElementById("lbhgLightboxTitle");
    var lbDesc = document.getElementById("lbhgLightboxDesc");
    var lastFocused = null;

    function visibleItems() {
        return matching().slice(0, visibleCount).map(function (n) {
            return parseInt(n.getAttribute("data-lbhg-index"), 10);
        });
    }

    function paint(idx) {
        var item = ITEMS[idx];
        lbImage.classList.add("is-swapping");
        setTimeout(function () {
            lbImage.src = BASE + item.file;
            lbImage.alt = item.alt;
            attachFallback(lbImage, item.fb, 1600);
            lbCat.textContent = item.label;
            lbTitle.textContent = item.title;
            lbDesc.textContent = item.desc;
            lbImage.classList.remove("is-swapping");
        }, 180);
    }

    function openLightbox(idx) {
        lastFocused = document.activeElement;
        currentIndex = idx;
        var item = ITEMS[idx];
        lbImage.src = BASE + item.file;
        lbImage.alt = item.alt;
        attachFallback(lbImage, item.fb, 1600);
        lbCat.textContent = item.label;
        lbTitle.textContent = item.title;
        lbDesc.textContent = item.desc;

        lightbox.hidden = false;
        document.body.classList.add("lbhg-no-scroll");
        requestAnimationFrame(function () { lightbox.classList.add("is-open"); });
        lightbox.querySelector(".lbhg-lightbox-close").focus();
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        document.body.classList.remove("lbhg-no-scroll");
        setTimeout(function () { lightbox.hidden = true; }, 380);
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function step(dir) {
        var list = visibleItems();
        if (!list.length) return;
        var pos = list.indexOf(currentIndex);
        if (pos === -1) pos = 0;
        pos = (pos + dir + list.length) % list.length;
        currentIndex = list[pos];
        paint(currentIndex);
    }

    Array.prototype.forEach.call(lightbox.querySelectorAll("[data-lbhg-close]"), function (el) {
        el.addEventListener("click", closeLightbox);
    });
    lightbox.querySelector(".lbhg-lightbox-prev").addEventListener("click", function () { step(-1); });
    lightbox.querySelector(".lbhg-lightbox-next").addEventListener("click", function () { step(1); });

    document.addEventListener("keydown", function (e) {
        if (lightbox.hidden) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
    });

    /* ---------- banner ---------- */
    var bannerImg = document.querySelector(".lbhg-banner-img");
    if (bannerImg) attachFallback(bannerImg, "1600210492486-724fe5c67fb0", 1920);

    var scrollIndicator = document.querySelector(".lbhg-scroll-indicator");
    if (scrollIndicator) {
        scrollIndicator.addEventListener("click", function () {
            var target = document.querySelector(".lbhg-gallery-intro");
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });
        scrollIndicator.style.cursor = "pointer";
        window.addEventListener("scroll", function () {
            scrollIndicator.style.opacity = window.scrollY > 120 ? "0" : "1";
        }, { passive: true });
    }

    render(false);
})();
