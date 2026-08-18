/* =========================================================
   INTERIOR DESIGN NAVBAR
========================================================= */

(function () {

    "use strict";

    const header = document.getElementById("idcHeader");
    const menuToggle = document.getElementById("idcMenuToggle");
    const mobileMenu = document.getElementById("idcMobileMenu");
    const mobileOverlay = document.getElementById("idcMobileOverlay");
    const mobileClose = document.getElementById("idcMobileClose");
    const mobileLinks = document.querySelectorAll(".idc-mobile-link");

    if (!header) {
        return;
    }


    /* ================================
       SCROLL HEADER
    ================================= */

    function updateHeader() {

        if (window.scrollY > 30) {
            header.classList.add("idc-scrolled");
        } else {
            header.classList.remove("idc-scrolled");
        }

    }

    updateHeader();

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );


    /* ================================
       OPEN MOBILE MENU
    ================================= */

    function openMobileMenu() {

        if (!mobileMenu || !mobileOverlay) {
            return;
        }

        mobileMenu.classList.add("idc-open");
        mobileOverlay.classList.add("idc-open");

        document.body.classList.add("idc-menu-active");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close menu");
        }

    }


    /* ================================
       CLOSE MOBILE MENU
    ================================= */

    function closeMobileMenu() {

        if (!mobileMenu || !mobileOverlay) {
            return;
        }

        mobileMenu.classList.remove("idc-open");
        mobileOverlay.classList.remove("idc-open");

        document.body.classList.remove("idc-menu-active");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open menu");
        }

    }


    /* ================================
       EVENTS
    ================================= */

    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            function () {

                if (mobileMenu.classList.contains("idc-open")) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }

            }
        );

    }


    if (mobileClose) {

        mobileClose.addEventListener(
            "click",
            closeMobileMenu
        );

    }


    if (mobileOverlay) {

        mobileOverlay.addEventListener(
            "click",
            closeMobileMenu
        );

    }


    /* Close when navigation item is clicked */

    mobileLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            closeMobileMenu
        );

    });


    /* Close with Escape */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeMobileMenu();
            }

        }
    );

})();
/* =========================================================
   fOOTER INTERIOR DESIGN FOOTER
========================================================= */

(function () {

    "use strict";

    const yearElement =
        document.getElementById("idcCurrentYear");

    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

})();