from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import comentarios, videos
from db import create_all_table

app = FastAPI(lifespan=create_all_table)

# CORS: permite que la página en S3 (u otro origen) consuma la API
origins = [
    "http://piwtube-web.s3-website.us-east-2.amazonaws.com",  # página en S3
    "http://localhost:5500",  # pruebas locales
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router)
app.include_router(comentarios.router)


@app.get("/")
def root():
    return {"hello": "world"}
