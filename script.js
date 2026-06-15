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

// ── AUDIO (Web Audio API, no archivos) ────────────────
let audioCtx;
let soundEnabled = false;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound-btn");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.classList.toggle("on", soundEnabled);
  }
  if (soundEnabled) {
    try {
      const ctx = getAudio();
      ctx.resume().then(() => {
        // beep de confirmación directo (sin pasar por soundEnabled)
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = 880;
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(); osc.stop(ctx.currentTime + 0.12);
      });
    } catch(e) { soundEnabled = false; if (btn) btn.textContent = "🔇"; }
  }
}

function playTone(freq, dur = 0.08, vol = 0.07, type = "sine") {
  if (!soundEnabled) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}
function playClick()   { playTone(880, 0.06, 0.06); }
function playGlitch()  { playTone(180, 0.04, 0.05, "square"); }
function playSuccess() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.13, 0.07), i * 90)); }
function playSad()     { [400, 340, 290, 220].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 0.07), i * 110)); }

// ── CONFETTI ──────────────────────────────────────────
const confettiCanvas = document.getElementById("confetti-canvas");
const cx = confettiCanvas.getContext("2d");
let particles = [];
let confettiRunning = false;

function launchConfetti(originX, originY, count = 80) {
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
  const colors = ["#1a6ecc","#f0f0f0","#FFD700","#FF6B6B","#4ECDC4","#A8E6CF","#FF8C94","#C5A3FF"];
  for (let i = 0; i < count; i++) {
    const fromTop = originY == null;
    const angle = fromTop ? 0 : (Math.random() * Math.PI * 2);
    const speed = Math.random() * 8 + 3;
    particles.push({
      x:     originX ?? Math.random() * innerWidth,
      y:     originY ?? -10,
      vx:    fromTop ? (Math.random() - 0.5) * 5 : Math.cos(angle) * speed,
      vy:    fromTop ? (Math.random() * 4 + 1)   : Math.sin(angle) * speed - 4,
      w:     Math.random() * 10 + 5,
      h:     Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot:   Math.random() * Math.PI * 2,
      rotV:  (Math.random() - 0.5) * 0.18,
      grav:  0.13 + Math.random() * 0.08,
    });
  }
  if (!confettiRunning) animateConfetti();
}

function animateConfetti() {
  confettiRunning = true;
  cx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles = particles.filter(p =>
    p.y < confettiCanvas.height + 40 && p.x > -60 && p.x < confettiCanvas.width + 60
  );
  if (particles.length === 0) { confettiRunning = false; return; }
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.grav;
    p.vx *= 0.99;
    p.rot += p.rotV;
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(p.rot);
    cx.fillStyle = p.color;
    cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cx.restore();
  });
  requestAnimationFrame(animateConfetti);
}

// ── NAVEGACIÓN ────────────────────────────────────────
let nombre  = "";
let respuesta = null;

function glitchTransition(callback) {
  playGlitch();
  const overlay = document.getElementById("glitch-overlay");
  overlay.classList.add("active");
  setTimeout(() => {
    callback();
    setTimeout(() => overlay.classList.remove("active"), 300);
  }, 100);
}

function showScreen(id) {
  glitchTransition(() => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
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
  playClick();
  document.getElementById("err1").style.display = "none";
  document.getElementById("s2-label").textContent = "002_DETALLES // " + nombre.toUpperCase();
  const greeting = document.getElementById("s2-greeting");
  if (greeting) greeting.textContent = "HEY, " + nombre.toUpperCase() + ".";
  showScreen("s2");
}

function goS3() {
  playClick();
  showScreen("s3");
}

function goS2FromS3() {
  playClick();
  respuesta = null;
  const si = document.getElementById("c-si");
  const no = document.getElementById("c-no");
  si.classList.remove("selected", "dimmed");
  no.classList.remove("selected", "dimmed");
  document.getElementById("si-extras").style.display = "none";
  showScreen("s2");
}

// ── COUNTDOWN ─────────────────────────────────────────
(function startCountdown() {
  const target = new Date("2026-06-27T19:00:00-03:00");
  const pad = n => String(n).padStart(2, "0");
  let prevS = -1;

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      ["cd-days","cd-hours","cd-mins","cd-secs"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "00";
      });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const ids = ["cd-days","cd-hours","cd-mins","cd-secs"];
    const vals = [d, h, m, s];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const next = pad(vals[i]);
      if (el.textContent !== next) {
        el.textContent = next;
        el.classList.remove("tick");
        void el.offsetWidth;
        el.classList.add("tick");
        setTimeout(() => el.classList.remove("tick"), 200);
      }
    });
  }
  tick();
  setInterval(tick, 1000);
})();

