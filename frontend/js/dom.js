/**
 * Crea elementos con createElement + textContent (sin inyectar HTML).
 * el("a", { class: "card", href: "#", text: "Hola", onClick: fn }, hijo1, hijo2)
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style") {
      for (const [prop, v] of Object.entries(value)) node.style.setProperty(prop, String(v));
    } else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? "" : String(value));
    }
  }

  node.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

/* ---------------- Formatos ---------------- */

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const compact = new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 });
export const formatViews = (n) => `${compact.format(n)} ${n === 1 ? "vista" : "vistas"}`;

// SQLite devuelve fechas sin zona horaria: se interpretan como UTC
export function parseDate(value) {
  return new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(value) ? value : `${value}Z`);
}

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(value) {
  const diff = (parseDate(value).getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return "justo ahora";
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "justo ahora";
}

/* ---------------- Componentes ---------------- */

export function thumbnail(video) {
  const img = el("img", { src: video.miniatura, alt: "", loading: "lazy", decoding: "async" });
  const figure = el(
    "figure",
    { class: "thumb" },
    img,
    el("div", { class: "thumb__play", "aria-hidden": "true" }, el("span", { text: "▶" }))
  );

  // Si la miniatura no carga desde S3, se muestra un fondo con ícono
  img.addEventListener("error", () => figure.classList.add("is-broken"), { once: true });

  const duration = formatDuration(video.duracion);
  if (duration) figure.append(el("span", { class: "thumb__badge", text: duration }));
  return figure;
}

export function videoCard(video, { index = 0, compact = false } = {}) {
  return el(
    "article",
    { class: compact ? "card card--compact" : "card", style: { "--i": index } },
    el(
      "a",
      { class: "card__link", href: `video.html?id=${video.id}` },
      thumbnail(video),
      el(
        "div",
        { class: "card__body" },
        el("h3", { class: "card__title", text: video.titulo, title: video.titulo }),
        el(
          "p",
          { class: "card__meta" },
          el("span", { text: video.categoria }),
          el("span", { "aria-hidden": "true", text: "•" }),
          el("span", { text: formatViews(video.vistas) })
        )
      )
    )
  );
}

export function skeletonCards(count, { compact = false } = {}) {
  return Array.from({ length: count }, (_, i) =>
    el(
      "div",
      { class: compact ? "card card--compact sk-card" : "card sk-card", style: { "--i": i }, "aria-hidden": "true" },
      el("div", { class: "skeleton sk-thumb" }),
      el(
        "div",
        { class: "sk-body" },
        el("div", { class: "skeleton sk-line" }),
        el("div", { class: "skeleton sk-line sk-line--short" })
      )
    )
  );
}

export function errorBox(message, onRetry) {
  return el(
    "div",
    { class: "error", role: "alert" },
    el("p", { text: `No se pudo cargar: ${message}` }),
    onRetry && el("button", { class: "btn btn--ghost", type: "button", text: "Reintentar", onClick: onRetry })
  );
}
