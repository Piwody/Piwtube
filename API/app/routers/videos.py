from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import func, select

from db import SessionDep
from models import Videos, VideosCreate, VideosUpdate

router = APIRouter(prefix="/videos", tags=["Videos"])

# OJO: las rutas fijas (/busqueda, /categorias, /aleatorios) van ANTES de /{id}
# si no, FastAPI cree que "busqueda" es un id y da error 422.


# OBTENER TODOS LOS VIDEOS (catálogo, opcional por categoría)
@router.get("/", response_model=list[Videos])
def get_videos(session: SessionDep, categoria: str | None = None):
    consulta = select(Videos).where(Videos.es_publico == True)

    if categoria:
        consulta = consulta.where(Videos.categoria == categoria)

    return session.exec(consulta).all()


# BUSCAR VIDEOS
@router.get("/busqueda", response_model=list[Videos])
def buscar_videos(
    session: SessionDep,
    titulo_buscar: str | None = Query(default=None, min_length=1),
    descripcion_buscar: str | None = Query(default=None, min_length=1),
    categoria_buscar: str | None = Query(default=None, min_length=1),
):
    consulta = select(Videos).where(Videos.es_publico == True)

    if titulo_buscar:
        consulta = consulta.where(Videos.titulo.contains(titulo_buscar))

    if descripcion_buscar:
        consulta = consulta.where(Videos.descripcion.contains(descripcion_buscar))

    if categoria_buscar:
        consulta = consulta.where(Videos.categoria == categoria_buscar)

    return session.exec(consulta).all()


# LISTA DE CATEGORÍAS
@router.get("/categorias", response_model=list[str])
def get_categorias(session: SessionDep):
    consulta = select(Videos.categoria).distinct()
    return session.exec(consulta).all()


# VIDEOS ALEATORIOS (para la sección "Descubre" del inicio)
@router.get("/aleatorios", response_model=list[Videos])
def get_videos_aleatorios(
    session: SessionDep,
    categoria: str | None = None,
    cantidad: int = Query(default=10, ge=1, le=50),
):
    consulta = select(Videos).where(Videos.es_publico == True)

    if categoria:
        consulta = consulta.where(Videos.categoria == categoria)

    consulta = consulta.order_by(func.random()).limit(cantidad)
    return session.exec(consulta).all()


# CREAR VIDEO
@router.post("/", response_model=Videos, status_code=status.HTTP_201_CREATED)
def create_video(video_data: VideosCreate, session: SessionDep):
    video = Videos.model_validate(video_data.model_dump())
    session.add(video)
    session.commit()
    session.refresh(video)
    return video


# OBTENER UN VIDEO POR ID
@router.get("/{id}", response_model=Videos)
def get_video_by_id(id: int, session: SessionDep):
    video_db = session.get(Videos, id)
    if not video_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="El video no fue encontrado"
        )
    return video_db


# 10 RECOMENDACIONES ALEATORIAS DE LA MISMA CATEGORÍA
@router.get("/{id}/recomendaciones", response_model=list[Videos])
def get_recomendaciones(id: int, session: SessionDep):
    video_db = get_video_by_id(id, session)

    consulta = (
        select(Videos)
        .where(Videos.categoria == video_db.categoria)
        .where(Videos.id != id)
        .where(Videos.es_publico == True)
        .order_by(func.random())
        .limit(10)
    )
    return session.exec(consulta).all()


# SUMAR UNA VISTA
@router.patch("/{id}/vista", response_model=Videos)
def sumar_vista(id: int, session: SessionDep):
    video_db = get_video_by_id(id, session)
    video_db.vistas += 1
    session.add(video_db)
    session.commit()
    session.refresh(video_db)
    return video_db


# EDITAR VIDEO
@router.patch("/{id}", response_model=Videos)
def update_video(id: int, video_data: VideosUpdate, session: SessionDep):
    video_db = get_video_by_id(id, session)
    video_db.sqlmodel_update(video_data.model_dump(exclude_unset=True))
    session.add(video_db)
    session.commit()
    session.refresh(video_db)
    return video_db


# ELIMINAR VIDEO (se borran sus comentarios también)
@router.delete("/{id}")
def delete_video(id: int, session: SessionDep):
    video_db = get_video_by_id(id, session)
    session.delete(video_db)
    session.commit()
    return {"mensaje": "Video eliminado"}
