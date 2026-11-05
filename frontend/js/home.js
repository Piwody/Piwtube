import { api } from "./api.js";
import { el, errorBox, skeletonCards, videoCard } from "./dom.js";

const $ = (selector) => document.querySelector(selector);

const grid = $("#grid");
const discover = $("#discover");
const chips = $("#chips");
const status = $("#status");
const searchForm = $("#search-form");
const searchInput = $("#search");
const sortSelect = $("#sort");
const shuffleBtn = $("#shuffle");
const discoverTitle = $("#discover-title");

// Estado inicial desde la URL: index.html?category=Música&search=docker
const params = new URLSearchParams(location.search);
const state = {
  category: params.get("category"),
  search: params.get("search") ?? "",
  sort: "recent",
};
searchInput.value = state.search;

function syncUrl() {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.search) p.set("search", state.search);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/* ---------------- Categorías ---------------- */

function chip(label, value) {
  return el("button", {
    class: "chip",
    type: "button",
    text: label,
    "aria-pressed": String(state.category === value),
    dataset: { value: value ?? "" },
    onClick: () => {
      if (state.category === value) return;
      state.category = value;
      updateChips();
      refresh();
    },
  });
}

function updateChips() {
  for (const button of chips.children) {
    const value = button.dataset.value || null;
    button.setAttribute("aria-pressed", String(value === state.category));
  }
}

async function loadCategories() {
  try {
    const categories = await api.getCategorias();
    chips.replaceChildren(chip("Todo", null), ...categories.map((c) => chip(c, c)));
  } catch {
    chips.replaceChildren();
  }
}

/* ---------------- Catálogo ---------------- */

function ordenar(videos, criterio) {
  if (criterio === "popular") videos.sort((a, b) => b.vistas - a.vistas);
  else if (criterio === "title") videos.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  else videos.sort((a, b) => b.id - a.id); // más recientes primero
}

let catalogRequest = 0;

async function loadCatalog() {
  const current = ++catalogRequest;
  grid.replaceChildren(...skeletonCards(8));
  status.textContent = "";

  try {
    // Si hay texto en el buscador usa /videos/busqueda, si no /videos/
    const videos = state.search
      ? await api.buscarVideos(state.search, state.category)
      : await api.getVideos(state.category);
    if (current !== catalogRequest) return; // llegó una respuesta vieja

    ordenar(videos, state.sort);

    if (!videos.length) {
      const text = state.search ? `Sin resultados para “${state.search}”.` : "Aún no hay videos.";
      grid.replaceChildren(el("p", { class: "empty", text }));
      return;
    }

    grid.replaceChildren(...videos.map((video, i) => videoCard(video, { index: i })));
    status.textContent = `${videos.length} ${videos.length === 1 ? "video" : "videos"}`;
  } catch (err) {
    if (current !== catalogRequest) return;
    grid.replaceChildren(errorBox(err.message, loadCatalog));
  }
}

/* ---------------- Descubre (aleatorios) ---------------- */

let discoverRequest = 0;

async function loadDiscover() {
  const current = ++discoverRequest;
  shuffleBtn.disabled = true;
  discoverTitle.textContent = state.category ? `Descubre en ${state.category}` : "Descubre";
  discover.replaceChildren(...skeletonCards(5));

  try {
    const videos = await api.getAleatorios(state.category, 10);
    if (current !== discoverRequest) return;
    discover.replaceChildren(
      ...(videos.length
        ? videos.map((video, i) => videoCard(video, { index: i }))
        : [el("p", { class: "empty", text: "Nada por aquí todavía." })])
    );
  } catch (err) {
    if (current !== discoverRequest) return;
    discover.replaceChildren(errorBox(err.message, loadDiscover));
  } finally {
    if (current === discoverRequest) shuffleBtn.disabled = false;
  }
}

function refresh() {
  syncUrl();
  loadDiscover();
  loadCatalog();
}

/* ---------------- Eventos ---------------- */

let debounce;
searchInput.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    state.search = searchInput.value.trim();
    syncUrl();
    loadCatalog();
  }, 300);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(debounce);
  state.search = searchInput.value.trim();
  syncUrl();
  loadCatalog();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  loadCatalog();
});

shuffleBtn.addEventListener("click", loadDiscover);

loadCategories();
refresh();
