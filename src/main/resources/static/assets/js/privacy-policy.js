(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Smooth anchor scrolling */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
            var el = document.getElementById(a.getAttribute("href").slice(1));
            if (!el) return;
            e.preventDefault();
            el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
            history.replaceState(null, "", a.getAttribute("href"));
            el.setAttribute("tabindex", "-1");
            el.focus({ preventScroll: true });
        });
    });

    /* Reveal on enter */
    var reveals = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
        reveals.forEach(function (n) { n.classList.add("in"); });
    } else {
        var ro = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        reveals.forEach(function (n) { ro.observe(n); });
    }

    /* Active index link */
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
    var sections = links
        .map(function (l) { return document.getElementById(l.getAttribute("href").slice(1)); })
        .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
        var so = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (l) {
                    l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id);
                });
            });
        }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
        sections.forEach(function (s) { so.observe(s); });
    }
})();
