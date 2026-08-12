/**
 * LITTLE BIG HOME INTERIORS
 * Dynamic Gallery Frontend
 *
 * Backend APIs:
 * GET  /api/gallery
 * POST /api/gallery
 * DELETE /api/gallery/{id}
 * GET  /api/categories
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 *
 * No IndexedDB.
 * No frontend password.
 * No demo gallery records.
 */
"use strict";

const API = {
    gallery: "/api/gallery",
    categories: "/api/categories",
    login: "/api/auth/login",
    me: "/api/auth/me",
    logout: "/api/auth/logout"
};

const App = (() => {

    const PAGE_SIZE = 6;
    // =====================================================
    // IMAGE UPLOAD LIMIT
    // =====================================================

    // Maximum image file size = 2 MB
    // No minimum file size
    // No width restriction
    // No height restriction
    const MAX_BYTES = 2 * 1024 * 1024;
    const MAX_WORDS = 150;
    const MAX_TITLE = 100;
    let records = [];
    let categories = [];
    let activeCategory = "All";
    let visible = PAGE_SIZE;
    let loading = true;
    let session = {
        isAuthenticated: false,
        username: null
    };

    let pickedFile = null;
    let pickedPreviewUrl = "";
    let pendingDelete = null;
    let lightboxRecords = [];
    let lightboxIndex = null;
    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const el = {
        tabs: document.getElementById("gal-tabs"),
        results: document.getElementById("gal-results"),
        uploadCta: document.getElementById("gal-upload-cta"),
        userSlot: document.getElementById("gal-user-slot"),
        // -------------------------------------------------
        // LOGIN
        // -------------------------------------------------
        loginOverlay: document.getElementById("gal-login-overlay"),
        loginDialog: document.getElementById("gal-login-dialog"),
        loginForm: document.getElementById("gal-login-form"),
        loginUser: document.getElementById("gal-login-user"),
        loginPass: document.getElementById("gal-login-pass"),
        loginPassToggle: document.getElementById("gal-login-pass-toggle"),
        loginUserErr: document.getElementById("gal-login-user-err"),
        loginPassErr: document.getElementById("gal-login-pass-err"),
        loginError: document.getElementById("gal-login-error"),
        loginClose: document.getElementById("gal-login-close"),
        loginCancel: document.getElementById("gal-login-cancel"),
        loginSubmit: document.getElementById("gal-login-submit"),

        // -------------------------------------------------
        // UPLOAD MODAL
        // -------------------------------------------------

        modalOverlay: document.getElementById("gal-modal-overlay"),
        modalDialog: document.getElementById("gal-modal-dialog"),
        modalTitle: document.getElementById("gal-modal-title"),
        modalClose: document.getElementById("gal-modal-close"),
        uploadForm: document.getElementById("gal-upload-form"),
        drop: document.getElementById("gal-drop"),
        fileInput: document.getElementById("gal-file-input"),
        fileErr: document.getElementById("gal-file-err"),
        fileMissingErr: document.getElementById("gal-file-missing-err"),
        filecard: document.getElementById("gal-filecard"),
        fcName: document.getElementById("gal-fc-name"),
        fcSize: document.getElementById("gal-fc-size"),
        fcDims: document.getElementById("gal-fc-dims"),
        fcReplace:
            document.getElementById("gal-fc-replace"),

        title:
            document.getElementById("gal-title"),

        titleErr:
            document.getElementById("gal-title-err"),

        titleCount:
            document.getElementById("gal-title-count"),

        desc:
            document.getElementById("gal-desc"),

        descErr:
            document.getElementById("gal-desc-err"),

        descCount:
            document.getElementById("gal-desc-count"),

        category:
            document.getElementById("gal-category"),

        categoryErr:
            document.getElementById("gal-category-err"),

        uploadSubmit:
            document.getElementById("gal-upload-submit"),

        previewFrame:
            document.getElementById("gal-preview-frame"),

        previewEmpty:
            document.getElementById("gal-preview-empty"),

        previewImg:
            document.getElementById("gal-preview-img"),

        // -------------------------------------------------
        // DELETE CONFIRMATION
        // -------------------------------------------------

        confirmOverlay:
            document.getElementById("gal-confirm-overlay"),

        confirmCancel:
            document.getElementById("gal-confirm-cancel"),

        confirmOk:
            document.getElementById("gal-confirm-ok"),

        // -------------------------------------------------
        // LIGHTBOX
        // -------------------------------------------------

        lightbox:
            document.getElementById("gal-lightbox"),

        // -------------------------------------------------
        // TOAST
        // -------------------------------------------------

        toasts:
            document.getElementById("gal-toasts")
    };


    // =====================================================
    // CHECK ADMIN
    // =====================================================

    function isAdmin() {

        return session.isAuthenticated === true;

    }


    // =====================================================
    // TOAST MESSAGE
    // =====================================================

    function toast(message, tone = "success") {

        if (!el.toasts) {
            return;
        }

        const node = document.createElement("div");

        node.className =
            `gal-toast gal-toast--${tone}`;


        const dot = document.createElement("span");

        dot.className =
            "gal-toast__dot";

        dot.setAttribute(
            "aria-hidden",
            "true"
        );


        const text = document.createElement("p");

        text.textContent =
            message;


        const close = document.createElement("button");

        close.type = "button";

        close.className =
            "gal-toast__close";

        close.setAttribute(
            "aria-label",
            "Dismiss notification"
        );

        close.textContent = "×";


        close.addEventListener(
            "click",
            () => node.remove()
        );


        node.append(
            dot,
            text,
            close
        );


        el.toasts.appendChild(node);


        window.setTimeout(
            () => node.remove(),
            4000
        );
    }


    // =====================================================
    // API HELPER
    // =====================================================

    async function api(url, options = {}) {

        const response = await fetch(
            url,
            {
                credentials: "same-origin",
                ...options
            }
        );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data = null;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data = await response.json();

        } else {

            const raw =
                await response.text();


            try {

                data =
                    raw
                        ? JSON.parse(raw)
                        : null;

            } catch {

                data = raw;

            }
        }


        if (!response.ok) {

            let message =
                `Request failed (${response.status}).`;


            if (
                data &&
                typeof data === "object"
            ) {

                message =
                    data.message ||
                    data.error ||
                    message;

            } else if (
                typeof data === "string" &&
                data.trim()
            ) {

                message = data;

            }


            const error =
                new Error(message);


            error.status =
                response.status;


            throw error;
        }


        return data;
    }


    // =====================================================
    // CHECK LOGIN SESSION
    // =====================================================

    async function checkSession() {

        try {

            const data =
                await api(API.me);


            session = {

                isAuthenticated:
                    data?.authenticated === true,

                username:
                    data?.username || null

            };

        } catch {

            session = {

                isAuthenticated: false,

                username: null

            };
        }


        renderUserSlot();
    }


    // =====================================================
    // LOAD CATEGORIES
    // =====================================================

    async function loadCategories() {

        const data =
            await api(API.categories);


        categories =
            Array.isArray(data)
                ? data
                : [];


        renderCategorySelect();
    }


    // =====================================================
    // LOAD GALLERY
    // =====================================================

    async function loadGallery() {

        const data =
            await api(API.gallery);


        records =
            Array.isArray(data)
                ? data
                : [];


        loading = false;


        renderAll();
    }


    // =====================================================
    // CATEGORY SELECT
    // =====================================================

    function renderCategorySelect() {

        if (!el.category) {
            return;
        }


        const selected =
            el.category.value;


        el.category.innerHTML =
            '<option value="">Select a category</option>';


        categories.forEach(
            (category) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(category.id);


                option.textContent =
                    category.name;


                el.category.appendChild(
                    option
                );

            }
        );


        if (selected) {

            el.category.value =
                selected;

        }
    }


    // =====================================================
    // GET CATEGORY NAME
    // =====================================================

    function categoryName(record) {

        return (
            record?.category?.name ||
            ""
        );

    }


    // =====================================================
    // GET ALL CATEGORIES
    // =====================================================

    function getCategories() {

        const names =
            categories

                .map(
                    category =>
                        category.name
                )

                .filter(Boolean);


        records.forEach(
            record => {

                const name =
                    categoryName(record);


                if (
                    name &&
                    !names.includes(name)
                ) {

                    names.push(name);

                }

            }
        );


        return [
            "All",
            ...names
        ];
    }


    // =====================================================
    // FILTER GALLERY
    // =====================================================

    function getFiltered() {

        if (
            activeCategory === "All"
        ) {

            return records;

        }


        return records.filter(
            record =>
                categoryName(record) ===
                activeCategory
        );
    }


    // =====================================================
    // RENDER ALL
    // =====================================================

    function renderAll() {

        renderTabs();

        renderResults();
    }


    // =====================================================
    // RENDER CATEGORY TABS
    // =====================================================

    function renderTabs() {

        if (!el.tabs) {
            return;
        }


        el.tabs.innerHTML = "";


        getCategories().forEach(
            category => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type = "button";


                button.setAttribute(
                    "role",
                    "tab"
                );


                button.setAttribute(
                    "aria-selected",
                    String(
                        activeCategory ===
                        category
                    )
                );


                button.className =
                    `gal-tab${
                        activeCategory === category
                            ? " is-active"
                            : ""
                    }`;


                button.textContent =
                    category;


                button.addEventListener(
                    "click",
                    () => {

                        activeCategory =
                            category;


                        visible =
                            PAGE_SIZE;


                        renderAll();

                    }
                );


                el.tabs.appendChild(
                    button
                );

            }
        );
    }


    // =====================================================
    // RENDER RESULTS
    // =====================================================

    function renderResults() {

        if (!el.results) {
            return;
        }


        el.results.innerHTML = "";


        if (loading) {

            const status =
                document.createElement(
                    "p"
                );


            status.className =
                "gal-status";


            status.textContent =
                "Loading gallery…";


            el.results.appendChild(
                status
            );


            return;
        }


        const filtered =
            getFiltered();


        const shown =
            filtered.slice(
                0,
                visible
            );


        // -------------------------------------------------
        // EMPTY GALLERY
        // -------------------------------------------------

        if (!shown.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "gal-empty";


            empty.innerHTML = `
                <h2 class="gal-empty__title">
                    NO IMAGES FOUND
                </h2>

                <p class="gal-empty__text">
                    There are currently no images in this category.
                </p>

                <button
                    type="button"
                    class="gal-btn gal-btn--ghost"
                >
                    View All Images
                </button>
            `;


            empty
                .querySelector("button")
                .addEventListener(
                    "click",
                    () => {

                        activeCategory =
                            "All";

                        visible =
                            PAGE_SIZE;

                        renderAll();

                    }
                );


            el.results.appendChild(
                empty
            );


            return;
        }


        // -------------------------------------------------
        // MASONRY
        // -------------------------------------------------

        const masonry =
            document.createElement(
                "div"
            );


        masonry.className =
            "gal-masonry";


        shown.forEach(
            (record, index) => {

                masonry.appendChild(
                    buildCard(
                        record,
                        index,
                        shown
                    )
                );

            }
        );


        el.results.appendChild(
            masonry
        );


        // -------------------------------------------------
        // LOAD MORE
        // -------------------------------------------------

        if (
            visible <
            filtered.length
        ) {

            const more =
                document.createElement(
                    "div"
                );


            more.className =
                "gal-more";


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "gal-btn gal-btn--outline";


            button.textContent =
                "LOAD MORE";


            button.addEventListener(
                "click",
                () => {

                    visible +=
                        PAGE_SIZE;

                    renderAll();

                }
            );


            more.appendChild(
                button
            );


            el.results.appendChild(
                more
            );
        }
    }


    // =====================================================
    // BUILD GALLERY CARD
    // =====================================================

    function buildCard(
        record,
        index,
        viewRecords
    ) {

        const figure =
            document.createElement(
                "figure"
            );


        figure.className =
            "gal-card";


        const media =
            document.createElement(
                "button"
            );


        media.type =
            "button";


        media.className =
            "gal-card__media";


        media.style.aspectRatio =
            "3 / 4";


        media.setAttribute(
            "aria-label",
            `Open ${
                record.title ||
                "image"
            } in full screen`
        );


        const src =
            record.imageUrl || "";


        if (src) {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                src;


            image.alt =
                record.title ||
                "Interior image";


            image.loading =
                "lazy";


            image.decoding =
                "async";


            media.appendChild(
                image
            );

        } else {

            const skeleton =
                document.createElement(
                    "span"
                );


            skeleton.className =
                "gal-card__skeleton";


            media.appendChild(
                skeleton
            );
        }


        const scrim =
            document.createElement(
                "span"
            );


        scrim.className =
            "gal-card__scrim";


        scrim.setAttribute(
            "aria-hidden",
            "true"
        );


        media.appendChild(
            scrim
        );


        const meta =
            document.createElement(
                "span"
            );


        meta.className =
            "gal-card__meta";


        const cat =
            document.createElement(
                "span"
            );


        cat.className =
            "gal-card__cat";


        cat.textContent =
            categoryName(record);


        const title =
            document.createElement(
                "span"
            );


        title.className =
            "gal-card__title";


        title.textContent =
            record.title || "";


        meta.append(
            cat,
            title
        );


        if (record.description) {

            const description =
                document.createElement(
                    "span"
                );


            description.className =
                "gal-card__desc";


            description.textContent =
                record.description;


            meta.appendChild(
                description
            );
        }


        media.appendChild(
            meta
        );


        media.addEventListener(
            "click",
            () => {

                openLightbox(
                    viewRecords,
                    index
                );

            }
        );


        figure.appendChild(
            media
        );


        // -------------------------------------------------
        // ADMIN DELETE
        // -------------------------------------------------

        if (isAdmin()) {

            const manage =
                document.createElement(
                    "div"
                );


            manage.className =
                "gal-card__manage";


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.textContent =
                "Delete";


            deleteButton.setAttribute(
                "aria-label",
                `Delete ${
                    record.title ||
                    "image"
                }`
            );


            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    requestDelete(
                        record
                    );

                }
            );


            manage.appendChild(
                deleteButton
            );


            figure.appendChild(
                manage
            );
        }


        // -------------------------------------------------
        // CAPTION
        // -------------------------------------------------

        const caption =
            document.createElement(
                "figcaption"
            );


        caption.className =
            "gal-card__caption";


        const captionTitle =
            document.createElement(
                "span"
            );


        captionTitle.className =
            "gal-card__caption-title";


        captionTitle.textContent =
            record.title || "";


        const captionCategory =
            document.createElement(
                "span"
            );


        captionCategory.className =
            "gal-card__caption-cat";


        captionCategory.textContent =
            categoryName(record);


        caption.append(
            captionTitle,
            captionCategory
        );


        figure.appendChild(
            caption
        );


        return figure;
    }


    // =====================================================
    // ADMIN USER DISPLAY
    // =====================================================

    function renderUserSlot() {

        if (!el.userSlot) {
            return;
        }


        el.userSlot.innerHTML = "";


        if (
            !isAdmin() ||
            !session.username
        ) {

            return;
        }


        const wrap =
            document.createElement(
                "div"
            );


        wrap.className =
            "gal-user";


        const trigger =
            document.createElement(
                "button"
            );


        trigger.type =
            "button";


        trigger.className =
            "gal-user__trigger";


        trigger.setAttribute(
            "aria-haspopup",
            "menu"
        );


        trigger.setAttribute(
            "aria-expanded",
            "false"
        );


        const label =
            document.createElement(
                "span"
            );


        label.className =
            "gal-user__label";


        label.textContent =
            "Admin:";


        const username =
            document.createTextNode(
                ` ${session.username} `
            );


        const caret =
            document.createElement(
                "span"
            );


        caret.className =
            "gal-user__caret";


        caret.setAttribute(
            "aria-hidden",
            "true"
        );


        caret.textContent =
            "▾";


        trigger.append(
            label,
            username,
            caret
        );


        const menu =
            document.createElement(
                "div"
            );


        menu.className =
            "gal-user__menu";


        menu.setAttribute(
            "role",
            "menu"
        );


        menu.hidden =
            true;


        menu.innerHTML = `
            <p class="gal-user__signed">
                Signed in as
            </p>

            <p class="gal-user__name"></p>

            <button
                type="button"
                role="menuitem"
                class="gal-user__logout"
            >
                Logout
            </button>
        `;


        menu.querySelector(
            ".gal-user__name"
        ).textContent =
            session.username;


        const closeMenu =
            () => {

                menu.hidden =
                    true;

                trigger.setAttribute(
                    "aria-expanded",
                    "false"
                );

            };


        const openMenu =
            () => {

                menu.hidden =
                    false;

                trigger.setAttribute(
                    "aria-expanded",
                    "true"
                );

            };


        trigger.addEventListener(
            "click",
            () => {

                if (menu.hidden) {

                    openMenu();

                } else {

                    closeMenu();

                }

            }
        );


        wrap.addEventListener(
            "mouseenter",
            openMenu
        );


        wrap.addEventListener(
            "mouseleave",
            closeMenu
        );


        menu
            .querySelector(
                ".gal-user__logout"
            )
            .addEventListener(
                "click",
                () => handleLogout(true)
            );


        document.addEventListener(
            "mousedown",
            event => {

                if (
                    !wrap.contains(
                        event.target
                    )
                ) {

                    closeMenu();

                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeMenu();

                }

            }
        );


        wrap.append(
            trigger,
            menu
        );


        el.userSlot.appendChild(
            wrap
        );
    }


    // =====================================================
    // UPLOAD BUTTON
    // =====================================================

    function requestUpload() {

        if (!isAdmin()) {

            openLoginModal();

            return;
        }


        openUploadModal();
    }


    // =====================================================
    // DELETE REQUEST
    // =====================================================

    function requestDelete(
        record
    ) {

        if (!isAdmin()) {

            openLoginModal();

            return;
        }


        pendingDelete =
            record;


        el.confirmOverlay.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        el.confirmOk?.focus();
    }


    // =====================================================
    // DELETE IMAGE
    // =====================================================

    async function handleDelete() {

        if (
            !pendingDelete ||
            !isAdmin()
        ) {

            return;
        }


        const id =
            pendingDelete.id;


        el.confirmOk.disabled =
            true;


        try {

            await api(
                `${API.gallery}/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );


            pendingDelete =
                null;


            el.confirmOverlay.hidden =
                true;


            document.body.style.overflow =
                "";


            await loadGallery();


            toast(
                "Image deleted successfully."
            );

        } catch (error) {

            if (
                error.status ===
                401
            ) {

                await handleLogout(
                    false
                );

            } else {

                toast(
                    error.message ||
                    "Unable to delete this image.",
                    "error"
                );

            }

        } finally {

            el.confirmOk.disabled =
                false;

        }
    }


    // =====================================================
    // OPEN LOGIN
    // =====================================================

    function openLoginModal() {

        el.loginUser.value =
            "";

        el.loginPass.value =
            "";

        el.loginPass.type =
            "password";

        el.loginPassToggle.textContent =
            "Show";

        el.loginPassToggle.setAttribute(
            "aria-pressed",
            "false"
        );


        hideLoginErrors();


        el.loginOverlay.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        window.setTimeout(
            () =>
                el.loginUser.focus(),
            40
        );
    }


    // =====================================================
    // CLOSE LOGIN
    // =====================================================

    function closeLoginModal() {

        el.loginOverlay.hidden =
            true;


        if (
            el.modalOverlay.hidden &&
            el.confirmOverlay.hidden &&
            lightboxIndex === null
        ) {

            document.body.style.overflow =
                "";

        }
    }


    // =====================================================
    // LOGIN ERRORS
    // =====================================================

    function hideLoginErrors() {

        [
            el.loginUserErr,
            el.loginPassErr,
            el.loginError

        ].forEach(
            node => {

                if (node) {

                    node.hidden =
                        true;

                }

            }
        );


        el.loginUser.classList.remove(
            "is-invalid"
        );


        el.loginPass.classList.remove(
            "is-invalid"
        );
    }


    // =====================================================
    // LOGIN
    // =====================================================

    async function handleLogin(
        event
    ) {

        event.preventDefault();


        hideLoginErrors();


        const username =
            el.loginUser.value.trim();


        const password =
            el.loginPass.value;


        let invalid =
            false;


        if (!username) {

            el.loginUserErr.hidden =
                false;


            const message =
                el.loginUserErr.querySelector(
                    "span:last-child"
                );


            if (message) {

                message.textContent =
                    "Please enter a username.";

            }


            el.loginUser.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        if (!password) {

            el.loginPassErr.hidden =
                false;


            const message =
                el.loginPassErr.querySelector(
                    "span:last-child"
                );


            if (message) {

                message.textContent =
                    "Please enter a password.";

            }


            el.loginPass.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        if (invalid) {

            return;

        }


        el.loginSubmit.disabled =
            true;


        el.loginSubmit.textContent =
            "SIGNING IN…";


        try {

            const data =
                await api(
                    API.login,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            session = {

                isAuthenticated:
                    data?.authenticated === true,

                username:
                    data?.username ||
                    username

            };


            renderUserSlot();


            closeLoginModal();


            toast(
                "Login successful."
            );


            // After login open upload form
            openUploadModal();


        } catch (error) {

            el.loginError.hidden =
                false;


            el.loginError.textContent =
                error.status === 401
                    ? "Invalid username or password."
                    : error.message ||
                    "Unable to login.";


            el.loginPass.value =
                "";


        } finally {

            el.loginSubmit.disabled =
                false;


            el.loginSubmit.textContent =
                "LOGIN";

        }
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    async function handleLogout(
        showToast = true
    ) {

        try {

            await fetch(
                API.logout,
                {
                    method: "POST",
                    credentials: "same-origin"
                }
            );

        } catch {

            // Reload regardless.
        }


        session = {

            isAuthenticated:
                false,

            username:
                null

        };


        if (showToast) {

            toast(
                "Logged out successfully."
            );

        }


        window.setTimeout(
            () =>
                window.location.reload(),
            showToast
                ? 250
                : 0
        );
    }


    // =====================================================
    // RESET FILE
    // =====================================================

    function resetPickedFile() {

        if (pickedPreviewUrl) {

            URL.revokeObjectURL(
                pickedPreviewUrl
            );

            pickedPreviewUrl =
                "";
        }


        pickedFile =
            null;


        if (el.fileInput) {

            el.fileInput.value =
                "";
        }


        if (el.filecard) {

            el.filecard.hidden =
                true;
        }


        if (el.previewImg) {

            el.previewImg.hidden =
                true;

            el.previewImg.removeAttribute(
                "src"
            );
        }


        if (el.previewEmpty) {

            el.previewEmpty.hidden =
                false;
        }
    }


    // =====================================================
    // OPEN UPLOAD MODAL
    // =====================================================

    function openUploadModal() {

        if (!isAdmin()) {

            openLoginModal();

            return;
        }


        resetPickedFile();


        el.modalTitle.textContent =
            "Upload an Image";


        el.uploadSubmit.textContent =
            "Upload Image";


        el.title.value =
            "";


        el.desc.value =
            "";


        el.category.value =
            "";


        clearUploadErrors();


        updateCounts();


        el.modalOverlay.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        window.setTimeout(
            () =>
                el.modalClose.focus(),
            40
        );
    }


    // =====================================================
    // CLOSE UPLOAD MODAL
    // =====================================================

    function closeUploadModal() {

        el.modalOverlay.hidden =
            true;


        resetPickedFile();


        if (
            el.confirmOverlay.hidden &&
            el.loginOverlay.hidden &&
            lightboxIndex === null
        ) {

            document.body.style.overflow =
                "";

        }
    }


    // =====================================================
    // CLEAR UPLOAD ERRORS
    // =====================================================

    function clearUploadErrors() {

        [
            el.fileErr,
            el.fileMissingErr,
            el.titleErr,
            el.descErr,
            el.categoryErr

        ].forEach(
            node => {

                if (node) {

                    node.hidden =
                        true;

                }

            }
        );


        [
            el.drop,
            el.title,
            el.desc,
            el.category

        ].forEach(
            node => {

                node?.classList.remove(
                    "is-invalid"
                );

            }
        );
    }


    // =====================================================
    // WORD COUNT
    // =====================================================

    function countWords(
        value
    ) {

        return value.trim()
            ? value.trim().split(/\s+/).length
            : 0;
    }


    // =====================================================
    // UPDATE COUNTERS
    // =====================================================

    function updateCounts() {

        if (el.titleCount) {

            el.titleCount.textContent =
                `${el.title.value.length} / ${MAX_TITLE}`;

        }


        if (el.descCount) {

            el.descCount.textContent =
                `${countWords(el.desc.value)} / ${MAX_WORDS} words`;

        }
    }


    // =====================================================
    // FILE ERROR
    // =====================================================

    function setFileError(
        message
    ) {

        if (!el.fileErr) {
            return;
        }


        el.fileErr.hidden =
            !message;


        if (message) {

            const messageNode =
                el.fileErr.querySelector(
                    "span:last-child"
                );


            if (messageNode) {

                messageNode.textContent =
                    message;

            }


            el.drop?.classList.add(
                "is-invalid"
            );

        } else {

            el.drop?.classList.remove(
                "is-invalid"
            );

        }
    }


    // =====================================================
    // READ IMAGE DIMENSIONS
    //
    // IMPORTANT:
    // Width and height are ONLY READ for display.
    // They are NOT used for validation.
    // =====================================================

    function readDimensions(
        file
    ) {

        return new Promise(
            (resolve, reject) => {

                const url =
                    URL.createObjectURL(
                        file
                    );


                const image =
                    new Image();


                image.onload =
                    () => {

                        const width =
                            image.naturalWidth;


                        const height =
                            image.naturalHeight;


                        URL.revokeObjectURL(
                            url
                        );


                        resolve({
                            width,
                            height
                        });

                    };


                image.onerror =
                    () => {

                        URL.revokeObjectURL(
                            url
                        );


                        reject(
                            new Error(
                                "Unable to process image."
                            )
                        );

                    };


                image.src =
                    url;

            }
        );
    }


    // =====================================================
    // HANDLE FILE
    //
    // FINAL REQUIREMENT:
    //
    // JPG / JPEG / PNG
    // Any width
    // Any height
    // Maximum 2 MB
    // =====================================================

    async function handleFile(
        file
    ) {

        resetPickedFile();

        clearUploadErrors();


        if (!file) {

            return;

        }


        // -------------------------------------------------
        // FILE TYPE
        // -------------------------------------------------

        const allowedTypes = [
            "image/jpeg",
            "image/png"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setFileError(
                "Only JPG, JPEG and PNG images are allowed."
            );


            return;
        }


        // -------------------------------------------------
        // MAXIMUM FILE SIZE
        // -------------------------------------------------

        if (
            file.size >
            MAX_BYTES
        ) {

            setFileError(
                "Image file size must not exceed 2 MB."
            );


            return;
        }


        // -------------------------------------------------
        // READ DIMENSIONS
        //
        // Dimensions are NOT validated.
        // They are only displayed to admin.
        // -------------------------------------------------

        try {

            const dimensions =
                await readDimensions(
                    file
                );


            pickedFile = {

                file,

                width:
                dimensions.width,

                height:
                dimensions.height

            };


            pickedPreviewUrl =
                URL.createObjectURL(
                    file
                );


            if (el.fcName) {

                el.fcName.textContent =
                    file.name;

            }


            if (el.fcSize) {

                el.fcSize.textContent =
                    formatBytes(
                        file.size
                    );

            }


            if (el.fcDims) {

                el.fcDims.textContent =
                    `${dimensions.width} × ${dimensions.height}`;

            }


            if (el.filecard) {

                el.filecard.hidden =
                    false;

            }


            if (el.previewEmpty) {

                el.previewEmpty.hidden =
                    true;

            }


            if (el.previewImg) {

                el.previewImg.hidden =
                    false;

                el.previewImg.src =
                    pickedPreviewUrl;

            }


            if (el.fileMissingErr) {

                el.fileMissingErr.hidden =
                    true;

            }

        } catch {

            setFileError(
                "Unable to process image."
            );

        }
    }


    // =====================================================
    // FORMAT FILE SIZE
    // =====================================================

    function formatBytes(
        bytes
    ) {

        if (!bytes) {

            return "0 KB";

        }


        if (
            bytes <
            1024 * 1024
        ) {

            return (
                `${(
                    bytes /
                    1024
                ).toFixed(0)} KB`
            );

        }


        return (
            `${(
                bytes /
                (1024 * 1024)
            ).toFixed(2)} MB`
        );
    }


    // =====================================================
    // HANDLE UPLOAD
    // =====================================================

    async function handleUpload(
        event
    ) {

        event.preventDefault();


        clearUploadErrors();


        const title =
            el.title.value.trim();


        const description =
            el.desc.value.trim();


        const categoryId =
            el.category.value;


        let invalid =
            false;


        // -------------------------------------------------
        // IMAGE REQUIRED
        // -------------------------------------------------

        if (!pickedFile) {

            el.fileMissingErr.hidden =
                false;


            el.drop.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        // -------------------------------------------------
        // TITLE
        // -------------------------------------------------

        if (!title) {

            el.titleErr.hidden =
                false;


            el.title.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        if (
            countWords(
                description
            ) > MAX_WORDS
        ) {

            el.descErr.hidden =
                false;


            el.desc.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        // -------------------------------------------------
        // CATEGORY
        // -------------------------------------------------

        if (!categoryId) {

            el.categoryErr.hidden =
                false;


            el.category.classList.add(
                "is-invalid"
            );


            invalid =
                true;
        }


        // -------------------------------------------------
        // FILE ERROR
        // -------------------------------------------------

        if (
            el.fileErr &&
            !el.fileErr.hidden
        ) {

            invalid =
                true;
        }


        if (invalid) {

            return;

        }


        // -------------------------------------------------
        // LOGIN CHECK
        // -------------------------------------------------

        if (!isAdmin()) {

            closeUploadModal();

            openLoginModal();

            return;
        }


        // -------------------------------------------------
        // FORM DATA
        // -------------------------------------------------

        const formData =
            new FormData();


        formData.append(
            "file",
            pickedFile.file
        );


        formData.append(
            "title",
            title.slice(
                0,
                MAX_TITLE
            )
        );


        formData.append(
            "description",
            description
        );


        formData.append(
            "categoryId",
            categoryId
        );


        // -------------------------------------------------
        // UPLOADING
        // -------------------------------------------------

        el.uploadSubmit.disabled =
            true;


        el.uploadSubmit.textContent =
            "Uploading…";


        try {

            await api(
                API.gallery,
                {
                    method: "POST",

                    body:
                    formData
                }
            );


            closeUploadModal();


            activeCategory =
                "All";


            visible =
                PAGE_SIZE;


            await loadGallery();


            toast(
                "Image uploaded successfully."
            );


        } catch (error) {

            if (
                error.status ===
                401
            ) {

                closeUploadModal();


                await handleLogout(
                    false
                );


                return;
            }


            toast(
                error.message ||
                "Unable to upload this image.",
                "error"
            );


        } finally {

            el.uploadSubmit.disabled =
                false;


            el.uploadSubmit.textContent =
                "Upload Image";

        }
    }


    // =====================================================
    // OPEN LIGHTBOX
    // =====================================================

    function openLightbox(
        viewRecords,
        index
    ) {

        lightboxRecords =
            viewRecords;


        lightboxIndex =
            index;


        renderLightbox();


        document.body.style.overflow =
            "hidden";
    }


    // =====================================================
    // CLOSE LIGHTBOX
    // =====================================================

    function closeLightbox() {

        lightboxIndex =
            null;


        lightboxRecords =
            [];


        if (el.lightbox) {

            el.lightbox.hidden =
                true;


            el.lightbox.innerHTML =
                "";

        }


        if (
            el.modalOverlay.hidden &&
            el.loginOverlay.hidden &&
            el.confirmOverlay.hidden
        ) {

            document.body.style.overflow =
                "";

        }
    }


    // =====================================================
    // LIGHTBOX NAVIGATION
    // =====================================================

    function navigateLightbox(
        index
    ) {

        lightboxIndex =
            index;


        renderLightbox();
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value ?? "";


        return div.innerHTML;
    }


    // =====================================================
    // RENDER LIGHTBOX
    // =====================================================

    function renderLightbox() {

        if (
            lightboxIndex === null ||
            !lightboxRecords[
                lightboxIndex
                ]
        ) {

            closeLightbox();

            return;
        }


        const active =
            lightboxRecords[
                lightboxIndex
                ];


        const src =
            active.imageUrl ||
            "";


        el.lightbox.hidden =
            false;


        el.lightbox.setAttribute(
            "role",
            "dialog"
        );


        el.lightbox.setAttribute(
            "aria-modal",
            "true"
        );


        el.lightbox.innerHTML = `

            <button
                type="button"
                class="gal-lightbox__close"
                aria-label="Close image viewer"
            >
                ×
            </button>


            <button
                type="button"
                class="gal-lightbox__nav gal-lightbox__nav--prev"
                aria-label="Previous image"
            >
                ‹
            </button>


            <div class="gal-lightbox__stage">

                <div class="gal-lightbox__frame">

                    ${
            src
                ? `
                                <img
                                    src="${escapeHtml(src)}"
                                    alt="${escapeHtml(
                    active.title ||
                    "Interior image"
                )}"
                                />
                            `
                : ""
        }

                </div>


                <div class="gal-lightbox__info">

                    <p
                        class="gal-lightbox__cat"
                    ></p>


                    <h2
                        class="gal-lightbox__title"
                    ></h2>


                    ${
            active.description
                ? `
                                <p
                                    class="gal-lightbox__desc"
                                ></p>
                            `
                : ""
        }


                    <p
                        class="gal-lightbox__count"
                    ></p>

                </div>

            </div>


            <button
                type="button"
                class="gal-lightbox__nav gal-lightbox__nav--next"
                aria-label="Next image"
            >
                ›
            </button>

        `;


        el.lightbox.querySelector(
            ".gal-lightbox__cat"
        ).textContent =
            categoryName(active);


        el.lightbox.querySelector(
            ".gal-lightbox__title"
        ).textContent =
            active.title || "";


        const desc =
            el.lightbox.querySelector(
                ".gal-lightbox__desc"
            );


        if (desc) {

            desc.textContent =
                active.description ||
                "";

        }


        el.lightbox.querySelector(
            ".gal-lightbox__count"
        ).textContent =
            `${lightboxIndex + 1} / ${lightboxRecords.length}`;


        el.lightbox.querySelector(
            ".gal-lightbox__close"
        ).addEventListener(
            "click",
            closeLightbox
        );


        el.lightbox.querySelector(
            ".gal-lightbox__nav--prev"
        ).addEventListener(
            "click",
            () => {

                navigateLightbox(

                    (
                        lightboxIndex -
                        1 +
                        lightboxRecords.length
                    ) %
                    lightboxRecords.length

                );

            }
        );


        el.lightbox.querySelector(
            ".gal-lightbox__nav--next"
        ).addEventListener(
            "click",
            () => {

                navigateLightbox(

                    (
                        lightboxIndex +
                        1
                    ) %
                    lightboxRecords.length

                );

            }
        );


        el.lightbox.addEventListener(
            "mousedown",
            event => {

                if (
                    event.target ===
                    el.lightbox
                ) {

                    closeLightbox();

                }

            }
        );
    }


    // =====================================================
    // FOCUS TRAP
    // =====================================================

    function trapFocus(
        container,
        isClosed
    ) {

        if (!container) {
            return;
        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    isClosed() ||
                    event.key !== "Tab"
                ) {

                    return;

                }


                const focusables =
                    container.querySelectorAll(
                        `
                        button,
                        input,
                        [href],
                        select,
                        textarea,
                        [tabindex]:not(
                            [tabindex="-1"]
                        )
                        `
                    );


                if (
                    !focusables.length
                ) {

                    return;

                }


                const first =
                    focusables[0];


                const last =
                    focusables[
                    focusables.length - 1
                        ];


                if (
                    event.shiftKey &&
                    document.activeElement ===
                    first
                ) {

                    event.preventDefault();

                    last.focus();

                } else if (
                    !event.shiftKey &&
                    document.activeElement ===
                    last
                ) {

                    event.preventDefault();

                    first.focus();

                }

            }
        );
    }


    // =====================================================
    // BIND EVENTS
    // =====================================================

    function bindEvents() {

        // -------------------------------------------------
        // UPLOAD
        // -------------------------------------------------

        el.uploadCta?.addEventListener(
            "click",
            requestUpload
        );


        // -------------------------------------------------
        // LOGIN
        // -------------------------------------------------

        el.loginForm?.addEventListener(
            "submit",
            handleLogin
        );


        el.loginClose?.addEventListener(
            "click",
            closeLoginModal
        );


        el.loginCancel?.addEventListener(
            "click",
            closeLoginModal
        );


        el.loginOverlay?.addEventListener(
            "mousedown",
            event => {

                if (
                    event.target ===
                    el.loginOverlay
                ) {

                    closeLoginModal();

                }

            }
        );


        // -------------------------------------------------
        // PASSWORD SHOW / HIDE
        // -------------------------------------------------

        el.loginPassToggle?.addEventListener(
            "click",
            () => {

                const showing =
                    el.loginPass.type ===
                    "text";


                el.loginPass.type =
                    showing
                        ? "password"
                        : "text";


                el.loginPassToggle.textContent =
                    showing
                        ? "Show"
                        : "Hide";


                el.loginPassToggle.setAttribute(
                    "aria-pressed",
                    String(!showing)
                );

            }
        );


        // -------------------------------------------------
        // UPLOAD FORM
        // -------------------------------------------------

        el.uploadForm?.addEventListener(
            "submit",
            handleUpload
        );


        el.modalClose?.addEventListener(
            "click",
            closeUploadModal
        );


        el.modalOverlay?.addEventListener(
            "mousedown",
            event => {

                if (
                    event.target ===
                    el.modalOverlay
                ) {

                    closeUploadModal();

                }

            }
        );


        // -------------------------------------------------
        // FILE DROP AREA
        // -------------------------------------------------

        el.drop?.addEventListener(
            "click",
            () =>
                el.fileInput.click()
        );


        el.drop?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter" ||
                    event.key ===
                    " "
                ) {

                    event.preventDefault();

                    el.fileInput.click();

                }

            }
        );


        el.drop?.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

            }
        );


        el.drop?.addEventListener(
            "drop",
            event => {

                event.preventDefault();


                handleFile(
                    event.dataTransfer
                        .files?.[0]
                );

            }
        );


        el.fileInput?.addEventListener(
            "change",
            event => {

                handleFile(
                    event.target.files?.[0]
                );

            }
        );


        // -------------------------------------------------
        // REPLACE FILE
        // -------------------------------------------------

        el.fcReplace?.addEventListener(
            "click",
            () => {

                resetPickedFile();

                el.fileInput.click();

            }
        );


        // -------------------------------------------------
        // DELETE CONFIRM
        // -------------------------------------------------

        el.confirmCancel?.addEventListener(
            "click",
            () => {

                pendingDelete =
                    null;


                el.confirmOverlay.hidden =
                    true;


                document.body.style.overflow =
                    "";

            }
        );


        el.confirmOverlay?.addEventListener(
            "mousedown",
            event => {

                if (
                    event.target ===
                    el.confirmOverlay
                ) {

                    pendingDelete =
                        null;


                    el.confirmOverlay.hidden =
                        true;


                    document.body.style.overflow =
                        "";

                }

            }
        );


        el.confirmOk?.addEventListener(
            "click",
            handleDelete
        );


        // -------------------------------------------------
        // FORM COUNTERS
        // -------------------------------------------------

        el.title?.addEventListener(
            "input",
            updateCounts
        );


        el.desc?.addEventListener(
            "input",
            updateCounts
        );


        // -------------------------------------------------
        // KEYBOARD
        // -------------------------------------------------

        document.addEventListener(
            "keydown",
            event => {

                // ESCAPE
                if (
                    event.key ===
                    "Escape"
                ) {

                    if (
                        !el.loginOverlay.hidden
                    ) {

                        closeLoginModal();

                    } else if (
                        !el.modalOverlay.hidden
                    ) {

                        closeUploadModal();

                    } else if (
                        !el.confirmOverlay.hidden
                    ) {

                        el.confirmOverlay.hidden =
                            true;


                        pendingDelete =
                            null;


                        document.body.style.overflow =
                            "";

                    } else if (
                        lightboxIndex !== null
                    ) {

                        closeLightbox();

                    }
                }


                // LIGHTBOX PREVIOUS
                if (
                    lightboxIndex !== null &&
                    event.key ===
                    "ArrowLeft"
                ) {

                    navigateLightbox(

                        (
                            lightboxIndex -
                            1 +
                            lightboxRecords.length
                        ) %
                        lightboxRecords.length

                    );

                }


                // LIGHTBOX NEXT
                if (
                    lightboxIndex !== null &&
                    event.key ===
                    "ArrowRight"
                ) {

                    navigateLightbox(

                        (
                            lightboxIndex +
                            1
                        ) %
                        lightboxRecords.length

                    );

                }

            }
        );


        // -------------------------------------------------
        // FOCUS TRAPS
        // -------------------------------------------------

        trapFocus(
            el.loginDialog,
            () =>
                el.loginOverlay.hidden
        );


        trapFocus(
            el.modalDialog,
            () =>
                el.modalOverlay.hidden
        );
    }


    // =====================================================
    // START APPLICATION
    // =====================================================

    async function boot() {

        bindEvents();


        renderUserSlot();


        try {

            await checkSession();

            await loadCategories();

            await loadGallery();

        } catch (error) {

            loading =
                false;


            renderAll();


            toast(
                error.message ||
                "Unable to load the gallery.",
                "error"
            );

        }
    }


    return {
        boot
    };

})();


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        App.boot();

    }
);