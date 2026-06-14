// ── GRANO ─────────────────────────────────────────────
const gc = document.getElementById("grain-canvas");
const gx = gc.getContext("2d");

function resizeGrain() {
  gc.width = innerWidth;
  gc.height = innerHeight;
}
resizeGrain();
window.addEventListener("resize", resizeGrain);

let lastTs = 0;
function drawGrain(ts) {
  if (ts - lastTs > 80) {
    lastTs = ts;
    const w = gc.width, h = gc.height;
    const img = gx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 20;
    }
    gx.putImageData(img, 0, 0);
  }
  requestAnimationFrame(drawGrain);
}
requestAnimationFrame(drawGrain);

// ── NAVEGACIÓN ────────────────────────────────────────
let nombre = "";
let respuesta = null;

function glitchTransition(callback) {
  const overlay = document.getElementById("glitch-overlay");
  overlay.classList.add("active");
  setTimeout(() => {
    callback();
    setTimeout(() => overlay.classList.remove("active"), 300);
  }, 100);
}

function showScreen(id) {
  glitchTransition(() => {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  });
}

function goS2() {
  nombre = document.getElementById("inp-nombre").value.trim();
  if (!nombre) {
    document.getElementById("err1").style.display = "block";
    document.getElementById("inp-nombre").focus();
    return;
  }
  document.getElementById("err1").style.display = "none";
  document.getElementById("s2-label").textContent =
    "002_DETALLES // " + nombre.toUpperCase();
  showScreen("s2");
}

function goS3() {
  showScreen("s3");
}

// ── SCREEN 3 ──────────────────────────────────────────
function pickResp(v) {
  respuesta = v;
  const si = document.getElementById("c-si");
  const no = document.getElementById("c-no");
  si.classList.remove("selected", "dimmed");
  no.classList.remove("selected", "dimmed");
  const extras = document.getElementById("si-extras");
  if (v === "si") {
    si.classList.add("selected");
    no.classList.add("dimmed");
    extras.style.display = "block";
  } else {
    no.classList.add("selected");
    si.classList.add("dimmed");
    extras.style.display = "none";
    const drama = document.getElementById("drama-msg");
    drama.classList.remove("active");
    void drama.offsetWidth;
    drama.classList.add("active");
    setTimeout(() => drama.classList.remove("active"), 2200);
  }
  document.getElementById("err3").style.display = "none";
}

// Chips de restricción
document.querySelectorAll(".r-chip input").forEach((cb) => {
  cb.addEventListener("change", () => {
    cb.closest(".r-chip").classList.toggle("checked", cb.checked);
    if (cb.id === "cb-otras") {
      document.getElementById("otras-input").style.display = cb.checked ? "block" : "none";
    }
  });
});

function getRestricciones() {
  const lista = [];
  document.querySelectorAll(".r-chip input:checked").forEach((cb) => {
    if (cb.value !== "otras") lista.push(cb.value);
  });
  const otras = document.getElementById("otras-input").value.trim();
  if (otras) lista.push(otras);
  return lista;
}

// ── CALENDARIO ────────────────────────────────────────
function addCalendar() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cumple Fau//ES",
    "BEGIN:VEVENT",
    "DTSTART:20260623T190000",
    "DTEND:20260624T020000",
    "SUMMARY:Cumpleanos Fau",
    "LOCATION:Andres Maria Ampere 7782\\, Cordoba",
    "DESCRIPTION:La cena mas esperada",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cumple-fau.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const url =
      "https://calendar.google.com/calendar/r/eventedit" +
      "?text=Cumplea%C3%B1os+Fau" +
      "&dates=20260623T190000%2F20260624T020000" +
      "&location=Andres+Maria+Ampere+7782%2C+C%C3%B3rdoba" +
      "&details=La+cena+m%C3%A1s+esperada";
    window.open(url, "_blank");
  }
}

// ── GUARDAR EN SUPABASE ───────────────────────────────
async function guardarRSVP(nombre, asistencia, restricciones) {
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('PONE')) return;
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": CONFIG.SUPABASE_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        nombre,
        asistencia,
        restricciones: restricciones.join(", "),
      }),
    });
  } catch (e) {
    // falla silencioso — WhatsApp igual se abre
  }
}

// ── ENVIAR POR WHATSAPP ───────────────────────────────
async function enviar() {
  if (!respuesta) {
    document.getElementById("err3").style.display = "block";
    return;
  }
  const restr = respuesta === "si" ? getRestricciones() : [];
  await guardarRSVP(nombre, respuesta, restr);

  const numero = "5493512382733";
  let msg;
  if (respuesta === "si") {
    msg = `Hola Fau! Soy *${nombre}* y confirmo que *SI voy* a tu cumple el 23 de Junio.`;
    if (restr.length > 0) {
      msg += `\n\nRestricciones alimenticias: *${restr.join(", ")}*`;
    } else {
      msg += "\n\nComo de todo, sin restricciones.";
    }
    msg += "\n\nNos vemos ahi!";
  } else {
    msg = `Hola Fau! Soy *${nombre}* y lamentablemente *no voy a poder ir* a tu cumple el 23 de Junio. Que la pases increible!`;
  }
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
}

// Enter en el input avanza a s2
document.getElementById("inp-nombre").addEventListener("keydown", (e) => {
  if (e.key === "Enter") goS2();
});

// ── CURSOR TRAIL 🧿 (solo desktop) ───────────────────
let lastTrail = 0;
document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastTrail < 60) return;
  lastTrail = now;
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.textContent = "🧿";
  dot.style.left = e.clientX + "px";
  dot.style.top  = e.clientY + "px";
  document.body.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "0"; });
  setTimeout(() => dot.remove(), 450);
});