// ── SCREEN 3 — ELEGIR SÍ O NO ─────────────────────────
const dramaVariants = [
  { text: "FAU VA\nA LLORAR",       sub: "esto queda en el registro" },
  { text: "¿EN SERIO\nNO VAS?",     sub: "...te lo vas a perder" },
  { text: "ÚLTIMA\nCHANCE.",        sub: "todavía podés cambiar de opinión" },
  { text: "OK.\nFAU ENTIENDE.",     sub: "igual te va a extrañar" },
];
let dramaIdx = 0;

function pickResp(v) {
  respuesta = v;
  const si = document.getElementById("c-si");
  const no = document.getElementById("c-no");
  si.classList.remove("selected", "dimmed");
  no.classList.remove("selected", "dimmed");
  const extras = document.getElementById("si-extras");

  if (v === "si") {
    playSuccess();
    si.classList.add("selected");
    no.classList.add("dimmed");
    extras.style.display = "block";
    const rect = si.getBoundingClientRect();
    launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
  } else {
    playSad();
    no.classList.add("selected");
    si.classList.add("dimmed");
    extras.style.display = "none";

    const s3 = document.getElementById("s3");
    s3.classList.add("shake");
    setTimeout(() => s3.classList.remove("shake"), 600);

    const drama = document.getElementById("drama-msg");
    const dramaTextEl = document.getElementById("drama-text");
    const dramaSubEl  = document.getElementById("drama-sub");
    const v = dramaVariants[dramaIdx % dramaVariants.length];
    dramaIdx++;
    if (dramaTextEl) dramaTextEl.innerHTML = v.text.replace("\n", "<br>");
    if (dramaSubEl)  dramaSubEl.textContent = v.sub;
    drama.classList.remove("active");
    void drama.offsetWidth;
    drama.classList.add("active");
    setTimeout(() => drama.classList.remove("active"), 2600);
  }
  document.getElementById("err3").style.display = "none";
}

// ── RESTRICCIONES ─────────────────────────────────────
document.querySelectorAll(".r-chip input").forEach(cb => {
  cb.addEventListener("change", () => {
    cb.closest(".r-chip").classList.toggle("checked", cb.checked);
    if (cb.id === "cb-otras") {
      document.getElementById("otras-input").style.display = cb.checked ? "block" : "none";
    }
  });
});

function getRestricciones() {
  const lista = [];
  document.querySelectorAll(".r-chip input:checked").forEach(cb => {
    if (cb.value !== "otras") lista.push(cb.value);
  });
  const otras = document.getElementById("otras-input").value.trim();
  if (otras) lista.push(otras);
  return lista;
}

// ── COMIDA — reacción con emojis flotantes ─────────────
const foodEmojis = ["🌮","🔥","🌮","😍","🤤","🔥","✨","🌶️"];
let foodReacted = false;
function reactFood(el) {
  const rect = el.getBoundingClientRect();
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const span = document.createElement("span");
      span.className = "food-float";
      span.textContent = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
      span.style.left = (rect.left + Math.random() * rect.width) + "px";
      span.style.top  = (rect.top  + Math.random() * rect.height * 0.5) + "px";
      document.body.appendChild(span);
      setTimeout(() => span.remove(), 1100);
    }, i * 80);
  }
  if (!foodReacted) {
    el.querySelector(".food-hint").textContent = "¡TIENE BUENA PINTA!";
    foodReacted = true;
  }
  playTone(660, 0.07, 0.05);
}

