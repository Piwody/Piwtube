"""
Carga los 18 videos de piwtube en la base de datos.

1. Revisa REGION: abre video-01.mp4 en S3 y mira su "URL del objeto".
   Si dice ".s3.us-east-2.amazonaws.com", cambia REGION a "us-east-2".
2. Ejecuta (con el venv activado):  python cargar_videos.py
   Córrelo UNA sola vez, si no se duplican los videos.
"""
from sqlmodel import Session, SQLModel

from db import engine
from models import Videos

REGION = "us-east-2"
BUCKET = f"https://piwtube.s3.{REGION}.amazonaws.com"
VID = f"{BUCKET}/source/vid"
IMG = f"{BUCKET}/source/img"


VIDEOS = [
    ("01", "Overgrown (Teaser)", "Fantasía", "Avance de la película de Blender Studio.", 82),
    ("02", "Singularity", "Ciencia ficción", "Aventura espacial con estilo de pintura.", 391),
    ("03", "Project Gold", "Fantasía", "Demostración de render estilizado hecho en Blender.", 261),
    ("04", "Wing It!", "Aventura", "Corto animado de Blender Studio.", 238),
    ("05", "Charge", "Aventura", "Corto de acción de Blender Studio.", 263),
    ("06", "Sprite Fright", "Aventura", "Un grupo de adolescentes se adentra en un bosque habitado por pequeñas criaturas.", 630),
    ("07", "Coffee Run", "Comedia", "Una carrera por la ciudad impulsada por el café.", 185),
    ("08", "Spring", "Fantasía", "Una pastora y su perro se enfrentan a espíritus antiguos.", 465),
    ("09", "The Daily Dweebs", "Comedia", "Corto cómico de Blender Studio.", 61),
    ("10", "Agent 327: Operation Barbershop", "Aventura", "El Agente 327 investiga una misteriosa barbería.", 232),
    ("11", "Caminandes 3: Llamigos", "Comedia", "Koro la llama conoce a un pingüino en la Patagonia.", 151),
    ("12", "Glass Half", "Comedia", "Dos visitantes discuten sobre arte en una galería.", 194),
    ("13", "Cosmos Laundromat", "Ciencia ficción", "Una oveja llamada Franck vive un viaje a través de distintos mundos.", 731),
    ("14", "Caminandes 2: Gran Dillama", "Comedia", "Koro la llama intenta cruzar al otro lado de una cerca.", 147),
    ("15", "Tears of Steel", "Ciencia ficción", "Un grupo intenta salvar el mundo de robots en una Ámsterdam futurista.", 735),
    ("16", "Sintel", "Fantasía", "Una joven recorre tierras peligrosas buscando a su dragón.", 888),
    ("17", "Big Buck Bunny", "Comedia", "Un conejo gigante se venga de tres roedores que lo molestan.", 597),
    ("18", "Elephants Dream", "Ciencia ficción", "Dos hombres exploran una extraña máquina infinita.", 655),
]

SQLModel.metadata.create_all(engine)

with Session(engine) as session:
    for numero, titulo, categoria, descripcion, duracion in VIDEOS:
        session.add(
            Videos(
                titulo=titulo,
                categoria=categoria,
                descripcion=descripcion,
                source=f"{VID}/video-{numero}.mp4",
                miniatura=f"{IMG}/video-{numero}.jpg",
                duracion=duracion,
            )
        )
    session.commit()

print(f"Se cargaron {len(VIDEOS)} videos")
