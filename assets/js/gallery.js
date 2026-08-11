 "use strict";

/* =========================================================================
 * gallery-db — IndexedDB persistence for the interior gallery.
 * All persistence is local to the browser — there is no backend.
 * ========================================================================= */
const GalleryDB = (() => {
  const DB_NAME = "interiorGalleryDB";
  const STORE_NAME = "galleryImages";
  const DB_VERSION = 1;

  const CATEGORIES = [
    "Living Room",
    "Dining Hall",
    "Bedroom",
    "Kitchen",
    "Hall",
    "Office",
    "Commercial",
    "Luxury Interiors",
  ];

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("category", "category", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  function tx(mode, run) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, mode);
          const request = run(transaction.objectStore(STORE_NAME));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
    );
  }

  async function initializeDatabase() {
    await openDB();
  }

  async function getAllImages() {
    const rows = await tx("readonly", (s) => s.getAll());
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  }

  async function addImage(record) {
    await tx("readwrite", (s) => s.add(record));
  }

  async function updateImage(record) {
    await tx("readwrite", (s) => s.put(record));
  }

  async function deleteImage(id) {
    await tx("readwrite", (s) => s.delete(id));
  }

  async function countImages() {
    return tx("readonly", (s) => s.count());
  }

  function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  const DEMO_SEED = [
 
  ];

  /** Seeds demo entries only when the store is completely empty. */
  async function seedIfEmpty() {
    const existing = await countImages();
    if (existing > 0) return;
    const now = Date.now();
    await Promise.all(
      DEMO_SEED.map((seed, index) =>
        addImage({
          id: createId(),
          title: seed.title,
          description: seed.description,
          category: seed.category,
          remoteUrl: seed.remoteUrl,
          fileName: `${seed.title.toLowerCase().replace(/\s+/g, "-")}.jpg`,
          fileType: "image/jpeg",
          fileSize: 0,
          width: seed.width,
          height: seed.height,
          createdAt: now - index * 1000,
          isDemo: true,
        }),
      ),
    );
  }

  return {
    CATEGORIES,
    initializeDatabase,
    seedIfEmpty,
    getAllImages,
    addImage,
    updateImage,
    deleteImage,
    countImages,
    createId,
  };
})();

/* =========================================================================
 * auth-service — frontend-only gallery admin session.
 * NOTE: this is NOT secure server-side authentication. There is no backend,
 * so the credentials below live in client code and can be read by anyone.
 * Its only purpose is to keep gallery-management controls out of a normal
 * visitor's way.
 * ========================================================================= */
const AuthService = (() => {
  const AUTH_KEY = "galleryAdminAuthenticated";
  const USER_KEY = "galleryAdminUsername";
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin@123";
  const LOGGED_OUT = { isAuthenticated: false, username: null };

  function storage() {
    try {
      return typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
      return null;
    }
  }

  function getSession() {
    const store = storage();
    if (!store) return LOGGED_OUT;
    if (store.getItem(AUTH_KEY) !== "true") return LOGGED_OUT;
    return { isAuthenticated: true, username: store.getItem(USER_KEY) ?? ADMIN_USERNAME };
  }

  async function login(username, password) {
    await new Promise((resolve) => setTimeout(resolve, 320));
    const valid = username.trim().toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (!valid) return null;
    const store = storage();
    store?.setItem(AUTH_KEY, "true");
    store?.setItem(USER_KEY, ADMIN_USERNAME);
    return { isAuthenticated: true, username: ADMIN_USERNAME };
  }

  function logout() {
    const store = storage();
    store?.removeItem(AUTH_KEY);
    store?.removeItem(USER_KEY);
    return LOGGED_OUT;
  }

  return { getSession, login, logout };
})();

/* =========================================================================
 * Toaster
 * ========================================================================= */
const Toaster = (() => {
  const root = document.getElementById("gal-toasts");
  let counter = 0;

  function push(message, tone) {
    const id = ++counter;
    const el = document.createElement("div");
    el.className = `gal-toast gal-toast--${tone}`;
    el.innerHTML = `
      <span class="gal-toast__dot" aria-hidden="true"></span>
      <p></p>
      <button type="button" class="gal-toast__close" aria-label="Dismiss notification">×</button>
    `;
    el.querySelector("p").textContent = message;
    const remove = () => el.remove();
    el.querySelector(".gal-toast__close").addEventListener("click", remove);
    root.appendChild(el);
    window.setTimeout(remove, 4000);
  }

  return {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
  };
})();