// ── CALENDARIO ────────────────────────────────────────
function addCalendar() {
  playClick();
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cumple Fau//ES",
    "BEGIN:VEVENT",
    "DTSTART:20260627T190000",
    "DTEND:20260628T020000",
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
      "&dates=20260627T190000%2F20260628T020000" +
      "&location=Andres+Maria+Ampere+7782%2C+C%C3%B3rdoba" +
      "&details=La+cena+m%C3%A1s+esperada";
    window.open(url, "_blank");
  }
}

// ── GUARDAR EN SUPABASE ───────────────────────────────
async function guardarRSVP(nombre, asistencia, restricciones) {
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes("PONE")) return;
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": CONFIG.SUPABASE_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ nombre, asistencia, restricciones: restricciones.join(", ") }),
    });
  } catch (e) {}
}

// ── ENVIAR ────────────────────────────────────────────
async function enviar() {
  if (!respuesta) {
    document.getElementById("err3").style.display = "block";
    return;
  }
  playClick();
  const restr = respuesta === "si" ? getRestricciones() : [];
  await guardarRSVP(nombre, respuesta, restr);

  const numero = "5493512382733";
  let msg;
  if (respuesta === "si") {
    msg = `Hola Fau! Soy *${nombre}* y confirmo que *SI voy* a tu cumple el 27 de Junio.`;
    if (restr.length > 0) msg += `\n\nRestricciones alimenticias: *${restr.join(", ")}*`;
    else msg += "\n\nComo de todo, sin restricciones.";
    msg += "\n\nNos vemos ahi!";
  } else {
    msg = `Hola Fau! Soy *${nombre}* y lamentablemente *no voy a poder ir* a tu cumple el 27 de Junio. Que la pases increible!`;
  }
  // Guardamos el mensaje para enviarlo después del choque los 5
  window._waMsgPendiente = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  goS4();
}

// ── PANTALLA 4 — FINALE ───────────────────────────────
function goS4() {
  const titleEl = document.getElementById("s4-title");
  const msgEl   = document.getElementById("s4-msg");
  const subEl   = document.getElementById("s4-sub");
  const emojiEl = document.getElementById("s4-emoji");

  if (respuesta === "si") {
    if (titleEl)  titleEl.textContent  = "¡LISTO!";
    if (msgEl)    msgEl.innerHTML      = "FAU YA SABE QUE VAS.<br>NOS VEMOS EL 27 JUN.";
    if (subEl)    subEl.textContent    = nombre.toUpperCase() + ", QUE GANAS DE VERTE.";
    if (emojiEl)  emojiEl.textContent  = "🎉";
    showScreen("s4");
    setTimeout(() => { playSuccess(); launchConfetti(null, null, 130); }, 350);
    setTimeout(showPaw, 2000);
  } else {
    if (titleEl)  titleEl.textContent  = "OK.";
    if (msgEl)    msgEl.innerHTML      = "FAU LO ENTIENDE.<br>O NO. PERO BUENO.";
    if (subEl)    subEl.textContent    = nombre.toUpperCase() + ", IGUAL TE QUEREMOS.";
    if (emojiEl)  emojiEl.textContent  = "💔";
    playSad();
    showScreen("s4");
    // para el NO no hay patita, mandamos el WA directo
    if (window._waMsgPendiente) {
      setTimeout(() => {
        window.open(window._waMsgPendiente, "_blank");
        window._waMsgPendiente = null;
      }, 600);
    }
  }
}

// ── PATITA — choque los 5 ─────────────────────────────
let pawReady = false;
let pawUsed  = false;

