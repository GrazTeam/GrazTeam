const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Колесо раскручивается от прокрутки и плавно замедляется =====
const spin = $('#spin');
let ang = 0, vel = 0.4, lastY = scrollY;
(function wheel() {
  const dy = Math.abs(scrollY - lastY); lastY = scrollY;
  vel = Math.max(reduce ? 0 : 0.4, vel * 0.96 + dy * 0.1);
  vel = Math.min(vel, 40);
  ang = (ang + vel) % 360;
  spin.setAttribute('transform', `rotate(${ang} 200 200)`);
  requestAnimationFrame(wheel);
})();

// ===== Колесо катится по дороге вместе со скроллом =====
const road = $('.road'), roll = $('.roll');
function rollWheel() {
  const r = road.getBoundingClientRect();
  const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1);
  const x = p * (r.width - 64);
  roll.style.transform = `translateX(${x}px) rotate(${x / (Math.PI * 64) * 360}deg)`;
}
addEventListener('scroll', rollWheel, { passive: true }); rollWheel();

// ===== Манометр: деления =====
const ticks = document.querySelector('.ticks');
for (let i = 0; i <= 8; i++) {
  const a = (-180 + i * 22.5) * Math.PI / 180, big = i % 2 === 0;
  const r1 = big ? 68 : 74, r2 = 82;
  ticks.insertAdjacentHTML('beforeend',
    `<line x1="${110 + r1 * Math.cos(a)}" y1="${115 + r1 * Math.sin(a)}" x2="${110 + r2 * Math.cos(a)}" y2="${115 + r2 * Math.sin(a)}"/>`);
}

// ===== Появление при скролле, счётчики =====
document.querySelectorAll('.card,.steps li,.rev,.stats>div').forEach((el, i) => {
  el.classList.add('in-up'); el.style.setProperty('--d', (i % 5) * .1 + 's');
});
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; el.classList.add('in'); io.unobserve(el);
  const n = el.querySelector?.('[data-to]');
  if (n) {
    const to = +n.dataset.to, t0 = performance.now();
    (function tick(now) {
      const k = Math.min((now - t0) / 1400, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
}), { threshold: .25 });
document.querySelectorAll('.in-up,.star,.gauge').forEach(el => io.observe(el));

// ===== Лупа: следует за курсором, без курсора гуляет сама =====
const ZOOM = 2.8;
document.querySelectorAll('.zoom').forEach((box, idx) => {
  box.style.setProperty('--img', `url(${box.dataset.img})`);
  const lens = document.createElement('div');
  lens.className = 'lens'; box.appendChild(lens);
  let manual = false, visible = false, lastTouch = -9999;

  const place = (x, y) => {
    const w = box.clientWidth, h = box.clientHeight, s = lens.clientWidth;
    lens.style.transform = `translate(${x - lens.offsetWidth / 2}px,${y - lens.offsetHeight / 2}px)`;
    lens.style.backgroundSize = `${w * ZOOM}px ${h * ZOOM}px`;
    lens.style.backgroundPosition = `${s / 2 - x * ZOOM}px ${s / 2 - y * ZOOM}px`;
  };
  const pos = e => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') manual = true; });
  box.addEventListener('pointermove', e => { manual = true; lastTouch = performance.now(); lens.classList.add('show'); place(...pos(e)); });
  box.addEventListener('pointerleave', () => { manual = false; lastTouch = performance.now(); });
  box.addEventListener('pointerup', () => { lastTouch = performance.now(); manual = false; });

  new IntersectionObserver(es => visible = es[0].isIntersecting).observe(box);

  (function auto(now) {
    if (visible && !manual && !reduce && now - lastTouch > 1500) {
      const t = now * 0.0007 + idx * 2, w = box.clientWidth, h = box.clientHeight;
      lens.classList.add('show');
      place(w * (.5 + .36 * Math.sin(t)), h * (.5 + .32 * Math.sin(t * 1.37 + 1)));
    } else if (!visible) lens.classList.remove('show');
    requestAnimationFrame(auto);
  })(0);
});

$('#year').textContent = new Date().getFullYear();