/* =========================================================================
 * Image src helper — resolves a displayable URL for a record and tracks
 * object URLs it created so they can be revoked later.
 * ========================================================================= */
function recordSrc(record) {
  if (!record) return "";
  if (record.imageBlob) return URL.createObjectURL(record.imageBlob);
  return record.remoteUrl ?? "";
}

/* =========================================================================
 * Main gallery app
 * ========================================================================= */
const App = (() => {
  const PAGE_SIZE = 6;
  const MIN_BYTES = 1024 * 1024;
  const MAX_BYTES = 2 * 1024 * 1024;
  const REQ_W = 360;
  const REQ_H = 480;
  const MAX_WORDS = 150;
  const MAX_TITLE = 100;

  // ---- state ----
  let records = [];
  let loading = true;
  let activeCategory = "All";
  let visible = PAGE_SIZE;
  let session = { isAuthenticated: false, username: null };
  let editing = null; // record being edited, or null for new upload
  let pendingDelete = null;
  let lightboxIndex = null;
  let lightboxRecords = [];
  let cardObjectUrls = [];
  let pickedFile = null; // { file, width, height, url }
  let existingEditUrl = "";

  // ---- DOM refs ----
  const el = {
    tabs: document.getElementById("gal-tabs"),
    results: document.getElementById("gal-results"),
    uploadCta: document.getElementById("gal-upload-cta"),
    userSlot: document.getElementById("gal-user-slot"),

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
    fcReplace: document.getElementById("gal-fc-replace"),
    title: document.getElementById("gal-title"),
    titleErr: document.getElementById("gal-title-err"),
    titleCount: document.getElementById("gal-title-count"),
    desc: document.getElementById("gal-desc"),
    descErr: document.getElementById("gal-desc-err"),
    descCount: document.getElementById("gal-desc-count"),
    category: document.getElementById("gal-category"),
    categoryErr: document.getElementById("gal-category-err"),
    uploadSubmit: document.getElementById("gal-upload-submit"),
    previewFrame: document.getElementById("gal-preview-frame"),
    previewEmpty: document.getElementById("gal-preview-empty"),
    previewImg: document.getElementById("gal-preview-img"),

    confirmOverlay: document.getElementById("gal-confirm-overlay"),
    confirmCancel: document.getElementById("gal-confirm-cancel"),
    confirmOk: document.getElementById("gal-confirm-ok"),

    lightbox: document.getElementById("gal-lightbox"),
  };

  // Populate the category <select> once.
  GalleryDB.CATEGORIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    el.category.appendChild(opt);
  });

  const isAdmin = () => session.isAuthenticated;

  // ---------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------
  async function refresh() {
    records = await GalleryDB.getAllImages();
  }

  async function boot() {
    session = AuthService.getSession();
    renderUserSlot();
    try {
      await GalleryDB.initializeDatabase();
      await GalleryDB.seedIfEmpty();
      await refresh();
    } catch {
      Toaster.error("Unable to load the gallery from local storage.");
    } finally {
      loading = false;
      renderAll();
    }
  }

  // ---------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------
  function getCategories() {
    const used = new Set(records.map((r) => r.category));
    const ordered = GalleryDB.CATEGORIES.filter((c) => used.has(c));
    const extra = [...used].filter((c) => !GalleryDB.CATEGORIES.includes(c));
    return ["All", ...ordered, ...extra];
  }

  function getFiltered() {
    return activeCategory === "All" ? records : records.filter((r) => r.category === activeCategory);
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function renderAll() {
    renderTabs();
    renderResults();
  }

  function renderTabs() {
    const categories = getCategories();
    el.tabs.innerHTML = "";
    categories.forEach((category) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(activeCategory === category));
      btn.className = `gal-tab${activeCategory === category ? " is-active" : ""}`;
      btn.textContent = category;
      btn.addEventListener("click", () => {
        activeCategory = category;
        visible = PAGE_SIZE;
        renderAll();
      });
      el.tabs.appendChild(btn);
    });
  }

  function revokeCardUrls() {
    cardObjectUrls.forEach((u) => URL.revokeObjectURL(u));
    cardObjectUrls = [];
  }

  function renderResults() {
    revokeCardUrls();
    el.results.innerHTML = "";

    if (loading) {
      const p = document.createElement("p");
      p.className = "gal-status";
      p.textContent = "Loading gallery…";
      el.results.appendChild(p);
      return;
    }

    const filtered = getFiltered();
    const shown = filtered.slice(0, visible);

    if (shown.length === 0) {
      const div = document.createElement("div");
      div.className = "gal-empty";
      div.innerHTML = `
        <h2 class="gal-empty__title">NO IMAGES FOUND</h2>
        <p class="gal-empty__text">There are currently no images in this category.</p>
        <button type="button" class="gal-btn gal-btn--ghost">View All Images</button>
      `;
      div.querySelector("button").addEventListener("click", () => {
        activeCategory = "All";
        visible = PAGE_SIZE;
        renderAll();
      });
      el.results.appendChild(div);
      return;
    }

    const masonry = document.createElement("div");
    masonry.className = "gal-masonry";

    shown.forEach((record, index) => {
      masonry.appendChild(buildCard(record, index));
    });
    el.results.appendChild(masonry);

    if (visible < filtered.length) {
      const wrap = document.createElement("div");
      wrap.className = "gal-more";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gal-btn gal-btn--outline";
      btn.textContent = "LOAD MORE";
      btn.addEventListener("click", () => {
        visible += PAGE_SIZE;
        renderAll();
      });
      wrap.appendChild(btn);
      el.results.appendChild(wrap);
    }
  }

  function buildCard(record, index) {
    const src = recordSrc(record);
    if (record.imageBlob) cardObjectUrls.push(src);
    const ratio = record.width && record.height ? record.width / record.height : 3 / 4;

    const figure = document.createElement("figure");
    figure.className = "gal-card";

    const mediaBtn = document.createElement("button");
    mediaBtn.type = "button";
    mediaBtn.className = "gal-card__media";
    mediaBtn.style.aspectRatio = String(ratio);
    mediaBtn.setAttribute("aria-label", `Open ${record.title} in full screen`);
    mediaBtn.addEventListener("click", () => openLightbox(getFiltered().slice(0, visible), index));

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = record.title;
      img.loading = "lazy";
      img.decoding = "async";
      mediaBtn.appendChild(img);
    } else {
      const skeleton = document.createElement("span");
      skeleton.className = "gal-card__skeleton";
      skeleton.setAttribute("aria-hidden", "true");
      mediaBtn.appendChild(skeleton);
    }

    const scrim = document.createElement("span");
    scrim.className = "gal-card__scrim";
    scrim.setAttribute("aria-hidden", "true");
    mediaBtn.appendChild(scrim);

    const meta = document.createElement("span");
    meta.className = "gal-card__meta";
    meta.innerHTML = `
      <span class="gal-card__cat"></span>
      <span class="gal-card__title"></span>
      ${record.description ? '<span class="gal-card__desc"></span>' : ""}
    `;
    meta.querySelector(".gal-card__cat").textContent = record.category;
    meta.querySelector(".gal-card__title").textContent = record.title;
    if (record.description) meta.querySelector(".gal-card__desc").textContent = record.description;
    mediaBtn.appendChild(meta);

    figure.appendChild(mediaBtn);

    if (isAdmin()) {
      const manage = document.createElement("div");
      manage.className = "gal-card__manage";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.setAttribute("aria-label", `Edit ${record.title}`);
      editBtn.addEventListener("click", () => requestEdit(record));
      const sep = document.createElement("span");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "/";
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.setAttribute("aria-label", `Delete ${record.title}`);
      delBtn.addEventListener("click", () => requestDelete(record));
      manage.append(editBtn, sep, delBtn);
      figure.appendChild(manage);
    }

    const caption = document.createElement("figcaption");
    caption.className = "gal-card__caption";
    caption.innerHTML = `
      <span class="gal-card__caption-title"></span>
      <span class="gal-card__caption-cat"></span>
    `;
    caption.querySelector(".gal-card__caption-title").textContent = record.title;
    caption.querySelector(".gal-card__caption-cat").textContent = record.category;
    figure.appendChild(caption);

    return figure;
  }

  function renderUserSlot() {
    el.userSlot.innerHTML = "";
    if (!isAdmin() || !session.username) return;

    const wrap = document.createElement("div");
    wrap.className = "gal-user";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "gal-user__trigger";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `<span class="gal-user__label">Admin:</span> ${session.username} <span class="gal-user__caret" aria-hidden="true">▾</span>`;

    const menu = document.createElement("div");
    menu.className = "gal-user__menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    menu.innerHTML = `
      <p class="gal-user__signed">Signed in as</p>
      <p class="gal-user__name"></p>
      <button type="button" role="menuitem" class="gal-user__logout">Logout</button>
    `;
    menu.querySelector(".gal-user__name").textContent = session.username;
    menu.querySelector(".gal-user__logout").addEventListener("click", handleLogout);

    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }
    trigger.addEventListener("click", () => {
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
    document.addEventListener("mousedown", (event) => {
      if (!wrap.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    wrap.append(trigger, menu);
    el.userSlot.appendChild(wrap);
  }

  // ---------------------------------------------------------------------
  // Upload flow
  // ---------------------------------------------------------------------
  function requestUpload() {
    editing = null;
    if (!isAdmin()) {
      openLoginModal();
      return;
    }
    openUploadModal();
  }

  function requestEdit(record) {
    if (!isAdmin()) {
      openLoginModal();
      return;
    }
    editing = record;
    openUploadModal();
  }

  function requestDelete(record) {
    if (!isAdmin()) {
      openLoginModal();
      return;
    }
    pendingDelete = record;
    el.confirmOverlay.hidden = false;
    el.confirmOk.focus();
  }

  el.confirmCancel.addEventListener("click", () => {
    pendingDelete = null;
    el.confirmOverlay.hidden = true;
  });
  el.confirmOverlay.addEventListener("mousedown", (event) => {
    if (event.target === el.confirmOverlay) {
      pendingDelete = null;
      el.confirmOverlay.hidden = true;
    }
  });
  el.confirmOk.addEventListener("click", async () => {
    if (!pendingDelete || !isAdmin()) return;
    try {
      await GalleryDB.deleteImage(pendingDelete.id);
      pendingDelete = null;
      el.confirmOverlay.hidden = true;
      closeLightbox();
      await refresh();
      visible = Math.max(PAGE_SIZE, visible - 1);
      renderAll();
      Toaster.success("Image deleted successfully.");
    } catch {
      Toaster.error("Unable to delete this image.");
    }
  });

  function resetPicked() {
    if (pickedFile) URL.revokeObjectURL(pickedFile.url);
    pickedFile = null;
    setFieldError(el.fileErr, null);
  }

  function openUploadModal() {
    el.modalTitle.textContent = editing ? "Edit Image" : "Upload an Image";
    el.uploadSubmit.textContent = editing ? "Save Changes" : "Upload Image";
    el.title.value = editing?.title ?? "";
    el.desc.value = editing?.description ?? "";
    el.category.value = editing?.category ?? "";
    el.fileInput.value = "";
    resetPicked();
    updateCounts();
    clearUploadErrors();

    if (editing) {
      existingEditUrl = recordSrc(editing);
    } else {
      existingEditUrl = "";
    }
    updatePreview();

    el.modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => el.modalClose.focus(), 40);
  }

  function closeUploadModal() {
    el.modalOverlay.hidden = true;
    document.body.style.overflow = "";
    editing = null;
    resetPicked();
  }

  el.modalClose.addEventListener("click", closeUploadModal);
  el.modalOverlay.addEventListener("mousedown", (event) => {
    if (event.target === el.modalOverlay) closeUploadModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.modalOverlay.hidden) closeUploadModal();
  });
  trapFocus(el.modalDialog, () => el.modalOverlay.hidden);

  el.drop.addEventListener("click", () => el.fileInput.click());
  el.drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      el.fileInput.click();
    }
  });
  el.drop.addEventListener("dragover", (event) => event.preventDefault());
  el.drop.addEventListener("drop", (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  });
  el.fileInput.addEventListener("change", (event) => handleFile(event.target.files?.[0]));
  el.fcReplace.addEventListener("click", (event) => {
    event.stopPropagation();
    resetPicked();
    el.fileInput.value = "";
    updatePreview();
    updateFilecard();
    el.fileInput.click();
  });

  function readDimensions(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ file, width: img.naturalWidth, height: img.naturalHeight, url });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to process image."));
      };
      img.src = url;
    });
  }

  async function handleFile(file) {
    if (!file) return;
    resetPicked();
    const type = file.type.toLowerCase();
    if (!["image/jpeg", "image/jpg", "image/png"].includes(type)) {
      setFieldError(el.fileErr, "Only JPG, JPEG and PNG images are allowed.");
      updateFilecard();
      updatePreview();
      return;
    }
    if (file.size < MIN_BYTES || file.size > MAX_BYTES) {
      setFieldError(el.fileErr, "Image size must be between 1 MB and 2 MB.");
      updateFilecard();
      updatePreview();
      return;
    }
    try {
      const result = await readDimensions(file);
      if (result.width !== REQ_W || result.height !== REQ_H) {
        URL.revokeObjectURL(result.url);
        setFieldError(el.fileErr, `Image must be exactly ${REQ_W} × ${REQ_H}px.`);
        updateFilecard();
        updatePreview();
        return;
      }
      pickedFile = result;
      setFieldError(el.fileErr, null);
    } catch {
      setFieldError(el.fileErr, "Unable to process image.");
    }
    updateFilecard();
    updatePreview();
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function updateFilecard() {
    if (pickedFile) {
      el.filecard.hidden = false;
      el.fcName.textContent = pickedFile.file.name;
      el.fcSize.textContent = formatSize(pickedFile.file.size);
      el.fcDims.textContent = `${pickedFile.width} × ${pickedFile.height}px`;
    } else {
      el.filecard.hidden = true;
    }
  }

  function updatePreview() {
    const src = pickedFile?.url || existingEditUrl;
    if (src) {
      el.previewImg.src = src;
      el.previewImg.hidden = false;
      el.previewEmpty.hidden = true;
    } else {
      el.previewImg.hidden = true;
      el.previewImg.removeAttribute("src");
      el.previewEmpty.hidden = false;
    }
  }

  function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  function updateCounts() {
    el.titleCount.textContent = `${el.title.value.length} / ${MAX_TITLE}`;
    const words = countWords(el.desc.value);
    el.descCount.textContent = `${words} / ${MAX_WORDS} words`;
    return words;
  }

  el.title.addEventListener("input", () => {
    el.title.value = el.title.value.slice(0, MAX_TITLE);
    updateCounts();
  });
  el.desc.addEventListener("input", updateCounts);

  function setFieldError(node, message) {
    if (message) {
      node.hidden = false;
      const span = node.querySelector("span:last-child");
      if (span) span.textContent = message;
      else node.textContent = message;
    } else {
      node.hidden = true;
    }
  }

  function clearUploadErrors() {
    [el.fileErr, el.fileMissingErr, el.titleErr, el.descErr, el.categoryErr].forEach((n) => (n.hidden = true));
    el.drop.classList.remove("is-invalid");
    el.title.classList.remove("is-invalid");
    el.desc.classList.remove("is-invalid");
    el.category.classList.remove("is-invalid");
  }

  el.uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearUploadErrors();

    const isEdit = Boolean(editing);
    const title = el.title.value.trim();
    const category = el.category.value;
    const words = countWords(el.desc.value);

    let hasError = false;
    if (!title) {
      el.titleErr.hidden = false;
      el.title.classList.add("is-invalid");
      hasError = true;
    }
    if (!category) {
      el.categoryErr.hidden = false;
      el.category.classList.add("is-invalid");
      hasError = true;
    }
    if (words > MAX_WORDS) {
      el.descErr.hidden = false;
      el.desc.classList.add("is-invalid");
      hasError = true;
    }
    if (!pickedFile && !isEdit) {
      el.fileMissingErr.hidden = false;
      el.drop.classList.add("is-invalid");
      hasError = true;
    }
    if (el.fileErr && !el.fileErr.hidden) hasError = true;
    if (hasError) return;

    el.uploadSubmit.disabled = true;
    el.uploadSubmit.textContent = "Saving…";
    try {
      if (!isAdmin()) {
        closeUploadModal();
        openLoginModal();
        return;
      }
      if (isEdit) {
        const next = {
          ...editing,
          title: title.slice(0, MAX_TITLE),
          description: el.desc.value.trim(),
          category,
          updatedAt: Date.now(),
        };
        if (pickedFile) {
          next.imageBlob = pickedFile.file;
          delete next.remoteUrl;
          next.fileName = pickedFile.file.name;
          next.fileType = pickedFile.file.type;
          next.fileSize = pickedFile.file.size;
          next.width = pickedFile.width;
          next.height = pickedFile.height;
          next.isDemo = false;
        }
        await GalleryDB.updateImage(next);
        Toaster.success("Image updated successfully.");
      } else {
        if (!pickedFile) return;
        await GalleryDB.addImage({
          id: GalleryDB.createId(),
          title: title.slice(0, MAX_TITLE),
          description: el.desc.value.trim(),
          category,
          imageBlob: pickedFile.file,
          fileName: pickedFile.file.name,
          fileType: pickedFile.file.type,
          fileSize: pickedFile.file.size,
          width: pickedFile.width,
          height: pickedFile.height,
          createdAt: Date.now(),
          isDemo: false,
        });
        Toaster.success("Image uploaded successfully.");
        activeCategory = "All";
        visible = PAGE_SIZE;
      }
      await refresh();
      closeUploadModal();
      renderAll();
    } catch {
      Toaster.error("Unable to process image.");
    } finally {
      el.uploadSubmit.disabled = false;
      el.uploadSubmit.textContent = isEdit ? "Save Changes" : "Upload Image";
    }
  });

  // ---------------------------------------------------------------------
  // Login modal
  // ---------------------------------------------------------------------
  function openLoginModal() {
    el.loginUser.value = "";
    el.loginPass.value = "";
    el.loginPass.type = "password";
    el.loginPassToggle.textContent = "Show";
    el.loginPassToggle.setAttribute("aria-pressed", "false");
    el.loginUserErr.hidden = true;
    el.loginPassErr.hidden = true;
    el.loginError.hidden = true;
    el.loginUser.classList.remove("is-invalid");
    el.loginPass.classList.remove("is-invalid");
    el.loginOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => el.loginUser.focus(), 40);
  }

  function closeLoginModal() {
    el.loginOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.loginClose.addEventListener("click", closeLoginModal);
  el.loginCancel.addEventListener("click", closeLoginModal);
  el.loginOverlay.addEventListener("mousedown", (event) => {
    if (event.target === el.loginOverlay) closeLoginModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.loginOverlay.hidden) closeLoginModal();
  });
  trapFocus(el.loginDialog, () => el.loginOverlay.hidden);

  el.loginPassToggle.addEventListener("click", () => {
    const showing = el.loginPass.type === "text";
    el.loginPass.type = showing ? "password" : "text";
    el.loginPassToggle.textContent = showing ? "Show" : "Hide";
    el.loginPassToggle.setAttribute("aria-pressed", String(!showing));
  });

  el.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = el.loginUser.value;
    const password = el.loginPass.value;

    el.loginUserErr.hidden = true;
    el.loginPassErr.hidden = true;
    el.loginError.hidden = true;
    el.loginUser.classList.remove("is-invalid");
    el.loginPass.classList.remove("is-invalid");

    let hasError = false;
    if (!username.trim()) {
      el.loginUserErr.hidden = false;
      el.loginUserErr.querySelector("span:last-child").textContent = "Please enter a username.";
      el.loginUser.classList.add("is-invalid");
      hasError = true;
    }
    if (!password) {
      el.loginPassErr.hidden = false;
      el.loginPassErr.querySelector("span:last-child").textContent = "Please enter a password.";
      el.loginPass.classList.add("is-invalid");
      hasError = true;
    }
    if (hasError) return;

    el.loginSubmit.disabled = true;
    el.loginSubmit.textContent = "SIGNING IN…";
    try {
      const nextSession = await AuthService.login(username, password);
      if (!nextSession) {
        el.loginError.hidden = false;
        el.loginError.textContent = "Invalid username or password.";
        el.loginPass.value = "";
        return;
      }
      session = nextSession;
      renderUserSlot();
      closeLoginModal();
      Toaster.success("Login successful.");
      editing = null;
      openUploadModal();
    } finally {
      el.loginSubmit.disabled = false;
      el.loginSubmit.textContent = "LOGIN";
    }
  });

  function handleLogout() {
    session = AuthService.logout();
    renderUserSlot();
    closeUploadModal();
    pendingDelete = null;
    el.confirmOverlay.hidden = true;
    Toaster.success("Logged out successfully.");
    renderAll();
  }

  el.uploadCta.addEventListener("click", requestUpload);

  // ---------------------------------------------------------------------
  // Lightbox
  // ---------------------------------------------------------------------
  let lightboxUrl = "";

  function openLightbox(recordsForView, index) {
    lightboxRecords = recordsForView;
    lightboxIndex = index;
    renderLightbox();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightboxIndex = null;
    if (lightboxUrl) {
      URL.revokeObjectURL(lightboxUrl);
      lightboxUrl = "";
    }
    el.lightbox.hidden = true;
    el.lightbox.innerHTML = "";
    document.body.style.overflow = "";
  }

  function navigateLightbox(nextIndex) {
    lightboxIndex = nextIndex;
    renderLightbox();
  }

  function renderLightbox() {
    if (lightboxIndex === null) {
      el.lightbox.hidden = true;
      el.lightbox.innerHTML = "";
      return;
    }
    const active = lightboxRecords[lightboxIndex];
    if (!active) {
      closeLightbox();
      return;
    }
    if (lightboxUrl) {
      URL.revokeObjectURL(lightboxUrl);
      lightboxUrl = "";
    }
    const src = recordSrc(active);
    if (active.imageBlob) lightboxUrl = src;

    el.lightbox.hidden = false;
    el.lightbox.setAttribute("role", "dialog");
    el.lightbox.setAttribute("aria-modal", "true");
    el.lightbox.setAttribute(
      "aria-label",
      `${active.title}, image ${lightboxIndex + 1} of ${lightboxRecords.length}`,
    );
    el.lightbox.innerHTML = `
      <button type="button" class="gal-lightbox__close" aria-label="Close image viewer">×</button>
      <button type="button" class="gal-lightbox__nav gal-lightbox__nav--prev" aria-label="Previous image">‹</button>
      <div class="gal-lightbox__stage">
        <div class="gal-lightbox__frame">
          ${src ? `<img src="${src}" alt="${escapeHtml(active.title)}" />` : ""}
        </div>
        <div class="gal-lightbox__info">
          <p class="gal-lightbox__cat"></p>
          <h2 class="gal-lightbox__title"></h2>
          ${active.description ? '<p class="gal-lightbox__desc"></p>' : ""}
          <p class="gal-lightbox__count"></p>
        </div>
      </div>
      <button type="button" class="gal-lightbox__nav gal-lightbox__nav--next" aria-label="Next image">›</button>
    `;
    el.lightbox.querySelector(".gal-lightbox__cat").textContent = active.category;
    el.lightbox.querySelector(".gal-lightbox__title").textContent = active.title;
    if (active.description) el.lightbox.querySelector(".gal-lightbox__desc").textContent = active.description;
    el.lightbox.querySelector(".gal-lightbox__count").textContent =
      `${lightboxIndex + 1} / ${lightboxRecords.length}`;

    el.lightbox.addEventListener("mousedown", (event) => {
      if (event.target === el.lightbox) closeLightbox();
    });
    el.lightbox.querySelector(".gal-lightbox__close").addEventListener("click", closeLightbox);
    el.lightbox.querySelector(".gal-lightbox__stage").addEventListener("mousedown", (e) => e.stopPropagation());
    el.lightbox.querySelector(".gal-lightbox__nav--prev").addEventListener("mousedown", (e) => e.stopPropagation());
    el.lightbox.querySelector(".gal-lightbox__nav--next").addEventListener("mousedown", (e) => e.stopPropagation());
    el.lightbox.querySelector(".gal-lightbox__nav--prev").addEventListener("click", () => {
      navigateLightbox((lightboxIndex - 1 + lightboxRecords.length) % lightboxRecords.length);
    });
    el.lightbox.querySelector(".gal-lightbox__nav--next").addEventListener("click", () => {
      navigateLightbox((lightboxIndex + 1) % lightboxRecords.length);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (lightboxIndex === null) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") {
      navigateLightbox((lightboxIndex - 1 + lightboxRecords.length) % lightboxRecords.length);
    }
    if (event.key === "ArrowRight") {
      navigateLightbox((lightboxIndex + 1) % lightboxRecords.length);
    }
  });

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /** Simple focus trap: Tab/Shift+Tab stay within `container` while `isClosed()` is false. */
  function trapFocus(container, isClosed) {
    document.addEventListener("keydown", (event) => {
      if (isClosed() || event.key !== "Tab") return;
      const focusables = container.querySelectorAll(
        'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  return { boot };
})();

document.addEventListener("DOMContentLoaded", () => {
  App.boot();
});