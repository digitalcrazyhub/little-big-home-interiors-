/* ANTRA — vanilla interactions */
(function () {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nav = document.getElementById("nav");
    var burger = document.getElementById("burger");
    var mobileMenu = document.getElementById("mobileMenu");

    /* ---- sticky nav ---- */
    function onScroll() {
        if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
        parallax();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- mobile menu ---- */
    function setMenu(open) {
        if (!mobileMenu || !burger) return;
        mobileMenu.classList.toggle("open", open);
        burger.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        mobileMenu.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("no-scroll", open);
    }
    if (burger) {
        burger.addEventListener("click", function () {
            setMenu(!mobileMenu.classList.contains("open"));
        });
    }
    if (mobileMenu) {
        mobileMenu.addEventListener("click", function (e) {
            if (e.target === mobileMenu) setMenu(false);
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });

    /* ---- smooth anchor scroll with nav offset ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            var id = link.getAttribute("href");
            if (!id || id === "#") return;
            var target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            setMenu(false);
            var offset = nav ? nav.offsetHeight : 0;
            var top = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
            window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
            history.replaceState(null, "", id);
        });
    });

    /* ---- reveal on scroll ---- */
    var revealEls = document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-up,.reveal-scale");
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry, i) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    var delay = Number(el.dataset.delay || i * 90);
                    setTimeout(function () { el.classList.add("show"); }, delay);
                    io.unobserve(el);
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("show"); });
    }

    /* ---- counters ---- */
    var stats = document.getElementById("stats");
    function runCounters() {
        stats.querySelectorAll("[data-count]").forEach(function (el) {
            var end = Number(el.dataset.count);
            var plain = el.dataset.plain === "1";
            var dur = 1600, start = performance.now();
            function step(now) {
                var p = Math.min((now - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(end * eased) + (plain || p < 1 ? "" : "+");
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }
    if (stats && "IntersectionObserver" in window) {
        var so = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { runCounters(); so.disconnect(); }
        }, { threshold: 0.3 });
        so.observe(stats);
    }

    /* ---- skill bars ---- */
    var bars = document.querySelectorAll("[data-bar]");
    if (bars.length && "IntersectionObserver" in window) {
        var bo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.style.width = entry.target.dataset.bar + "%";
                bo.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        bars.forEach(function (b) { bo.observe(b); });
    }

    /* ---- projects slider (desktop transform / mobile native scroll) ---- */
    var track = document.getElementById("projTrack");
    var viewport = document.getElementById("projViewport");
    var projIndex = 0;
    function perView() {
        if (window.innerWidth < 768) return 1;
        return window.innerWidth < 1200 ? 2 : 3;
    }
    function maxIndex() {
        if (!track) return 0;
        return Math.max(0, track.children.length - perView());
    }
    function renderProjects() {
        if (!track || window.innerWidth < 768) return;
        projIndex = Math.min(projIndex, maxIndex());
        var card = track.children[0];
        var step = card.getBoundingClientRect().width + 22;
        track.style.transform = "translateX(" + -projIndex * step + "px)";
    }
    function move(dir) { projIndex = Math.min(Math.max(projIndex + dir, 0), maxIndex()); renderProjects(); }
    var pPrev = document.getElementById("projPrev");
    var pNext = document.getElementById("projNext");
    if (pPrev) pPrev.addEventListener("click", function () { move(-1); });
    if (pNext) pNext.addEventListener("click", function () { move(1); });
    window.addEventListener("resize", renderProjects);
    renderProjects();

    /* touch swipe on projects (desktop-style track) */
    if (viewport && track) {
        var sx = null;
        viewport.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
        viewport.addEventListener("touchend", function (e) {
            if (sx === null || window.innerWidth < 768) return;
            var dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
            sx = null;
        }, { passive: true });
    }

    /* ---- testimonials slider ---- */
    var tTrack = document.getElementById("testTrack");
    var tSlider = document.getElementById("testSlider");
    if (tTrack && tSlider) {
        var ti = 0, total = tTrack.children.length, timer = null;
        function renderT() { tTrack.style.transform = "translateX(" + -ti * 100 + "%)"; }
        function go(dir) { ti = (ti + dir + total) % total; renderT(); }
        document.getElementById("testPrev").addEventListener("click", function () { go(-1); restart(); });
        document.getElementById("testNext").addEventListener("click", function () { go(1); restart(); });
        function start() { if (!reduce) timer = setInterval(function () { go(1); }, 5500); }
        function stop() { clearInterval(timer); }
        function restart() { stop(); start(); }
        tSlider.addEventListener("mouseenter", stop);
        tSlider.addEventListener("mouseleave", start);
        var tsx = null;
        tSlider.addEventListener("touchstart", function (e) { tsx = e.touches[0].clientX; stop(); }, { passive: true });
        tSlider.addEventListener("touchend", function (e) {
            if (tsx === null) return;
            var dx = e.changedTouches[0].clientX - tsx;
            if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
            tsx = null; start();
        }, { passive: true });
        renderT(); start();
    }

    /* ---- subtle parallax ---- */
    var pxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    function parallax() {
        if (reduce || window.innerWidth < 768 || !pxEls || !pxEls.length) return;
        var vh = window.innerHeight;
        pxEls.forEach(function (el) {
            var box = el.parentElement.getBoundingClientRect();
            if (box.bottom < 0 || box.top > vh) return;
            var progress = (box.top + box.height / 2 - vh / 2) / vh;
            el.style.transform = "translate3d(0," + (progress * -28).toFixed(2) + "px,0)";
        });
    }

    /* ---- video CTA ---- */
    var playBtn = document.getElementById("playBtn");
    if (playBtn) {
        playBtn.addEventListener("click", function () {
            playBtn.setAttribute("aria-label", "Studio film coming soon");
            playBtn.textContent = "\u2713";
            setTimeout(function () { playBtn.innerHTML = "&#9654;"; playBtn.setAttribute("aria-label", "Play studio film"); }, 1800);
        });
    }

    /* ---- contact form ---- */
    var form = document.getElementById("contactForm");
    var msg = document.getElementById("formMsg");
    if (form && msg) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var data = new FormData(form);
            var name = String(data.get("name") || "").trim();
            var email = String(data.get("email") || "").trim();
            if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
                msg.textContent = "Please add your name and a valid email address.";
                return;
            }
            msg.textContent = "Thank you, " + name + ". We'll be in touch within one business day.";
            form.reset();
        });
    }

    /* ---- newsletter ---- */
    var news = document.getElementById("newsForm");
    var newsMsg = document.getElementById("newsMsg");
    if (news && newsMsg) {
        news.addEventListener("submit", function (e) {
            e.preventDefault();
            var val = document.getElementById("newsEmail").value.trim();
            if (!/^\S+@\S+\.\S+$/.test(val)) { newsMsg.textContent = "Please enter a valid email address."; return; }
            newsMsg.textContent = "You're subscribed. Welcome to the Antra journal.";
            news.reset();
        });
    }

    /* ---- active nav link ---- */
    var sections = ["home", "about", "projects", "services", "process", "contact"]
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
        var links = document.querySelectorAll(".nav-links a");
        var ao = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (l) {
                    l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id);
                });
            });
        }, { threshold: 0.4 });
        sections.forEach(function (s) { ao.observe(s); });
    }
})();