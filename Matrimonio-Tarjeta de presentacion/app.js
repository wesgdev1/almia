/* ====== EDITA AQUÍ TUS DATOS ====== */
const CONFIG = {
  n1: 'Kandy',                      // tu nombre
  n2: 'Welinton',                        // nombre de tu pareja
  fecha: '2027-02-20T16:00:00',     // fecha y hora de la ceremonia (hora local)
  duracionHoras: 8,
  lugar: 'Palmas Golf',
  ciudad: 'Villa del Rosario, Norte de Santander',
  ceremonia: 'Palmas Golf · 4:00 pm',
  recepcion: 'Palmas Golf · 6:00 pm',
  dress: 'Elegante',
  contacto: 'Welinton',             // a quién contactar para confirmar
  mapa: 'https://maps.app.goo.gl/tkBqY3qtC4rA6KKz8',   // link de Google Maps
  whatsapp: '573208719438',             // código país + número, sin +
};
/* =================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Textos
$$('[data-bind]').forEach(el => el.textContent = CONFIG[el.dataset.bind]);
$('#map').href = $('#venue').href = CONFIG.mapa;
const wa = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
$('#yes').href = wa(`¡Hola! Confirmo mi asistencia a la boda de ${CONFIG.n1} & ${CONFIG.n2} el 20 de febrero 🎉`);
$('#no').href = wa(`Hola ${CONFIG.n1} & ${CONFIG.n2}, lamentablemente no podré asistir a la boda 😢 ¡Los quiero!`);
if ($('#wa')) $('#wa').href = wa(`¡Hola! Confirmo mi asistencia a la boda de ${CONFIG.n1} & ${CONFIG.n2} 🎉`);

// Reveal + nav activo
const stations = $$('.station');
const navLinks = $$('#nav a');
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting && (e.intersectionRatio >= .45 || e.intersectionRect.height >= innerHeight * .45)) {
    e.target.classList.add('in');
    navLinks.forEach(a => a.classList.toggle('on', +a.dataset.i === stations.indexOf(e.target)));
  }
}), { threshold: [.1, .2, .3, .45] });
stations.forEach(s => io.observe(s));
$('#s0').classList.add('in');
navLinks[0].classList.add('on');

// Camino sinuoso + perrita que avanza con el scroll
// MODO SÚPER FLUIDO (Chrome/Android, Safari 26+, Edge): CSS Scroll-Driven Animations.
//   La perrita recorre el camino con `offset-path` y `animation-timeline: scroll()`:
//   el navegador la mueve en el mismo hilo del scroll (compositor), cero JS por frame,
//   va pegada al dedo. Igual la línea dorada, la barra de progreso y el parallax de fotos.
// MODO RESPALDO (navegadores viejos): JS con requestAnimationFrame y tabla precalculada.
const main = $('#journey'), fg = $('#road-fg'), bg = $('#road-bg'), walker = $('#walker'), bar = $('#bar');
const pars = $$('[data-par]');
pars.forEach(el => el.style.setProperty('--k', el.dataset.par));
const SDA = CSS.supports?.('animation-timeline', 'scroll()') && CSS.supports?.('offset-path', 'path("M0 0")')
  && !matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('sda', !!SDA);

let L = 1, H = 1, W0 = 0, pts = new Float32Array(0), N = 0, mainTop = 0, mainLeft = 0, raf = 0, lastDash = -1;
function buildRoad() {
  const w = main.clientWidth;
  W0 = w; H = main.clientHeight;
  const r = main.getBoundingClientRect();
  mainTop = r.top + scrollY; mainLeft = r.left;
  $('#road').setAttribute('viewBox', `0 0 ${w} ${H}`);
  let d = `M${w / 2} 60`, py = 60;
  stations.forEach((s, i) => {
    const y = s.offsetTop + s.offsetHeight, x = i % 2 ? w * .14 : w * .86, m = (py + y) / 2;
    d += ` C${i % 2 ? w * .86 : w * .14} ${m - (y - py) * .1}, ${i % 2 ? w * .14 : w * .86} ${m + (y - py) * .1}, ${i === stations.length - 1 ? w / 2 : x} ${y - (i === stations.length - 1 ? 90 : 0)}`;
    py = y;
  });
  bg.setAttribute('d', d); fg.setAttribute('d', d);
  L = fg.getTotalLength();
  fg.style.strokeDasharray = L;
  if (SDA) {
    // El navegador hace todo: solo le damos el camino y su largo
    walker.style.offsetPath = `path("${d}")`;
    fg.style.setProperty('--L', `${L}px`);
  } else {
    // Tabla de puntos: 1 muestra cada ~6px de camino
    N = Math.max(2, Math.min(2500, Math.ceil(L / 6)));
    pts = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const q = fg.getPointAtLength(L * i / (N - 1));
      pts[i * 2] = q.x; pts[i * 2 + 1] = q.y;
    }
    pars.forEach(el => { const s = el.closest('.station') || el.parentElement; el._t = s.offsetTop; el._h = s.offsetHeight; el._k = +el.dataset.par; });
    lastDash = -1;
    walkFrame();
  }
  walker.classList.add('ready');
}
// Respaldo JS (mismo recorrido que el modo CSS: avance = scroll / scroll máximo)
function walkFrame() {
  raf = 0;
  if (!N) return;
  const sy = scrollY, vh = innerHeight;
  const p = Math.min(1, Math.max(0, sy / Math.max(1, document.documentElement.scrollHeight - vh)));
  const f = p * (N - 1), i = Math.min(N - 2, f | 0), t = f - i, j = i * 2;
  const x = pts[j] + (pts[j + 2] - pts[j]) * t, y = pts[j + 1] + (pts[j + 3] - pts[j + 1]) * t;
  walker.style.transform = `translate3d(${(mainLeft + x).toFixed(1)}px,${(mainTop + y - sy).toFixed(1)}px,0)`;
  const dash = L * (1 - p);
  if (Math.abs(dash - lastDash) > .5) { fg.style.strokeDashoffset = dash; lastDash = dash; }
  bar.style.transform = `scaleX(${p})`;
  for (const el of pars) {
    const top = mainTop + el._t - sy;
    if (top + el._h < -100 || top > vh + 100) continue;
    el.style.transform = `translate3d(0,${(((top + el._h / 2) - vh / 2) * el._k).toFixed(1)}px,0)`;
  }
}
if (!SDA) addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(walkFrame); }, { passive: true });
// En celular la barra del navegador cambia el alto al hacer scroll: solo reconstruimos si cambió el tamaño real
let rz;
const rebuild = () => { clearTimeout(rz); rz = setTimeout(() => {
  if (main.clientWidth !== W0 || main.clientHeight !== H) buildRoad();
  else if (!SDA) { mainLeft = main.getBoundingClientRect().left; walkFrame(); }
}, 120); };
addEventListener('resize', rebuild);
if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(main);
addEventListener('load', buildRoad);
buildRoad();

// Cuenta regresiva
const target = new Date(CONFIG.fecha).getTime();
const pad = n => String(n).padStart(2, '0');
function countdown() {
  let t = Math.max(0, target - Date.now()) / 1000;
  $('#cd').textContent = Math.floor(t / 86400);
  $('#ch').textContent = pad(Math.floor(t % 86400 / 3600));
  $('#cm').textContent = pad(Math.floor(t % 3600 / 60));
  $('#cs').textContent = pad(Math.floor(t % 60));
}
countdown(); setInterval(countdown, 1000);

// Guardar en calendario (.ics)
$('#ics').onclick = () => {
  const f = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const s = new Date(CONFIG.fecha), e = new Date(s.getTime() + CONFIG.duracionHoras * 36e5);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
    `SUMMARY:Boda de ${CONFIG.n1} & ${CONFIG.n2} 💍`, `LOCATION:${(CONFIG.lugar + ', ' + CONFIG.ciudad).replace(/,/g, '\\,')}`,
    'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:¡Falta una semana para la boda!', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'boda.ics'; a.click();
};

// Chispas doradas (canvas ligero, se pausa fuera de pantalla)
const cv = $('#sparks'), cx = cv.getContext('2d');
let W, Hh, ps = [], run = true;
function size() { W = cv.width = cv.clientWidth; Hh = cv.height = cv.clientHeight; }
size(); addEventListener('resize', size);
const mk = (x, y, burst) => ({
  x: x ?? Math.random() * W, y: y ?? Math.random() * Hh, r: Math.random() * 2 + .6,
  vx: burst ? (Math.random() - .5) * 6 : (Math.random() - .5) * .3,
  vy: burst ? (Math.random() - .5) * 6 : Math.random() * .5 + .15,
  a: 1, life: burst ? 1 : 0, c: Math.random() > .5 ? '232,194,122' : '244,182,194'
});
for (let i = 0; i < 45; i++) ps.push(mk());
function frame() {
  if (run) {
    cx.clearRect(0, 0, W, Hh);
    ps.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.life) { p.a -= .02; p.vx *= .97; p.vy *= .97; if (p.a <= 0) ps.splice(i, 1); }
      else if (p.y > Hh) { p.y = -4; p.x = Math.random() * W; }
      cx.fillStyle = `rgba(${p.c},${Math.max(0, p.a) * (p.life ? 1 : .35 + .35 * Math.sin(p.x + p.y))})`;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
    });
  }
  requestAnimationFrame(frame);
}
frame();
new IntersectionObserver(e => run = e[0].isIntersecting).observe(cv);
// Toca el héroe → fuegos artificiales
$('#s0').addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect();
  for (let i = 0; i < 40; i++) ps.push(mk(e.clientX - r.left, e.clientY - r.top, true));
});
