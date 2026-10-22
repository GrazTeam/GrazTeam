const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Заголовок: разбиваем на буквы, они выпрыгивают по очереди =====
let li = 0;
(function split(node) {
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(word => {
        if (!word) return;
        if (/^\s+$/.test(word)) { frag.append(word); return; }
        const w = document.createElement('span');
        w.style.whiteSpace = 'nowrap';
        [...word].forEach(c => {
          const s = document.createElement('span');
          s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', li++);
          w.append(s);
        });
        frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) split(n);
  });
})($('.split'));

// ===== Ножницы в hero: стригут волосы и поворачиваются за курсором =====
const art = $('.hero__art'), sc = $('#bigScissors'), hairs = $('#hairs');
let tilt = 0;
const BASE = -30;
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = art.getBoundingClientRect();
  tilt = Math.max(-12, Math.min(12, (e.clientY - (r.top + r.height / 2)) / 25));
  sc.style.transform = `rotate(${BASE + tilt}deg)`;
});

function dropHair() {
  const r = art.getBoundingClientRect(), s = sc.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const k = sc.clientWidth / 200, a = (BASE + tilt) * Math.PI / 180;
  const cx = s.left + s.width / 2 - r.left, cy = s.top + s.height / 2 - r.top;
  for (let i = 0; i < 3; i++) {
    const d = (40 + Math.random() * 50) * k; // точка вдоль лезвий
    const h = document.createElement('i');
    h.className = 'hair';
    h.style.left = cx + Math.cos(a) * d + 'px';
    h.style.top = cy + Math.sin(a) * d + 'px';
    h.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    h.style.setProperty('--r0', (Math.random() * 180) + 'deg');
    h.style.setProperty('--r1', (Math.random() * 720 - 360) + 'deg');
    h.style.height = 18 + Math.random() * 26 + 'px';
    hairs.append(h);
    h.addEventListener('animationend', () => h.remove());
  }
}
if (!reduce) setTimeout(() => { dropHair(); setInterval(dropHair, 1400); }, 630); // в такт щелчку лезвий

// ===== Линия разреза: ножницы едут по ней вместе со скроллом =====
const cut = $('.cut');
let cutTimer;
function cutLine() {
  const r = cut.getBoundingClientRect();
  const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * .9), 0), 1);
  cut.style.setProperty('--x', p * (r.width - 40) + 'px');
}
addEventListener('scroll', () => {
  cutLine();
  cut.classList.add('moving');
  clearTimeout(cutTimer); cutTimer = setTimeout(() => cut.classList.remove('moving'), 150);
}, { passive: true });
cutLine();

// ===== Подсветка карточек за курсором =====
document.querySelectorAll('.card').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px');
  c.style.setProperty('--my', e.clientY - r.top + 'px');
}));

// ===== До / после =====
const ba = $('.ba'), range = $('.ba__range');
let baTimer, baTouched = false;
const setP = v => ba.style.setProperty('--p', v + '%');
range.addEventListener('input', () => {
  baTouched = true; setP(range.value);
  ba.classList.add('moving');
  clearTimeout(baTimer); baTimer = setTimeout(() => ba.classList.remove('moving'), 200);
});
// подсказка: при первом показе ползунок сам «покачивается»
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting || reduce) return;
  o.disconnect();
  const t0 = performance.now();
  ba.classList.add('moving');
  (function hint(now) {
    if (baTouched) return ba.classList.remove('moving');
    const k = (now - t0) / 2200;
    if (k >= 1) { setP(50); range.value = 50; return ba.classList.remove('moving'); }
    setP(50 + Math.sin(k * Math.PI * 2) * 25 * (1 - k));
    requestAnimationFrame(hint);
  })(t0);
}, { threshold: .5 }).observe(ba);

// ===== Заглушки: если файла в images/ нет, показываем плашку «Фото скоро» =====
const STUB = '<span class="stub"><svg viewBox="0 0 200 200"><use href="#scissors"/></svg>Фото скоро</span>';
const imgUrl = el => (el.style.getPropertyValue('--img').match(/url\((.+)\)/) || [])[1];
document.querySelectorAll('.ph,.ba__img').forEach(el => {
  const url = imgUrl(el);
  const fail = () => { el.classList.add('noimg'); el.insertAdjacentHTML('afterbegin', STUB); };
  if (!url) return fail();
  const im = new Image();
  im.onerror = fail;
  im.src = url;
});

// ===== Галерея: наклон за курсором и просмотр крупно =====
const photos = [...document.querySelectorAll('.ph')];
photos.forEach((ph, i) => {
  ph.tabIndex = 0;
  ph.setAttribute('role', 'button');
  ph.setAttribute('aria-label', 'Открыть фото: ' + ph.querySelector('figcaption').textContent);
  ph.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = ph.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - .5) * -8, ry = ((e.clientX - r.left) / r.width - .5) * 8;
    ph.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  ph.addEventListener('pointerleave', () => ph.style.transform = '');
  ph.addEventListener('click', () => openLb(i));
  ph.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
});

const lb = $('#lb'), lbImg = $('.lb__img'), lbCap = $('.lb__fig figcaption'), lbFig = $('.lb__fig');
let cur = 0, lastFocus;
function show(i) {
  cur = (i + photos.length) % photos.length;
  const stub = photos[cur].classList.contains('noimg');
  lbImg.style.setProperty('--img', photos[cur].style.getPropertyValue('--img'));
  lbImg.classList.toggle('noimg', stub);
  lbImg.innerHTML = stub ? STUB : '';
  lbCap.textContent = photos[cur].querySelector('figcaption').textContent;
  lbFig.style.animation = 'none'; lbFig.offsetWidth; lbFig.style.animation = '';
}
function openLb(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; $('.lb__x').focus(); }
function closeLb() { lb.hidden = true; lastFocus?.focus(); }
$('.lb__x').addEventListener('click', closeLb);
$('.lb__prev').addEventListener('click', () => show(cur - 1));
$('.lb__next').addEventListener('click', () => show(cur + 1));
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') show(cur - 1);
  if (e.key === 'ArrowRight') show(cur + 1);
});
let sx = null;
lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
lb.addEventListener('touchend', e => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx; sx = null;
  if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
});

// ===== Появление при скролле, счётчики =====
document.querySelectorAll('.card,.ph,.stats>div,.soc,.ba').forEach((el, i) => {
  el.classList.add('in-up'); el.style.setProperty('--d', (i % 6) * .08 + 's');
});
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; el.classList.add('in'); io.unobserve(el);
  const n = el.querySelector('[data-to]');
  if (n) {
    const to = +n.dataset.to, t0 = performance.now();
    (function tick(now) {
      const k = Math.min((now - t0) / 1600, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('ru-RU');
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
}), { threshold: .2 });
document.querySelectorAll('.in-up').forEach(el => io.observe(el));

$('#year').textContent = new Date().getFullYear();
