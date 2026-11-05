# PiwTube — Plataforma de Streaming de Video

Proyecto final de Programación Web — Mateo Cantos

Aplicación web Full Stack que muestra videos almacenados en **AWS S3**, con un backend en **FastAPI + SQLModel (SQLite)** y un frontend en **HTML, CSS y JavaScript** .

## Arquitectura

```
Navegador
   ├── Bucket piwtube-web (S3)  →  index.html, video.html, css, js, img
   ├── API FastAPI (:8000)      →  SQLite: videos, categorías, URLs de S3 y comentarios
   └── Bucket piwtube (S3)      →  source/vid/*.mp4  y  source/img/*.jpg
```

La base de datos no guarda los videos: guarda la **URL de S3** de cada video y su miniatura. El frontend pide esas URLs a la API y el `<video>` las reproduce directo desde S3.

## Estructura

```
proyecto-streaming/
├── API/
│   ├── app/routers/
│   │   ├── videos.py         # rutas de videos
│   │   └── comentarios.py    # rutas de comentarios
│   ├── db.py                 # conexión SQLite + SessionDep
│   ├── models.py             # Videos 1:N Comentarios
│   ├── main.py               # FastAPI + CORS + routers
│   ├── cargar_videos.py      # carga los videos iniciales
│   └── requirements.txt
└── frontend/
    ├── index.html            # galería
    ├── video.html            # reproductor + comentarios + recomendaciones
    ├── css/styles.css        # Mobile First, Grid y Flexbox
    ├── img/logo.png
    └── js/
        ├── config.js         # URL de la API
        ├── api.js            # llamadas fetch a la API
        ├── dom.js            # creación de elementos con createElement
        ├── home.js           # lógica de la galería
        └── player.js         # lógica del reproductor
```

## Cómo correr la API

```powershell
cd API
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python cargar_videos.py   # solo la primera vez
fastapi dev
```

Swagger: http://localhost:8000/docs

## Cómo correr el frontend

- En local: `cd frontend` y `python -m http.server 5500`, luego abrir http://localhost:5500
- En AWS: http://piwtube-web.s3-website.us-east-2.amazonaws.com (con la API corriendo)

## Agregar un video nuevo

1. Subir el video a `piwtube/source/vid/` y la miniatura a `piwtube/source/img/`.
2. Copiar la **URL del objeto** de cada archivo.
3. En `/docs` → `POST /videos/` → *Try it out*:

```json
{
  "titulo": "Nombre del video",
  "descripcion": "Descripción",
  "categoria": "Comedia",
  "source": "https://piwtube.s3.us-east-2.amazonaws.com/source/vid/video-19.mp4",
  "miniatura": "https://piwtube.s3.us-east-2.amazonaws.com/source/img/video-19.jpg",
  "duracion": 90,
  "es_publico": true
}
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/videos/?categoria=` | Catálogo completo (filtro opcional por categoría) |
| GET | `/videos/busqueda?titulo_buscar=&descripcion_buscar=&categoria_buscar=` | Buscar videos |
| GET | `/videos/categorias` | Lista de categorías |
| GET | `/videos/aleatorios?categoria=&cantidad=10` | Videos aleatorios |
| POST | `/videos/` | Crear un video |
| GET | `/videos/{id}` | Detalle de un video |
| GET | `/videos/{id}/recomendaciones` | 10 videos aleatorios de la misma categoría |
| PATCH | `/videos/{id}/vista` | Sumar una vista |
| PATCH | `/videos/{id}` | Editar un video |
| DELETE | `/videos/{id}` | Eliminar un video y sus comentarios |
| GET | `/videos/{id}/comentarios` | Comentarios de un video |
| POST | `/videos/{id}/comentarios` | Publicar un comentario |
| DELETE | `/comentarios/{id}` | Eliminar un comentario |

## Tecnologías

FastAPI · SQLModel · SQLite · AWS S3 · HTML · CSS · JavaScript
