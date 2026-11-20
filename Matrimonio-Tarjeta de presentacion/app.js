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
  whatsapp: '',                          // ej: '573001234567' (código país + número, sin +)
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

// Reveal + nav activo
const stations = $$('.station');
const navLinks = $$('#nav a');
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('in');
    navLinks.forEach(a => a.classList.toggle('on', +a.dataset.i === stations.indexOf(e.target)));
  }
}), { threshold: .45 });
stations.forEach(s => io.observe(s));
$('#s0').classList.add('in');
navLinks[0].classList.add('on');

// Camino sinuoso + corazón que avanza con el scroll
const main = $('#journey'), fg = $('#road-fg'), bg = $('#road-bg'), walker = $('#walker'), bar = $('#bar');
let L = 1, top0 = 0, H = 1;
function buildRoad() {
  const w = main.clientWidth; H = main.clientHeight;
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
  update();
}
function update() {
  const y = scrollY + innerHeight * .5;
  const p = Math.min(1, Math.max(0, y / H));
  const pt = fg.getPointAtLength(p * L);
  walker.style.transform = `translate3d(${pt.x}px,${pt.y}px,0)`;
  fg.style.strokeDashoffset = L * (1 - p);
  bar.style.transform = `scaleX(${Math.min(1, scrollY / (H - innerHeight))})`;
  // Parallax suave de fotos (solo las visibles)
  pars.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    el.style.transform = `translate3d(0,${((r.top + r.height / 2) - innerHeight / 2) * el.dataset.par}px,0)`;
  });
}
const pars = $$('[data-par]');
let tick = false;
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { update(); tick = false; }); } }, { passive: true });
addEventListener('resize', buildRoad);
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

// Chispas color tierra (canvas ligero, se pausa fuera de pantalla)
const cv = $('#sparks'), cx = cv.getContext('2d');
let W, Hh, ps = [], run = true;
function size() { W = cv.width = cv.clientWidth; Hh = cv.height = cv.clientHeight; }
size(); addEventListener('resize', size);
const mk = (x, y, burst) => ({
  x: x ?? Math.random() * W, y: y ?? Math.random() * Hh, r: Math.random() * 2 + .6,
  vx: burst ? (Math.random() - .5) * 6 : (Math.random() - .5) * .3,
  vy: burst ? (Math.random() - .5) * 6 : Math.random() * .5 + .15,
  a: 1, life: burst ? 1 : 0, c: Math.random() > .5 ? '217,168,108' : '212,165,154'
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
