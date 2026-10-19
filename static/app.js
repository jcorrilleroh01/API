// ============ Elementos ============
const $ = (selector) => document.querySelector(selector);

const form = $("#form");
const nombre = $("#nombre");
const peso = $("#peso");
const medidas = $("#medidas");
const liquidos = $("#liquidos");
const bateria = $("#bateria");
const boton = $("#btn");

const monitor = $("#monitor");
const bolsa = $("#bag");
const estadoTexto = $("#status");

const modal = $("#modal");
const pase = $("#pass");
const gauge = $("#gauge");
const gaugeNum = $("#gauge-num");
const toast = $("#toast");

const CIRCUNFERENCIA = 326.73; // 2 * PI * 52 (radio del círculo)
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TEXTOS = {
  inicial: "Ajusta los datos y mira tu maleta en el escáner.",
  scanning: "Escaneando tu maleta…",
  ok: "Tu maleta puede volar sin coste extra.",
  extra: "Tu maleta puede volar pagando un suplemento.",
  ko: "Tu maleta no puede volar así.",
};
const SELLOS = { ok: "APROBADA", extra: "PAGA EXTRA", ko: "RECHAZADA" };

const formatear = (n) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: 1 });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ============ Título tipo panel de salidas ============
function animarTitulo(el) {
  const texto = el.dataset.text;
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const aleatoria = () => letras[Math.floor(Math.random() * letras.length)];
  let indice = 0;

  el.textContent = "";
  el.setAttribute("aria-label", texto);

  texto.split(" ").forEach((palabra) => {
    const grupo = document.createElement("span");
    grupo.className = "flap-word";
    grupo.setAttribute("aria-hidden", "true");

    [...palabra].forEach((letra) => {
      const flap = document.createElement("span");
      flap.className = "flap";
      grupo.appendChild(flap);

      if (sinMovimiento) {
        flap.textContent = letra;
        return;
      }

      // cada letra da más vueltas que la anterior, así se van fijando de izquierda a derecha
      const vueltas = 4 + indice * 2;
      indice++;
      let n = 0;
      flap.textContent = aleatoria();
      const timer = setInterval(() => {
        n++;
        if (n >= vueltas) {
          clearInterval(timer);
          flap.textContent = letra;
          flap.classList.add("is-set");
        } else {
          flap.textContent = aleatoria();
        }
      }, 55);
    });

    el.appendChild(grupo);
  });
}

// ============ Vista previa en el escáner ============
function pintarRango(input) {
  const porcentaje = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--fill", porcentaje + "%");
}

function actualizarVista() {
  const kg = Number(peso.value);
  const cm = Number(medidas.value);
  const tipo = form.elements.tipo_maleta.value;

  pintarRango(peso);
  pintarRango(medidas);

  $("#peso-out").textContent = `${formatear(kg)} kg`;
  $("#medidas-out").textContent = `${cm} cm`;
  $("#hud-peso").textContent = `${formatear(kg)} kg`;
  $("#hud-medidas").textContent = `${cm} cm`;

  // la maleta crece con las medidas y se ve más "densa" con el peso
  bolsa.style.setProperty("--scale", (0.6 + (cm / 300) * 0.65).toFixed(3));
  bolsa.style.setProperty("--density", (kg / 50).toFixed(3));
  bolsa.classList.toggle("is-bodega", tipo === "bodega");
  bolsa.classList.toggle("has-liquid", liquidos.checked);
  bolsa.classList.toggle("has-battery", bateria.checked);

  limpiarResultado();
}

function limpiarResultado() {
  monitor.classList.remove("is-ok", "is-extra", "is-ko");
  ponerEstado("inicial");
}

function ponerEstado(estado) {
  estadoTexto.textContent = TEXTOS[estado];
  estadoTexto.dataset.estado = estado;
}

// ============ Validación del nombre ============
function validarNombre() {
  const campo = $("#field-nombre");
  const error = $("#error-nombre");
  const valor = nombre.value.trim();
  let mensaje = "";

  if (valor.length === 0) mensaje = "Escribe el nombre del viajero.";
  else if (valor.length < 2) mensaje = "El nombre debe tener al menos 2 letras.";

  error.textContent = mensaje;
  campo.classList.remove("is-invalid");
  if (mensaje) {
    void campo.offsetWidth; // reinicia la animación de temblor
    campo.classList.add("is-invalid");
    nombre.focus();
    return false;
  }
  return true;
}

// ============ Envío a la API ============
function obtenerEstado(data) {
  if (!data.aprobado) return "ko";
  if (data.coste_extra > 0) return "extra";
  return "ok";
}

