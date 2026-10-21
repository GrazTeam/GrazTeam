// ===== Фото =====
// Чтобы подставить настоящие снимки, укажите src: 'photos/01.jpg'
// Без src показывается художественная заглушка из цветов a/b.
const PHOTOS = [
  { cap: 'Тихое утро', src: './images/photo1.jpg', a: '#ecd3ca', b: '#b98f84' },
  { cap: 'Первый взгляд', src: './images/photo2.jpg', a: '#c9d3bf', b: '#7f9072' },
  { cap: 'Клятвы', src: './images/photo3.jpg', a: '#d9c7a2', b: '#8d7243' },
  { cap: 'Танец', src: './images/photo4.jpg', a: '#cfc5de', b: '#7d6a9c' },
  { cap: 'Прогулка', src: './images/photo5.jpg', a: '#bfd0d6', b: '#5f8795' },
  { cap: 'Вечерний свет', src: './images/photo6.jpg', a: '#f0c9a8', b: '#b5703f' },
  { cap: 'Родные', src: './images/photo7.jpg', a: '#e4d2c8', b: '#a07763' },
  { cap: 'Конфетти', src: './images/photo8.jpg', a: '#e9d7ae', b: '#9b8240' }
];
const ph = (p, cls = '') => {
  const f = document.createElement('figure');
  f.className = 'ph ' + cls;
  f.style.setProperty('--a', p.a); f.style.setProperty('--b', p.b);
  if (p.src) f.insertAdjacentHTML('beforeend', `<img src="${p.src}" alt="${p.cap}" loading="lazy">`);
  return f;
};
const $ = id => document.getElementById(id);

// hero-арки
document.querySelectorAll('.arch').forEach((el, i) => {
  const p = PHOTOS[[0, 1, 5][i]];
  el.classList.add('ph'); el.style.setProperty('--a', p.a); el.style.setProperty('--b', p.b);
  if (p.src) el.insertAdjacentHTML('beforeend', `<img src="${p.src}" alt="">`);
});
// параллакс по мыши
const art = $('heroArt');
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  art.querySelectorAll('.arch').forEach(a => {
    const d = +a.dataset.depth;
    a.style.transform = `translate(${x * d}px,${y * d}px)`;
  });
});

// ===== Слайдер =====
const slidesBox = $('slides'), bar = $('bar');
const slides = PHOTOS.map(p => {
  const s = document.createElement('div'); s.className = 'slide';
  s.appendChild(ph(p)); slidesBox.appendChild(s); return s;
});
let cur = 0, t0 = 0, raf; const DUR = 5500;
function show(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, n) => s.classList.toggle('on', n === cur));
  $('num').textContent = String(cur + 1).padStart(2, '0');
  $('cap').textContent = PHOTOS[cur].cap;
  $('count').textContent = `${cur + 1} / ${slides.length}`;
  t0 = performance.now();
}
function loop(now) {
  const k = Math.min((now - t0) / DUR, 1);
  bar.style.width = k * 100 + '%';
  if (k >= 1) show(cur + 1);
  raf = requestAnimationFrame(loop);
}
$('prev').onclick = () => show(cur - 1);
$('next').onclick = () => show(cur + 1);
$('stage').addEventListener('pointerenter', () => cancelAnimationFrame(raf));
$('stage').addEventListener('pointerleave', () => { t0 = performance.now() - parseFloat(bar.style.width || 0) / 100 * DUR; raf = requestAnimationFrame(loop); });
let sx = null;
$('stage').addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
$('stage').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
}, { passive: true });
show(0);
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(loop);

// ===== Бегущая лента (удвоенная для бесшовного цикла) =====
[['row1', PHOTOS], ['row2', [...PHOTOS].reverse()]].forEach(([id, list]) => {
  [...list, ...list].forEach(p => $(id).appendChild(ph(p, 'chip')));
});

// ===== Коллаж =====
[0, 5, 2, 3, 6, 1, 7, 4].forEach((n, i) => {
  const p = PHOTOS[n], t = ph(p, 'tile');
  t.insertAdjacentHTML('beforeend', `<i>${p.cap}</i>`);
  t.classList.add('rv'); t.style.setProperty('--d', i * 0.08 + 's');
  $('mosaic').appendChild(t);
});

// ===== Лепестки =====
const pBox = $('petals');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span'), size = 10 + Math.random() * 14;
    s.className = 'petal';
    s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `animation-duration:${12 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s;` +
      `--sway:${(Math.random() - .5) * 160}px;opacity:${.4 + Math.random() * .4}`;
    pBox.appendChild(s);
  }
}

// ===== Появление при скролле =====
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll('.rv').forEach((el, i) => {
  if (!el.style.getPropertyValue('--d') && el.matches('.rev,.socials li')) el.style.setProperty('--d', (i % 4) * .12 + 's');
  io.observe(el);
});

$('year').textContent = new Date().getFullYear();