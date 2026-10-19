from pydantic import BaseModel, Field
from typing import Literal


class ValidarEquipaje(BaseModel):
    nombre: str = Field(min_length=2, max_length=50, description="Nombre del viajero")
    aerolinea: Literal["Iberia", "Ryanair", "Vueling"] = Field(description="Aerolinea")
    peso_kg: float = Field(gt=0, le=50, description="Peso maleta en kg")
    tipo_maleta: Literal["mano", "bodega"] = Field(description="Tipo de maleta")
    medidas: int = Field(gt=0, le=300, description="Alto + ancho + largo en cm")
    liquidos: bool = Field(default=False, description="¿Tiene mas de 100ml en liquidos?")
    bateria: bool = Field(default=False, description="¿Tiene baterias de litio?")


class ResultadoEquipaje(BaseModel):
    nombre: str
    aprobado: bool
    porcentaje: int
    motivo: str
    coste_extra: float
