from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from db import SessionDep
from models import Comentarios, ComentariosCreate, Videos

router = APIRouter(tags=["Comentarios"])


def buscar_video(id: int, session: SessionDep) -> Videos:
    video_db = session.get(Videos, id)
    if not video_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="El video no fue encontrado"
        )
    return video_db



@router.get("/videos/{id}/comentarios", response_model=list[Comentarios])
def get_comentarios(id: int, session: SessionDep):
    buscar_video(id, session)
    consulta = (
        select(Comentarios)
        .where(Comentarios.video_id == id)
        .order_by(Comentarios.fecha.desc())
    )
    return session.exec(consulta).all()



@router.post(
    "/videos/{id}/comentarios",
    response_model=Comentarios,
    status_code=status.HTTP_201_CREATED,
)
def create_comentario(id: int, comentario_data: ComentariosCreate, session: SessionDep):
    buscar_video(id, session)

    autor = comentario_data.autor.strip()
    contenido = comentario_data.contenido.strip()
    if not autor or not contenido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre y el comentario son obligatorios"
        )

    comentario = Comentarios(autor=autor, contenido=contenido, video_id=id)
    session.add(comentario)
    session.commit()
    session.refresh(comentario)
    return comentario



@router.delete("/comentarios/{id}")
def delete_comentario(id: int, session: SessionDep):
    comentario_db = session.get(Comentarios, id)
    if not comentario_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="El comentario no fue encontrado"
        )
    session.delete(comentario_db)
    session.commit()
    return {"mensaje": "Comentario eliminado"}
