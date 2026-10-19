from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal
from model import ValidarEquipaje, ResultadoEquipaje




app = FastAPI(
    title="Validador de Equipaje",
    description="API para comprobar si una maleta cumple las normas de la aerolinea",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=FileResponse)
def inicio():
    return FileResponse("index.html")


@app.post("/api/evaluar-equipaje", response_model=ResultadoEquipaje)
def evaluar_equipaje(equipaje: ValidarEquipaje):
    """
    Calcula la probabilidad de que tu maleta entre en el avion
    """
    score = 100
    motivo = ""
    coste_extra = 0

    if equipaje.aerolinea == "Iberia":
        if equipaje.tipo_maleta == "bodega":
            if equipaje.peso_kg > 23:
                score -= 25
                coste_extra += 30
                motivo += "Exceso de peso, debe pagar 30 € extra. "
            if equipaje.medidas > 158:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.bateria:
                score = 0
                motivo += "Su maleta no puede contener baterias de litio en la bodega. "
        else:
            if equipaje.peso_kg > 10:
                score -= 25
                coste_extra += 30
                motivo += "Exceso de peso, debe pagar 30 € extra. "
            if equipaje.medidas > 115:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.liquidos:
                score = 0
                motivo += "Su maleta de mano no puede contener liquidos mayores a 100ml. "

    elif equipaje.aerolinea == "Ryanair":
        if equipaje.tipo_maleta == "bodega":
            if equipaje.peso_kg > 23:
                score -= 25
                coste_extra += 30
                motivo += "Exceso de peso, debe pagar 30 € extra. "
            if equipaje.medidas > 158:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.bateria:
                score = 0
                motivo += "Su maleta no puede contener baterias de litio en la bodega. "
        else:
            if equipaje.peso_kg > 10:
                score -= 25
                coste_extra += 25
                motivo += "Exceso de peso, debe pagar 25 € extra. "
            if equipaje.medidas > 115:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.liquidos:
                score = 0
                motivo += "Su maleta de mano no puede contener liquidos mayores a 100ml. "

    elif equipaje.aerolinea == "Vueling":
        if equipaje.tipo_maleta == "bodega":
            if equipaje.peso_kg > 20:
                score -= 25
                coste_extra += 15
                motivo += "Exceso de peso, debe pagar 15 € extra. "
            if equipaje.medidas > 158:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.bateria:
                score = 0
                motivo += "Su maleta no puede contener baterias de litio en la bodega. "
        else:
            if equipaje.peso_kg > 10:
                score -= 25
                coste_extra += 30
                motivo += "Exceso de peso, debe pagar 30 € extra. "
            if equipaje.medidas > 115:
                score = 0
                motivo += "Su maleta es demasiado grande. "
            if equipaje.liquidos:
                score = 0
                motivo += "Su maleta de mano no puede contener liquidos mayores a 100ml. "

    aprobado = score > 0
    if motivo == "":
        motivo = "Tu maleta puede acceder al avion"

    return {
        "nombre": equipaje.nombre,
        "aprobado": aprobado,
        "porcentaje": score,
        "motivo": motivo.strip(),
        "coste_extra": coste_extra,
    }
