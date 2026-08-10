/* =========================================================
   LITTLE BIG HOME INTERIORS
   100+ PROJECT GALLERY
   LOCAL ASSETS ONLY
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       SETTINGS
    ===================================================== */

    var BASE = "/assets/image/";

    var TOTAL_PROJECTS = 100;

    var PER_PAGE = 12;


    /* =====================================================
       GALLERY ELEMENTS
    ===================================================== */

    var grid = document.getElementById("lbhgGrid");

    var emptyMsg = document.getElementById("lbhgEmpty");

    var loadMoreBtn =
        document.getElementById("lbhgLoadMore");

    var filterBtns =
        Array.prototype.slice.call(
            document.querySelectorAll(
                ".lbhg-filter-btn"
            )
        );


    /* =====================================================
       STOP IF GALLERY DOES NOT EXIST
    ===================================================== */

    if (!grid) {
        return;
    }


    /* =====================================================
       PROJECT CATEGORIES
       
       Automatically distributes projects across
       your existing filter categories.
       
       You can later replace these with actual
       project-specific categories.
    ===================================================== */

    var categories = [
        "residential",
        "living",
        "bedroom",
        "kitchen",
        "commercial",
        "office"
    ];


    var categoryLabels = {
        residential: "Residential",
        living: "Living Space",
        bedroom: "Bedroom",
        kitchen: "Kitchen",
        commercial: "Commercial",
        office: "Office"
    };


    /* =====================================================
       PROJECT TITLES
    ===================================================== */

    var titleTemplates = {
        residential: "Contemporary Residence",
        living: "Refined Living Space",
        bedroom: "Quiet Luxury Bedroom",
        kitchen: "Contemporary Kitchen",
        commercial: "Modern Commercial Space",
        office: "Executive Workspace"
    };


    /* =====================================================
       PROJECT DESCRIPTIONS
    ===================================================== */

    var descriptionTemplates = {

        residential:
            "A thoughtfully designed residential interior shaped by refined materials, balanced proportions and timeless detailing.",

        living:
            "A sophisticated living space combining warm textures, elegant furniture and carefully considered lighting.",

        bedroom:
            "A calm and comfortable bedroom designed around softness, proportion and understated luxury.",

        kitchen:
            "A functional kitchen where refined materials, practical planning and contemporary detailing come together.",

        commercial:
            "A sophisticated commercial interior designed to create a strong identity, comfort and lasting impression.",

        office:
            "A refined workspace designed for productivity, collaboration and a distinctive professional experience."

    };


    /* =====================================================
       RATIO PATTERN
    ===================================================== */

    var ratios = [
        "tall",
        "medium",
        "short",
        "medium",
        "tall",
        "short"
    ];


    /* =====================================================
       GENERATE 100+ PROJECTS
    ===================================================== */

    var ITEMS = [];


    for (var i = 1; i <= TOTAL_PROJECTS; i++) {

        var category =
            categories[(i - 1) % categories.length];

        var ratio =
            ratios[(i - 1) % ratios.length];


        ITEMS.push({

            file:
                "image (" + i + ").jpeg",

            cat:
                category,

            label:
                categoryLabels[category],

            title:
                titleTemplates[category] +
                " " +
                String(i).padStart(2, "0"),

            desc:
                descriptionTemplates[category],

            alt:
                categoryLabels[category] +
                " interior design project " +
                i,

            ratio:
                ratio

        });

    }


    /* =====================================================
       STATE
    ===================================================== */

    var activeFilter = "all";

    var visibleCount = PER_PAGE;

    var nodes = [];

    var currentIndex = 0;

    var lastFocused = null;


    /* =====================================================
       INTERSECTION OBSERVER
    ===================================================== */

    var revealObserver = null;


    if ("IntersectionObserver" in window) {

        revealObserver =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry, index) {

                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }


                            var element =
                                entry.target;


                            setTimeout(
                                function () {

                                    element.classList.add(
                                        "is-visible"
                                    );

                                },
                                index * 60
                            );


                            revealObserver.unobserve(
                                element
                            );

                        }
                    );

                },
                {
                    threshold: 0.12,

                    rootMargin:
                        "0px 0px -8% 0px"
                }
            );

    }


    /* =====================================================
       BUILD GALLERY
    ===================================================== */

    ITEMS.forEach(
        function (item, index) {

            var el =
                document.createElement("button");


            el.type =
                "button";


            el.className =
                "lbhg-item gallery-reveal";


            el.setAttribute(
                "data-lbhg-category",
                item.cat
            );


            el.setAttribute(
                "data-lbhg-ratio",
                item.ratio
            );


            el.setAttribute(
                "data-lbhg-index",
                String(index)
            );


            el.setAttribute(
                "aria-label",
                "Open " +
                item.title +
                " in gallery viewer"
            );


            /* IMAGE */

            var img =
                document.createElement("img");


            img.className =
                "lbhg-item-image";


            img.src =
                BASE + item.file;


            img.alt =
                item.alt;


            img.loading =
                "lazy";


            img.decoding =
                "async";


            /*
             * If local image does not exist,
             * hide that particular card.
             *
             * No external fallback.
             */

            img.addEventListener(
                "error",
                function () {

                    el.classList.add(
                        "lbhg-image-error"
                    );

                }
            );


            /* OVERLAY */

            var overlay =
                document.createElement("span");


            overlay.className =
                "lbhg-item-overlay";


            /* CONTENT */

            var content =
                document.createElement("span");


            content.className =
                "lbhg-item-content";


            content.innerHTML =

                '<span class="lbhg-item-category">' +
                item.label +
                "</span>" +

                '<span class="lbhg-item-title">' +
                item.title +
                "</span>" +

                '<span class="lbhg-item-desc">' +
                item.desc +
                "</span>";


            /* APPEND */

            el.appendChild(img);

            el.appendChild(overlay);

            el.appendChild(content);


            /* LIGHTBOX */

            el.addEventListener(
                "click",
                function () {

                    openLightbox(index);

                }
            );


            grid.appendChild(el);

            nodes.push(el);

        }
    );


    /* =====================================================
       FIND MATCHING ITEMS
    ===================================================== */

    function matching() {

        return nodes.filter(
            function (node) {

                return (

                    activeFilter === "all" ||

                    node.getAttribute(
                        "data-lbhg-category"
                    ) === activeFilter

                );

            }
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render(animate) {

        var list =
            matching();


        /* Hide all */

        nodes.forEach(
            function (node) {

                node.classList.add(
                    "is-hidden"
                );

            }
        );


        /* Show visible items */

        list
            .slice(
                0,
                visibleCount
            )
            .forEach(
                function (node, index) {

                    node.classList.remove(
                        "is-hidden",
                        "is-leaving"
                    );


                    if (animate) {

                        node.classList.add(
                            "is-entering"
                        );


                        setTimeout(
                            function () {

                                node.classList.remove(
                                    "is-entering"
                                );

                            },
                            50 +
                            index * 50
                        );

                    }


                    if (revealObserver) {

                        revealObserver.observe(
                            node
                        );

                    }

                }
            );


        /* Empty message */

        if (emptyMsg) {

            emptyMsg.hidden =
                list.length !== 0;

        }


        /* Load More */

        if (loadMoreBtn) {

            loadMoreBtn.hidden =
                visibleCount >= list.length;

        }

    }


    /* =====================================================
       FILTER BUTTONS
    ===================================================== */

    filterBtns.forEach(
        function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    var next =
                        btn.getAttribute(
                            "data-lbhg-filter"
                        );


                    if (
                        next ===
                        activeFilter
                    ) {
                        return;
                    }


                    /* Active state */

                    filterBtns.forEach(
                        function (button) {

                            var isActive =
                                button === btn;


                            button.classList.toggle(
                                "is-current",
                                isActive
                            );


                            button.setAttribute(
                                "aria-pressed",
                                isActive
                                    ? "true"
                                    : "false"
                            );

                        }
                    );


                    /* Leaving animation */

                    nodes.forEach(
                        function (node) {

                            if (
                                !node.classList.contains(
                                    "is-hidden"
                                )
                            ) {

                                node.classList.add(
                                    "is-leaving"
                                );

                            }

                        }
                    );


                    setTimeout(
                        function () {

                            activeFilter =
                                next;

                            visibleCount =
                                PER_PAGE;

                            render(true);

                        },
                        280
                    );

                }
            );

        }
    );


    /* =====================================================
       LOAD MORE
    ===================================================== */

    if (loadMoreBtn) {

        loadMoreBtn.addEventListener(
            "click",
            function () {

                visibleCount +=
                    PER_PAGE;


                render(true);

            }
        );

    }


    /* =====================================================
       LIGHTBOX ELEMENTS
    ===================================================== */

    var lightbox =
        document.getElementById(
            "lbhgLightbox"
        );


    var lbImage =
        document.getElementById(
            "lbhgLightboxImage"
        );


    var lbCat =
        document.getElementById(
            "lbhgLightboxCategory"
        );


    var lbTitle =
        document.getElementById(
            "lbhgLightboxTitle"
        );


    var lbDesc =
        document.getElementById(
            "lbhgLightboxDesc"
        );


    /* =====================================================
       LIGHTBOX CHECK
    ===================================================== */

    if (!lightbox) {

        render(false);

        return;

    }


    /* =====================================================
       GET VISIBLE PROJECT INDEXES
    ===================================================== */

    function visibleItems() {

        return matching()

            .slice(
                0,
                visibleCount
            )

            .map(
                function (node) {

                    return parseInt(
                        node.getAttribute(
                            "data-lbhg-index"
                        ),
                        10
                    );

                }
            );

    }


    /* =====================================================
       PAINT LIGHTBOX
    ===================================================== */

    function paint(index) {

        var item =
            ITEMS[index];


        if (!item) {
            return;
        }


        lbImage.classList.add(
            "is-swapping"
        );


        setTimeout(
            function () {

                lbImage.src =
                    BASE + item.file;


                lbImage.alt =
                    item.alt;


                lbCat.textContent =
                    item.label;


                lbTitle.textContent =
                    item.title;


                lbDesc.textContent =
                    item.desc;


                lbImage.classList.remove(
                    "is-swapping"
                );

            },
            180
        );

    }


    /* =====================================================
       OPEN LIGHTBOX
    ===================================================== */

    function openLightbox(index) {

        var item =
            ITEMS[index];


        if (!item) {
            return;
        }


        lastFocused =
            document.activeElement;


        currentIndex =
            index;


        lbImage.src =
            BASE + item.file;


        lbImage.alt =
            item.alt;


        lbCat.textContent =
            item.label;


        lbTitle.textContent =
            item.title;


        lbDesc.textContent =
            item.desc;


        lightbox.hidden =
            false;


        document.body.classList.add(
            "lbhg-no-scroll"
        );


        requestAnimationFrame(
            function () {

                lightbox.classList.add(
                    "is-open"
                );

            }
        );


        var closeBtn =
            lightbox.querySelector(
                ".lbhg-lightbox-close"
            );


        if (closeBtn) {

            closeBtn.focus();

        }

    }


    /* =====================================================
       CLOSE LIGHTBOX
    ===================================================== */

    function closeLightbox() {

        lightbox.classList.remove(
            "is-open"
        );


        document.body.classList.remove(
            "lbhg-no-scroll"
        );


        setTimeout(
            function () {

                lightbox.hidden =
                    true;

            },
            380
        );


        if (
            lastFocused &&
            typeof lastFocused.focus ===
                "function"
        ) {

            lastFocused.focus();

        }

    }


    /* =====================================================
       PREVIOUS / NEXT
    ===================================================== */

    function step(direction) {

        var list =
            visibleItems();


        if (!list.length) {
            return;
        }


        var position =
            list.indexOf(
                currentIndex
            );


        if (position === -1) {

            position = 0;

        }


        position =
            (
                position +
                direction +
                list.length
            ) %
            list.length;


        currentIndex =
            list[position];


        paint(
            currentIndex
        );

    }


    /* =====================================================
       CLOSE BUTTONS
    ===================================================== */

    Array.prototype.forEach.call(
        lightbox.querySelectorAll(
            "[data-lbhg-close]"
        ),
        function (element) {

            element.addEventListener(
                "click",
                closeLightbox
            );

        }
    );


    /* =====================================================
       PREVIOUS BUTTON
    ===================================================== */

    var prevBtn =
        lightbox.querySelector(
            ".lbhg-lightbox-prev"
        );


    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            function () {

                step(-1);

            }
        );

    }


    /* =====================================================
       NEXT BUTTON
    ===================================================== */

    var nextBtn =
        lightbox.querySelector(
            ".lbhg-lightbox-next"
        );


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            function () {

                step(1);

            }
        );

    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (lightbox.hidden) {
                return;
            }


            if (
                event.key ===
                "Escape"
            ) {

                closeLightbox();

            }


            else if (
                event.key ===
                "ArrowLeft"
            ) {

                step(-1);

            }


            else if (
                event.key ===
                "ArrowRight"
            ) {

                step(1);

            }

        }
    );


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    render(false);


})();