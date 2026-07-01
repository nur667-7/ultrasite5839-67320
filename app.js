const state = {
  content: null,
  activeCategory: "all",
  search: "",
  reviewIndex: 0
};

const ui = {
  siteName: document.getElementById("siteName"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  heroPrimaryBtn: document.getElementById("heroPrimaryBtn"),
  heroSecondaryBtn: document.getElementById("heroSecondaryBtn"),
  heroImage: document.getElementById("heroImage"),
  featureGrid: document.getElementById("featureGrid"),
  categoryTabs: document.getElementById("categoryTabs"),
  searchInput: document.getElementById("searchInput"),
  cardGrid: document.getElementById("cardGrid"),
  galleryGrid: document.getElementById("galleryGrid"),
  reviewText: document.getElementById("reviewText"),
  reviewAuthor: document.getElementById("reviewAuthor"),
  faqList: document.getElementById("faqList"),
  contactForm: document.getElementById("contactForm"),
  cardModal: document.getElementById("cardModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalImage: document.getElementById("modalImage"),
  modalTitle: document.getElementById("modalTitle"),
  modalDescription: document.getElementById("modalDescription"),
  modalTags: document.getElementById("modalTags"),
  toast: document.getElementById("toast")
};

init();

async function init() {
  const response = await fetch("./content.json");
  state.content = await response.json();

  applyTheme();
  renderHero();
  renderFeatures();
  renderTabs();
  renderCards();
  renderGallery();
  renderReview();
  renderFaq();
  bindEvents();

  setInterval(() => {
    state.reviewIndex = (state.reviewIndex + 1) % state.content.reviews.length;
    renderReview();
  }, 4500);
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--accent", state.content.theme.accent);
  root.style.setProperty("--accent-dark", state.content.theme.accentDark);
  root.style.setProperty("--warning", state.content.theme.warning);
  root.style.setProperty("--success", state.content.theme.success);
}

function renderHero() {
  ui.siteName.textContent = state.content.name;
  ui.heroTitle.textContent = state.content.hero.title;
  ui.heroSubtitle.textContent = state.content.hero.subtitle;
  ui.heroPrimaryBtn.textContent = state.content.hero.primaryCta;
  ui.heroSecondaryBtn.textContent = state.content.hero.secondaryCta;
  ui.heroImage.src = photoUrl(state.content.hero.imageQuery, 1080, 720, 11);
  ui.heroImage.loading = "lazy";
}

function renderFeatures() {
  ui.featureGrid.innerHTML = state.content.features
    .map((item) => `<article class="feature-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`)
    .join("");
}

function renderTabs() {
  const categories = ["all", ...state.content.categories];
  ui.categoryTabs.innerHTML = categories
    .map((item) => {
      const active = item === state.activeCategory ? "active" : "";
      const label = item === "all" ? "Все" : item;
      return `<button class="tab-btn ${active}" data-tab="${escapeHtml(item)}">${escapeHtml(label)}</button>`;
    })
    .join("");
}

function renderCards() {
  const filtered = state.content.cards.filter((card) => {
    const byCategory = state.activeCategory === "all" || card.category === state.activeCategory;
    const query = state.search.trim().toLowerCase();
    const bySearch = !query || [card.title, card.description, ...(card.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return byCategory && bySearch;
  });

  ui.cardGrid.innerHTML = filtered
    .map((card, idx) => `
      <article class="catalog-card" data-card-id="${escapeHtml(card.id)}">
        <img src="${photoUrl(card.imageQuery, 840, 520, idx + 50)}" alt="${escapeHtml(card.title)}" loading="lazy">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description)}</p>
        <small>${escapeHtml(card.category)}</small>
      </article>
    `)
    .join("");
}

function renderGallery() {
  ui.galleryGrid.innerHTML = state.content.galleryQueries
    .map((query, idx) => `<img loading="lazy" src="${photoUrl(query, 640, 420, idx + 200)}" alt="${escapeHtml(query)}">`)
    .join("");
}

function renderReview() {
  const item = state.content.reviews[state.reviewIndex];
  ui.reviewText.textContent = item.text;
  ui.reviewAuthor.textContent = item.author;
}

function renderFaq() {
  ui.faqList.innerHTML = state.content.faq
    .map((item) => `
      <article class="faq-item">
        <button class="faq-question">${escapeHtml(item.question)}</button>
        <div class="faq-answer">${escapeHtml(item.answer)}</div>
      </article>
    `)
    .join("");
}

function bindEvents() {
  ui.heroPrimaryBtn.addEventListener("click", () => document.getElementById("catalog").scrollIntoView({ behavior: "smooth" }));
  ui.heroSecondaryBtn.addEventListener("click", () => document.getElementById("features").scrollIntoView({ behavior: "smooth" }));

  ui.categoryTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (!tab) return;
    state.activeCategory = tab.dataset.tab;
    renderTabs();
    renderCards();
  });

  ui.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCards();
  });

  ui.cardGrid.addEventListener("click", (event) => {
    const cardNode = event.target.closest("[data-card-id]");
    if (!cardNode) return;
    const card = state.content.cards.find((item) => item.id === cardNode.dataset.cardId);
    if (!card) return;
    openCardModal(card);
  });

  ui.closeModalBtn.addEventListener("click", () => ui.cardModal.close());

  ui.cardModal.addEventListener("click", (event) => {
    const dialogRect = ui.cardModal.getBoundingClientRect();
    const outside =
      event.clientX < dialogRect.left ||
      event.clientX > dialogRect.right ||
      event.clientY < dialogRect.top ||
      event.clientY > dialogRect.bottom;
    if (outside) ui.cardModal.close();
  });

  ui.faqList.addEventListener("click", (event) => {
    const btn = event.target.closest(".faq-question");
    if (!btn) return;
    btn.parentElement.classList.toggle("open");
  });

  ui.contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    event.target.reset();
    ui.toast.classList.add("show");
    setTimeout(() => ui.toast.classList.remove("show"), 1800);
  });
}

function openCardModal(card) {
  ui.modalImage.src = photoUrl(card.imageQuery, 960, 640, 500 + Number(card.id || 1));
  ui.modalTitle.textContent = card.title;
  ui.modalDescription.textContent = card.details;
  ui.modalTags.innerHTML = (card.tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
  ui.cardModal.showModal();
}

function photoUrl(query, width, height, lockSeed) {
  const q = encodeURIComponent(query || "website");
  return `https://loremflickr.com/${width}/${height}/${q}?lock=${lockSeed}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
