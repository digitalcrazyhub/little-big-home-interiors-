/* =========================================================
   LITTLE BIG HOME INTERIORS
   NAVBAR JAVASCRIPT

   Features:
   ✓ Transparent navbar on Home
   ✓ Dark navbar on scroll
   ✓ Active section highlighting
   ✓ Smooth scrolling
   ✓ Mobile 70% drawer
   ✓ Burger -> X
   ✓ Click outside -> close
   ✓ ESC -> close
   ✓ Body scroll lock
   ✓ Gallery link works normally
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =================================================
           ELEMENTS
        ================================================= */

        const lbhNav =
            document.getElementById("lbhNav");


        const lbhBurger =
            document.getElementById("lbhBurger");


        const lbhMobile =
            document.getElementById("lbhMobile");


        const lbhDesktopLinks =
            document.querySelectorAll(
                ".lbh-menu-link"
            );


        const lbhMobileLinks =
            document.querySelectorAll(
                ".lbh-mobile-link"
            );


        const lbhAllLinks =
            document.querySelectorAll(
                ".lbh-menu-link, .lbh-mobile-link"
            );


        const lbhSections =
            document.querySelectorAll(
                "main section[id]"
            );



        /* =================================================
           NAVBAR SCROLL BACKGROUND
        ================================================= */

        function lbhUpdateNavbar() {

            if (!lbhNav) return;


            if (window.scrollY > 60) {

                lbhNav.classList.add(
                    "lbh-scrolled"
                );

            } else {

                lbhNav.classList.remove(
                    "lbh-scrolled"
                );

            }

        }


        window.addEventListener(
            "scroll",
            lbhUpdateNavbar,
            {
                passive: true
            }
        );


        lbhUpdateNavbar();



        /* =================================================
           SET ACTIVE NAV
        ================================================= */

        function lbhSetActive(
            targetId
        ) {

            if (!targetId) return;


            lbhAllLinks.forEach(
                function (link) {

                    link.classList.remove(
                        "lbh-active"
                    );

                }
            );


            lbhAllLinks.forEach(
                function (link) {

                    const href =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        href === targetId
                    ) {

                        link.classList.add(
                            "lbh-active"
                        );

                    }

                }
            );

        }



        /* =================================================
           SMOOTH SCROLL
        ================================================= */

        function lbhScrollToSection(
            targetId
        ) {

            const target =
                document.querySelector(
                    targetId
                );


            if (!target) return;


            const navHeight =
                lbhNav
                    ? lbhNav.offsetHeight
                    : 0;


            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                navHeight;


            window.scrollTo({

                top:
                targetPosition,

                behavior:
                    "smooth"

            });

        }



        /* =================================================
           DESKTOP NAV CLICK
        ================================================= */

        lbhDesktopLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        const targetId =
                            this.getAttribute(
                                "href"
                            );


                        /*
                         * Normal page links
                         * such as Gallery.
                         */

                        if (
                            !targetId ||
                            !targetId.startsWith("#") ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        event.preventDefault();


                        lbhSetActive(
                            targetId
                        );


                        lbhScrollToSection(
                            targetId
                        );

                    }
                );

            }
        );



        /* =================================================
           OPEN MOBILE
        ================================================= */

        function lbhOpenMobile() {

            if (
                !lbhMobile ||
                !lbhBurger
            ) {

                return;

            }


            lbhMobile.classList.add(
                "lbh-open"
            );


            lbhBurger.classList.add(
                "lbh-open"
            );


            lbhBurger.setAttribute(
                "aria-expanded",
                "true"
            );


            lbhBurger.setAttribute(
                "aria-label",
                "Close navigation menu"
            );


            lbhMobile.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.classList.add(
                "lbh-no-scroll"
            );

        }



        /* =================================================
           CLOSE MOBILE
        ================================================= */

        function lbhCloseMobile() {

            if (
                !lbhMobile ||
                !lbhBurger
            ) {

                return;

            }


            lbhMobile.classList.remove(
                "lbh-open"
            );


            lbhBurger.classList.remove(
                "lbh-open"
            );


            lbhBurger.setAttribute(
                "aria-expanded",
                "false"
            );


            lbhBurger.setAttribute(
                "aria-label",
                "Open navigation menu"
            );


            lbhMobile.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.classList.remove(
                "lbh-no-scroll"
            );

        }



        /* =================================================
           BURGER CLICK
        ================================================= */

        if (lbhBurger) {

            lbhBurger.addEventListener(
                "click",
                function () {


                    const isOpen =
                        lbhMobile.classList.contains(
                            "lbh-open"
                        );


                    if (isOpen) {

                        lbhCloseMobile();

                    } else {

                        lbhOpenMobile();

                    }

                }
            );

        }



        /* =================================================
           MOBILE LINKS
        ================================================= */

        lbhMobileLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        const targetId =
                            this.getAttribute(
                                "href"
                            );


                        /*
                         * Gallery or other page
                         * links work normally.
                         */

                        if (
                            !targetId ||
                            !targetId.startsWith("#") ||
                            targetId === "#"
                        ) {

                            lbhCloseMobile();

                            return;

                        }


                        event.preventDefault();


                        lbhSetActive(
                            targetId
                        );


                        lbhCloseMobile();


                        setTimeout(
                            function () {

                                lbhScrollToSection(
                                    targetId
                                );

                            },
                            120
                        );

                    }
                );

            }
        );



        /* =================================================
           CLICK OUTSIDE DRAWER
        ================================================= */

        if (lbhMobile) {

            lbhMobile.addEventListener(
                "click",
                function (event) {


                    const clickedPanel =
                        event.target.closest(
                            ".lbh-mobile-nav"
                        );


                    /*
                     * If user clicks the
                     * 30% dark overlay.
                     */

                    if (!clickedPanel) {

                        lbhCloseMobile();

                    }

                }
            );

        }



        /* =================================================
           ESCAPE KEY
        ================================================= */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    lbhCloseMobile();

                }

            }
        );



        /* =================================================
           CLOSE ON RESIZE
        ================================================= */

        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 800
                ) {

                    lbhCloseMobile();

                }

            }
        );



        /* =================================================
           ACTIVE SECTION DETECTION
        ================================================= */

        function lbhDetectActiveSection() {

            if (
                !lbhSections.length
            ) {

                return;

            }


            const navHeight =
                lbhNav
                    ? lbhNav.offsetHeight
                    : 0;


            const trigger =
                navHeight + 120;


            let currentSection =
                null;


            let closestDistance =
                Infinity;


            lbhSections.forEach(
                function (section) {

                    const rect =
                        section.getBoundingClientRect();


                    /*
                     * Section is crossing
                     * the active detection line.
                     */

                    if (
                        rect.top <= trigger &&
                        rect.bottom > trigger
                    ) {


                        const distance =
                            Math.abs(
                                rect.top -
                                trigger
                            );


                        if (
                            distance <
                            closestDistance
                        ) {

                            closestDistance =
                                distance;

                            currentSection =
                                section;

                        }

                    }

                }
            );


            if (
                currentSection
            ) {

                lbhSetActive(
                    "#" +
                    currentSection.id
                );

            }

        }



        /* =================================================
           ACTIVE SECTION ON SCROLL
        ================================================= */

        let lbhScrollTick =
            false;


        window.addEventListener(
            "scroll",
            function () {


                if (!lbhScrollTick) {


                    window.requestAnimationFrame(
                        function () {


                            lbhDetectActiveSection();


                            lbhScrollTick =
                                false;

                        }
                    );


                    lbhScrollTick =
                        true;

                }

            },
            {
                passive: true
            }
        );



        /* =================================================
           INTERSECTION OBSERVER
        ================================================= */

        if (
            "IntersectionObserver"
            in window
        ) {


            const lbhObserver =
                new IntersectionObserver(
                    function (entries) {


                        let visibleSection =
                            null;


                        let highestVisibility =
                            0;


                        entries.forEach(
                            function (entry) {


                                if (
                                    entry.isIntersecting &&
                                    entry.intersectionRatio >
                                    highestVisibility
                                ) {

                                    highestVisibility =
                                        entry.intersectionRatio;

                                    visibleSection =
                                        entry.target;

                                }

                            }
                        );


                        if (
                            visibleSection
                        ) {

                            lbhSetActive(
                                "#" +
                                visibleSection.id
                            );

                        }

                    },
                    {

                        root: null,

                        rootMargin:
                            "-15% 0px -55% 0px",

                        threshold: [
                            0.1,
                            0.2,
                            0.4,
                            0.6
                        ]

                    }
                );


            lbhSections.forEach(
                function (section) {

                    lbhObserver.observe(
                        section
                    );

                }
            );

        }



        /* =================================================
           INITIAL ACTIVE
        ================================================= */

        function lbhInitialActive() {


            if (
                window.scrollY < 100
            ) {

                lbhSetActive(
                    "#home"
                );

            } else {

                lbhDetectActiveSection();

            }

        }


        lbhInitialActive();


    }
);
