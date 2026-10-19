# ✈️ Control de Equipaje

API hecha con **FastAPI** que comprueba si una maleta cumple las normas de equipaje de la aerolínea. Incluye una web con un escáner de rayos X animado.

## ¿Qué hace?

El usuario introduce los datos de su maleta y la API responde si puede volar, si tiene que pagar un extra o si queda rechazada.

**Datos de entrada:** nombre, aerolínea (Iberia, Ryanair, Vueling), tipo de maleta (mano o bodega), peso, medidas, líquidos de más de 100 ml y baterías de litio.

**Reglas:**
- Si pesa más de lo permitido → aprobada pagando un coste extra.
- Si mide más de lo permitido → rechazada.
- Si es de mano y lleva líquidos de más de 100 ml → rechazada.
- Si va en bodega y lleva baterías de litio → rechazada.

**Respuesta:**
```json
{
  "nombre": "Jaime",
  "aprobado": true,
  "porcentaje": 75,
  "motivo": "Exceso de peso, debe pagar 15 € extra.",
  "coste_extra": 15.0
}
```

## Cómo ejecutarla

He montado la app en Render.
- Primero he publicado en un repositorio publico la app entera
- Render analiza y coge los archivos del repositorio
- 
Abre `https://api-64fr.onrender.com/` para probar la API.

## Estructura

```
main.py          → API y reglas de validación
requirements.txt → librerías necesarias
index.html       → página principal
static/
  styles.css     → estilos y animaciones
  app.js         → lógica del front y llamada a la API
```