function showPaw() {
  const paw = document.getElementById("paw-container");
  if (!paw) return;
  pawReady = false;
  pawUsed  = false;
  paw.classList.remove("paw-bob", "paw-hit", "paw-bye");
  const label = document.getElementById("paw-label");
  const hint  = document.getElementById("paw-hint");
  if (label) label.textContent = "DALE, CHOQUE LOS 5";
  if (hint)  hint.textContent  = "↑ TOCÁ LA PATITA ↑";
  paw.style.display   = "flex";
  paw.style.transform = "translateX(-50%) translateY(115%)";
  paw.style.transition = "transform 0.75s cubic-bezier(0.16,1,0.3,1)";
  void paw.offsetWidth;
  requestAnimationFrame(() => {
    paw.style.transform = "translateX(-50%) translateY(28%)";
    setTimeout(() => {
      paw.style.transition = "";
      paw.style.transform  = "";
      paw.classList.add("paw-bob");
      pawReady = true;
    }, 780);
  });
}

function highFive() {
  if (!pawReady || pawUsed) return;
  pawUsed  = true;
  pawReady = false;
  const paw   = document.getElementById("paw-container");
  const label = document.getElementById("paw-label");
  const hint  = document.getElementById("paw-hint");

  paw.style.transition = "";
  paw.style.transform  = "";
  paw.classList.remove("paw-bob");
  paw.classList.add("paw-hit");

  // sonido: golpe sordo + arpegio de éxito
  playTone(250, 0.07, 0.18, "square");
  setTimeout(() => playSuccess(), 170);

  // confetti desde la patita
  const rect = paw.getBoundingClientRect();
  setTimeout(() => launchConfetti(
    rect.left + rect.width / 2,
    rect.top  + rect.height / 3,
    90
  ), 140);

  if (label) label.textContent = "¡CHOCASTE!";
  if (hint)  hint.textContent  = (nombre || "").toUpperCase() + " 🎉";

  setTimeout(() => {
    paw.classList.remove("paw-hit");
    paw.classList.add("paw-bye");
    // abrir WhatsApp justo cuando la patita se retira
    if (window._waMsgPendiente) {
      window.open(window._waMsgPendiente, "_blank");
      window._waMsgPendiente = null;
    }
  }, 560);

  setTimeout(() => { paw.style.display = "none"; }, 1450);
}

// ── EASTER EGG — avatar 5 clicks ──────────────────────
let avatarClicks = 0;
const easterMsgs = [
  { emoji: "🎂", text: "FAU ES\nLA PERSONA\nMÁS GROSA",   sub: "secreto desbloqueado ✓" },
  { emoji: "🧿", text: "FELIZ\nCUMPLE\nFAU",              sub: "que tengas el mejor año" },
  { emoji: "🔥", text: "EL MEJOR\nCUMPLE\nDEL AÑO",      sub: "no hay otro igual" },
  { emoji: "👑", text: "REINA\nABSOLUTA\nFAU",            sub: "datos no mienten" },
];
let eeIdx = 0;

document.querySelectorAll(".avatar").forEach(av => {
  av.style.cursor = "pointer";
  av.addEventListener("click", () => {
    avatarClicks++;
    playTone(300 + avatarClicks * 90, 0.07, 0.06);
    if (avatarClicks >= 5) {
      avatarClicks = 0;
      const msg = easterMsgs[eeIdx % easterMsgs.length];
      eeIdx++;
      document.getElementById("ee-emoji").textContent     = msg.emoji;
      document.getElementById("ee-text").innerHTML        = msg.text.replace(/\n/g, "<br>");
      document.getElementById("ee-sub").textContent       = msg.sub;
      const el = document.getElementById("easter-egg");
      el.classList.add("active");
      playSuccess();
      launchConfetti(null, null, 60);
      setTimeout(() => el.classList.remove("active"), 3200);
    }
  });
});

// ── INPUT ENTER ───────────────────────────────────────
document.getElementById("inp-nombre").addEventListener("keydown", e => {
  if (e.key === "Enter") goS2();
});

// ── CURSOR TRAIL 🧿 (solo desktop) ───────────────────
let lastTrail = 0;
document.addEventListener("mousemove", e => {
  const now = Date.now();
  if (now - lastTrail < 60) return;
  lastTrail = now;
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.style.left = e.clientX + "px";
  dot.style.top  = e.clientY + "px";
  document.body.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "0"; });
  setTimeout(() => dot.remove(), 450);
});
