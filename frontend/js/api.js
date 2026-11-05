import { API_URL } from "./config.js";

// Quita parámetros vacíos para no mandar ?categoria=null
function query(params = {}) {
  const limpios = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "");
  const qs = new URLSearchParams(limpios).toString();
  return qs ? `?${qs}` : "";
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No hay conexión con la API");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  getVideos: (categoria) => request(`/videos/${query({ categoria })}`),
  buscarVideos: (titulo_buscar, categoria_buscar) =>
    request(`/videos/busqueda${query({ titulo_buscar, categoria_buscar })}`),
  getCategorias: () => request("/videos/categorias"),
  getAleatorios: (categoria, cantidad = 10) => request(`/videos/aleatorios${query({ categoria, cantidad })}`),
  getVideo: (id) => request(`/videos/${id}`),
  sumarVista: (id) => request(`/videos/${id}/vista`, { method: "PATCH" }),
  getRecomendaciones: (id) => request(`/videos/${id}/recomendaciones`),
  getComentarios: (id) => request(`/videos/${id}/comentarios`),
  crearComentario: (id, data) => request(`/videos/${id}/comentarios`, { method: "POST", body: data }),
};