function mensajeError(data) {
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => `${d.loc.at(-1)}: ${d.msg}`).join(" · ");
  }
  return data.detail || "La API ha devuelto un error inesperado.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validarNombre()) return;

  const datos = {
    nombre: nombre.value.trim(),
    aerolinea: form.elements.aerolinea.value,
    peso_kg: Number(peso.value),
    tipo_maleta: form.elements.tipo_maleta.value,
    medidas: Number(medidas.value),
    liquidos: liquidos.checked,
    bateria: bateria.checked,
  };

  // empieza la animación del escáner
  limpiarResultado();
  boton.disabled = true;
  boton.classList.add("is-loading");
  boton.textContent = "Escaneando…";
  monitor.classList.add("is-scanning");
  ponerEstado("scanning");
  if (window.innerWidth < 900) monitor.scrollIntoView({ behavior: "smooth", block: "center" });

  try {
    // la petición y la animación van a la vez; se espera a que acaben las dos
    const [respuesta] = await Promise.all([
      fetch("/api/evaluar-equipaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      }),
      esperar(sinMovimiento ? 200 : 2200),
    ]);
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(mensajeError(data));

    const estado = obtenerEstado(data);
    monitor.classList.remove("is-scanning");
    monitor.classList.add(`is-${estado}`);
    ponerEstado(estado);

    await esperar(sinMovimiento ? 0 : 600);
    abrirPase(data, datos, estado);
  } catch (err) {
    monitor.classList.remove("is-scanning");
    ponerEstado("inicial");
    const sinConexion = err instanceof TypeError;
    mostrarAviso(sinConexion ? "No se pudo conectar con la API. Comprueba que el servidor está arrancado." : err.message);
  } finally {
    boton.disabled = false;
    boton.classList.remove("is-loading");
    boton.textContent = "Escanear maleta";
  }
});

// ============ Tarjeta de resultado ============
function abrirPase(data, datos, estado) {
  pase.dataset.estado = estado;
  $("#pass-airline").textContent = datos.aerolinea;
  $("#pass-nombre").textContent = data.nombre;
  $("#pass-tipo").textContent = datos.tipo_maleta === "mano" ? "De mano" : "Facturada";
  $("#pass-peso").textContent = `${formatear(datos.peso_kg)} kg`;
  $("#pass-medidas").textContent = `${datos.medidas} cm`;
  $("#pass-coste").textContent = Number(data.coste_extra).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  $("#stamp").textContent = SELLOS[estado];

  // el motivo viene con frases separadas por ". ", una por línea
  const lista = $("#pass-motivos");
  lista.innerHTML = "";
  data.motivo
    .split(".")
    .map((frase) => frase.trim())
    .filter(Boolean)
    .forEach((frase, i) => {
      const li = document.createElement("li");
      li.textContent = frase;
      li.style.setProperty("--i", i);
      lista.appendChild(li);
    });

  // reinicia el medidor antes de animarlo
  gauge.style.setProperty("--off", CIRCUNFERENCIA);
  gaugeNum.textContent = "0";

  modal.hidden = false;
  void modal.offsetWidth;
  modal.classList.add("is-open");
  $("#again").focus();

  setTimeout(() => {
    gauge.style.setProperty("--off", CIRCUNFERENCIA * (1 - data.porcentaje / 100));
    contar(gaugeNum, data.porcentaje);
  }, 100);

  if (estado === "ok" && window.confetti && !sinMovimiento) {
    setTimeout(() => {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#ffc61a", "#1f9d63", "#9cd2ff", "#ffffff"],
      });
    }, 1000);
  }
}

function contar(el, hasta, duracion = 1400) {
  if (sinMovimiento) {
    el.textContent = hasta;
    return;
  }
  const inicio = performance.now();
  const paso = (ahora) => {
    const p = Math.min((ahora - inicio) / duracion, 1);
    const suave = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(hasta * suave);
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

function cerrarPase() {
  modal.classList.remove("is-open");
  setTimeout(() => (modal.hidden = true), 250);
  limpiarResultado();
  boton.focus();
}

// ============ Aviso de error ============
let timerAviso;
function mostrarAviso(texto) {
  toast.textContent = texto;
  toast.classList.add("is-show");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => toast.classList.remove("is-show"), 5000);
}

// ============ Eventos ============
form.addEventListener("input", (e) => {
  if (e.target === nombre) {
    $("#field-nombre").classList.remove("is-invalid");
    $("#error-nombre").textContent = "";
    return;
  }
  actualizarVista();
});

$("#again").addEventListener("click", cerrarPase);
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarPase();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) cerrarPase();
});

animarTitulo($("#titulo"));
actualizarVista();
