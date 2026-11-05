from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


def ahora():
    return datetime.now(timezone.utc)


# ============================ VIDEOS ============================
class Videos(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    titulo: str
    descripcion: str | None = None
    categoria: str = Field(index=True)
    source: str                      # URL del video en S3
    miniatura: str                   # URL de la imagen en S3
    duracion: int | None = None      # en segundos
    vistas: int = Field(default=0)
    es_publico: bool = Field(default=True)
    fecha: datetime = Field(default_factory=ahora)

    # Un video tiene muchos comentarios
    comentarios: list["Comentarios"] = Relationship(back_populates="video", cascade_delete=True)


class VideosCreate(SQLModel):
    titulo: str = Field(min_length=1, max_length=120)
    descripcion: str | None = None
    categoria: str = Field(min_length=1, max_length=40)
    source: str
    miniatura: str
    duracion: int | None = Field(default=None, ge=0)
    es_publico: bool = True


class VideosUpdate(SQLModel):
    titulo: str | None = None
    descripcion: str | None = None
    categoria: str | None = None
    source: str | None = None
    miniatura: str | None = None
    duracion: int | None = None
    es_publico: bool | None = None


# ========================== COMENTARIOS ==========================
class Comentarios(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    autor: str
    contenido: str
    fecha: datetime = Field(default_factory=ahora)
    video_id: int = Field(foreign_key="videos.id", index=True)

    # Cada comentario pertenece a un video
    video: Videos | None = Relationship(back_populates="comentarios")


class ComentariosCreate(SQLModel):
    autor: str = Field(min_length=1, max_length=50)
    contenido: str = Field(min_length=1, max_length=500)
