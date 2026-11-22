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

// ===================================================================================
// Camino sinuoso + perrita que avanza con el scroll — SÚPER FLUIDO
// Todo lo que se mueve con el scroll usa SOLO `transform` y corre en el compositor
// (el mismo hilo que hace el scroll), así nunca se atrasa ni da tirones:
//  - Perrita: Web Animations + ScrollTimeline con ~600 fotogramas translate3d precalculados,
//    espaciados uniformemente en vertical → velocidad constante, sigue las curvas en X.
//  - Línea dorada: un recorte que baja + su contenido que sube (contra-desplazamiento):
//    se "revela" hasta la perrita sin repintar el SVG.
//  - Barra de progreso: scaleX en la misma línea de tiempo.
//  - Respaldo para navegadores sin ScrollTimeline: requestAnimationFrame con los mismos cálculos.
// ===================================================================================
const main = $('#journey'), road = $('#road'), fg = $('#road-fg'), bg = $('#road-bg'), walker = $('#walker'), bar = $('#bar');
const pars = $$('[data-par]');
pars.forEach(el => el.style.setProperty('--k', el.dataset.par));
const CSS_PAR = !!CSS.supports?.('animation-timeline', 'view()');           // parallax por CSS
document.documentElement.classList.toggle('sda', CSS_PAR);
const ST = typeof ScrollTimeline === 'function'
  ? new ScrollTimeline({ source: document.scrollingElement || document.documentElement, axis: 'block' }) : null;

// Mover la línea dorada a su propia capa recortable
const NS = 'http://www.w3.org/2000/svg';
const clip = document.createElement('div'), inner = document.createElement('div'), svgFg = document.createElementNS(NS, 'svg');
clip.id = 'road-clip'; inner.id = 'road-inner'; clip.setAttribute('aria-hidden', 'true');
svgFg.appendChild(fg); inner.appendChild(svgFg); clip.appendChild(inner); road.after(clip);
fg.style.strokeDasharray = 'none';

const K = 600;                                    // fotogramas del recorrido
let W0 = 0, H = 0, y0 = 0, y1 = 1, WX = new Float32Array(K + 1), WY = new Float32Array(K + 1), anims = [];

function buildRoad() {
  const w = main.clientWidth;
  W0 = w; H = main.clientHeight;
  let d = `M${w / 2} 60`, py = 60;
  stations.forEach((s, i) => {
    const y = s.offsetTop + s.offsetHeight, x = i % 2 ? w * .14 : w * .86, m = (py + y) / 2;
    d += ` C${i % 2 ? w * .86 : w * .14} ${m - (y - py) * .1}, ${i % 2 ? w * .14 : w * .86} ${m + (y - py) * .1}, ${i === stations.length - 1 ? w / 2 : x} ${y - (i === stations.length - 1 ? 90 : 0)}`;
    py = y;
  });
  for (const sv of [road, svgFg]) { sv.setAttribute('viewBox', `0 0 ${w} ${H}`); sv.setAttribute('width', w); sv.setAttribute('height', H); }
  bg.setAttribute('d', d); fg.setAttribute('d', d);
  clip.style.height = inner.style.height = `${H}px`;

  // Muestras densas del camino (por longitud) → luego fotogramas uniformes en Y
  const L = bg.getTotalLength(), n = Math.max(2, Math.min(4000, Math.ceil(L / 3)));
  const xs = new Float32Array(n + 1), ys = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const q = bg.getPointAtLength(L * i / n);
    xs[i] = q.x; ys[i] = i ? Math.max(q.y, ys[i - 1]) : q.y;
  }
  y0 = ys[0]; y1 = ys[n];
  for (let k = 0, j = 0; k <= K; k++) {
    const y = y0 + (y1 - y0) * k / K;
    while (j < n - 1 && ys[j + 1] < y) j++;
    const dy = ys[j + 1] - ys[j], t = dy > 0 ? Math.min(1, Math.max(0, (y - ys[j]) / dy)) : 0;
    WX[k] = xs[j] + (xs[j + 1] - xs[j]) * t; WY[k] = y;
  }
  if (!CSS_PAR) pars.forEach(el => { const s = el.closest('.station') || el.parentElement; el._t = s.offsetTop; el._h = s.offsetHeight; el._k = +el.dataset.par; });

  anims.forEach(an => an.cancel()); anims = [];
  if (ST) {
    const o = { timeline: ST, fill: 'both', easing: 'linear' };
    const kf = [];
    for (let k = 0; k <= K; k++) kf.push({ transform: `translate3d(${WX[k].toFixed(1)}px,${WY[k].toFixed(1)}px,0)` });
    anims.push(walker.animate(kf, o));
    anims.push(clip.animate([{ transform: `translate3d(0,${y0 - H}px,0)` }, { transform: `translate3d(0,${y1 - H}px,0)` }], o));
    anims.push(inner.animate([{ transform: `translate3d(0,${H - y0}px,0)` }, { transform: `translate3d(0,${H - y1}px,0)` }], o));
    anims.push(bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], o));
  }
  paint();
  walker.classList.add('ready');
}

// Respaldo (sin ScrollTimeline) y parallax JS (sin view-timeline)
let raf = 0;
function paint() {
  raf = 0;
  const sy = scrollY, vh = innerHeight;
  if (!ST) {
    const p = Math.min(1, Math.max(0, sy / Math.max(1, document.documentElement.scrollHeight - vh)));
    const f = p * K, k = Math.min(K - 1, f | 0), t = f - k;
    const x = WX[k] + (WX[k + 1] - WX[k]) * t, y = WY[k] + (WY[k + 1] - WY[k]) * t;
    walker.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    clip.style.transform = `translate3d(0,${(y - H).toFixed(1)}px,0)`;
    inner.style.transform = `translate3d(0,${(H - y).toFixed(1)}px,0)`;
    bar.style.transform = `scaleX(${p})`;
  }
  if (!CSS_PAR) for (const el of pars) {
    const top = el._t - sy;
    if (top + el._h < -100 || top > vh + 100) continue;
    el.style.transform = `translate3d(0,${(((top + el._h / 2) - vh / 2) * el._k).toFixed(1)}px,0)`;
  }
}
if (!ST || !CSS_PAR) addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });

// Reconstruir solo si cambia el tamaño real (la barra del navegador del celular no cuenta)
let rz;
const rebuild = () => { clearTimeout(rz); rz = setTimeout(() => { if (main.clientWidth !== W0 || main.clientHeight !== H) buildRoad(); }, 150); };
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
