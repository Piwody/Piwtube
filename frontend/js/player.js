import { api } from "./api.js";
import { el, errorBox, formatViews, parseDate, skeletonCards, timeAgo, videoCard } from "./dom.js";

const $ = (selector) => document.querySelector(selector);

const videoId = Number(new URLSearchParams(location.search).get("id"));

const playerBox = $("#player-box");
const player = $("#player");
const title = $("#title");
const meta = $("#meta");
const desc = $("#description");
const toggleDesc = $("#toggle-desc");

const commentList = $("#comments");
const commentCount = $("#comments-count");
const form = $("#comment-form");
const authorInput = $("#author");
const contentInput = $("#content");
const charCount = $("#char-count");
const formStatus = $("#form-status");
const submitBtn = $("#submit-comment");

const recs = $("#recs");
const recsTitle = $("#recs-title");
const reshuffleBtn = $("#reshuffle");

const AUTHOR_KEY = "streamu-author";
const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

let totalComments = 0;

/* ---------------- Video ---------------- */

function renderVideo(video) {
  document.title = `${video.titulo} · PiwTube`;

  player.poster = video.miniatura;
  player.src = video.source;

  title.textContent = video.titulo;
  title.classList.remove("skeleton");

  const created = parseDate(video.fecha);
  meta.classList.remove("skeleton");
  meta.replaceChildren(
    el("span", { id: "views", text: formatViews(video.vistas) }),
    el("span", { "aria-hidden": "true", text: "•" }),
    el("time", { datetime: created.toISOString(), text: dateFormat.format(created) }),
    el("a", {
      class: "tag",
      href: `index.html?category=${encodeURIComponent(video.categoria)}`,
      text: `#${video.categoria}`,
    })
  );

  desc.textContent = video.descripcion || "Sin descripción.";
  requestAnimationFrame(() => {
    toggleDesc.hidden = desc.scrollHeight <= desc.clientHeight + 2;
  });

  recsTitle.textContent = `Más de ${video.categoria}`;
}

player.addEventListener("error", () => {
  if (playerBox.querySelector(".player__error")) return;
  playerBox.append(el("p", { class: "player__error", text: "No se pudo cargar el video desde S3." }));
});

toggleDesc.addEventListener("click", () => {
  const collapsed = desc.classList.toggle("is-collapsed");
  toggleDesc.textContent = collapsed ? "Mostrar más" : "Mostrar menos";
  toggleDesc.setAttribute("aria-expanded", String(!collapsed));
});

/* ---------------- Comentarios ---------------- */

function hue(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

function commentItem(comment, isNew = false) {
  const initial = comment.autor.trim().charAt(0).toUpperCase() || "?";
  return el(
    "li",
    { class: isNew ? "comment is-new" : "comment" },
    el("div", { class: "avatar", "aria-hidden": "true", style: { "--h": hue(comment.autor) }, text: initial }),
    el(
      "div",
      { class: "comment__body" },
      el(
        "div",
        { class: "comment__head" },
        el("span", { class: "comment__author", text: comment.autor }),
        el("time", {
          class: "comment__time",
          datetime: parseDate(comment.fecha).toISOString(),
          text: timeAgo(comment.fecha),
        })
      ),
      el("p", { class: "comment__text", text: comment.contenido })
    )
  );
}

function emptyComments() {
  return el("li", { class: "comment-placeholder comment-empty", text: "Aún no hay comentarios. ¡Sé el primero!" });
}

function setCount(n, animate = false) {
  totalComments = n;
  commentCount.textContent = String(n);
  if (animate) {
    commentCount.classList.remove("bump");
    void commentCount.offsetWidth; // reinicia la animación
    commentCount.classList.add("bump");
  }
}

async function loadComments() {
  commentList.replaceChildren(el("li", { class: "comment-placeholder", text: "Cargando comentarios…" }));

  try {
    const comentarios = await api.getComentarios(videoId);
    setCount(comentarios.length);
    commentList.replaceChildren(
      ...(comentarios.length ? comentarios.map((c) => commentItem(c)) : [emptyComments()])
    );
  } catch (err) {
    commentList.replaceChildren(el("li", {}, errorBox(err.message, loadComments)));
  }
}

function setFormStatus(text, type = "") {
  formStatus.textContent = text;
  formStatus.className = type ? `form-status is-${type}` : "form-status";
}

function updateCharCount() {
  charCount.textContent = `${contentInput.value.length}/${contentInput.maxLength}`;
}

function restoreAuthor() {
  try {
    authorInput.value = localStorage.getItem(AUTHOR_KEY) ?? "";
  } catch {
    /* almacenamiento no disponible */
  }
}

function saveAuthor(name) {
  try {
    localStorage.setItem(AUTHOR_KEY, name);
  } catch {
    /* almacenamiento no disponible */
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const author = authorInput.value.trim();
  const content = contentInput.value.trim();

  if (!author || !content) {
    setFormStatus("Escribe tu nombre y un comentario.", "error");
    (author ? contentInput : authorInput).focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";
  setFormStatus("");

  try {
    const comment = await api.crearComentario(videoId, { autor: author, contenido: content });
    commentList.querySelector(".comment-empty")?.remove();
    commentList.prepend(commentItem(comment, true)); // se agrega sin recargar
    setCount(totalComments + 1, true);

    contentInput.value = "";
    updateCharCount();
    saveAuthor(author);
    setFormStatus("¡Comentario publicado!", "success");
  } catch (err) {
    setFormStatus(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Comentar";
  }
});

contentInput.addEventListener("input", updateCharCount);

/* ---------------- Recomendaciones ---------------- */

async function loadRecommendations() {
  reshuffleBtn.disabled = true;
  recs.replaceChildren(...skeletonCards(5, { compact: true }).map((s) => el("li", {}, s)));

  try {
    const videos = await api.getRecomendaciones(videoId);
    recs.replaceChildren(
      ...(videos.length
        ? videos.map((v, i) => el("li", {}, videoCard(v, { index: i, compact: true })))
        : [el("li", { class: "empty", text: "No hay más videos todavía." })])
    );
  } catch (err) {
    recs.replaceChildren(el("li", {}, errorBox(err.message, loadRecommendations)));
  } finally {
    reshuffleBtn.disabled = false;
  }
}

reshuffleBtn.addEventListener("click", loadRecommendations);

/* ---------------- Inicio ---------------- */

async function init() {
  if (!Number.isInteger(videoId) || videoId <= 0) {
    location.replace("index.html");
    return;
  }

  restoreAuthor();
  updateCharCount();

  try {
    const video = await api.getVideo(videoId);
    renderVideo(video);

    api
      .sumarVista(videoId)
      .then((updated) => {
        const views = document.querySelector("#views");
        if (views) views.textContent = formatViews(updated.vistas);
      })
      .catch(() => {});

    loadComments();
    loadRecommendations();
  } catch (err) {
    document.querySelector("main").replaceChildren(errorBox(err.message, () => location.reload()));
  }
}

init();
