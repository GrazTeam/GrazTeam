const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);

// ===== Заголовок: слова выезжают снизу по очереди =====
let wi = 0;
(function split(node) {
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(word => {
        if (!word) return;
        if (/^\s+$/.test(word)) { frag.append(word); return; }
        const w = document.createElement('span'), s = document.createElement('span');
        w.className = 'w'; s.textContent = word; s.style.setProperty('--i', wi++);
        w.append(s); frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) split(n);
  });
})($('.words'));

// ===== Дом в hero: черепица укладывается от карниза к коньку =====
const NS = 'http://www.w3.org/2000/svg';
const tiles = $('#tiles');
const COLORS = ['#b5482f', '#a8412a', '#c0533a'];
for (let r = 0; r < 9; r++) {
  const top = 193 - r * 13;
  const hw = 176 * (top + 13 - 88) / 121; // полуширина ската на уровне ряда
  const shift = r % 2 ? 12 : 0;
  let col = 0;
  for (let x = 30 - shift; x < 370; x += 24) {
    if (x + 24 < 200 - hw || x > 200 + hw) continue;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${x} ${top}h24v9a12 5 0 0 1-24 0z`);
    p.setAttribute('fill', COLORS[(r * 7 + col * 3) % 3]);
    p.setAttribute('stroke', '#7a2c1b');
    p.setAttribute('stroke-width', '1.5');
    p.classList.add('tile');
    p.style.setProperty('--d', (r * .2 + col++ * .015) + 's');
    tiles.append(p);
  }
}

// ===== Дождь: капли разбиваются о крышу, ветер следует за курсором =====
const art = $('#art'), cv = $('#rain'), ctx = cv.getContext('2d');
let scale = 1, wind = 0, windTo = 0, drops = [], sparks = [], raining = false, visible = true, last = 0;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = art.clientWidth * dpr; cv.height = art.clientHeight * dpr;
  scale = art.clientWidth / 400;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  windTo = (e.clientX / innerWidth - .5) * 6;
});

// высота поверхности (крыша, труба, земля) под точкой x в координатах viewBox
function surface(x) {
  if (x > 266 && x < 302) return 100;
  if (x > 24 && x < 376) return 209 - 121 * (1 - Math.abs(x - 200) / 176);
  return 360;
}

function splash(x, y) {
  const side = x < 200 ? -1 : 1; // брызги скатываются по скату
  for (let i = 0; i < 3; i++) sparks.push({
    x, y, vx: side * (Math.random() * 1.6 + .3) + (Math.random() - .5), vy: -(Math.random() * 2 + 1), life: 18
  });
}

function frame(now) {
  if (!visible) return;
  const dt = Math.min((now - last) / 16.7, 3); last = now;
  wind += (windTo - wind) * .05;
  for (let i = 0; i < 3 * dt; i++) drops.push({ x: 20 + Math.random() * 370, y: 30, vy: 7 + Math.random() * 4, len: 10 + Math.random() * 10 });

  ctx.clearRect(0, 0, 400, 400);
  ctx.strokeStyle = 'rgba(170,200,230,.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  drops = drops.filter(d => {
    d.x += wind * dt; d.y += d.vy * dt;
    const sy = surface(d.x);
    if (d.y >= sy) { splash(d.x, sy); return false; }
    ctx.moveTo(d.x - wind * 1.5, d.y - d.len); ctx.lineTo(d.x, d.y);
    return d.x > -50 && d.x < 450;
  });
  ctx.stroke();

  ctx.fillStyle = 'rgba(190,215,240,.8)';
  sparks = sparks.filter(s => {
    s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .25 * dt; s.life -= dt;
    ctx.fillRect(s.x, s.y, 1.8, 1.8);
    return s.life > 0;
  });
  requestAnimationFrame(frame);
}
function startRain() { if (raining && visible) { last = performance.now(); requestAnimationFrame(frame); } }
new IntersectionObserver(es => {
  const was = visible; visible = es[0].isIntersecting;
  if (visible && !was) startRain();
}).observe(art);
if (!reduce) setTimeout(() => { raining = true; startRain(); }, 3000); // после того как крыша готова

// ===== Шапка, плавающая кнопка, линия крыш, этапы — всё от скролла =====
const nav = $('.nav'), fab = $('.fab'), ridge = $('.ridge'), ridgePath = $('#ridgePath');
const steps = $('#steps'), stepItems = [...steps.children];
function onScroll() {
  nav.classList.toggle('scrolled', scrollY > 10);
  fab.classList.toggle('show', scrollY > innerHeight * .6);

  const r = ridge.getBoundingClientRect();
  ridgePath.style.setProperty('--off', 1 - clamp((innerHeight - r.top) / (innerHeight * .7)));

  const s = steps.getBoundingClientRect(), mark = innerHeight * .65;
  steps.style.setProperty('--fill', clamp((mark - s.top - 24) / (s.height - 48)));
  stepItems.forEach(li => li.classList.toggle('on', li.getBoundingClientRect().top + 24 < mark));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Подсветка карточек за курсором =====
document.querySelectorAll('.card').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px');
  c.style.setProperty('--my', e.clientY - r.top + 'px');
}));

// ===== Материалы =====
const MATERIALS = [
  { t: 'metal', name: 'Металлочерепица', life: 50, quiet: 2, weight: 5, slope: 'от 14°', price: 18,
    text: 'Стальной лист с полимерным покрытием под вид черепицы. Быстро монтируется, лёгкий, десятки цветов.' },
  { t: 'prof', name: 'Профнастил', life: 40, quiet: 1, weight: 4.5, slope: 'от 8°', price: 14,
    text: 'Самый бюджетный металл. Хорош для гаражей, хозпостроек и простых односкатных крыш.' },
  { t: 'soft', name: 'Гибкая черепица', life: 40, quiet: 5, weight: 9, slope: 'от 12°', price: 28,
    text: 'Битумная черепица на сплошном основании. Тихая в дождь, подходит для куполов и сложных форм.' },
  { t: 'seam', name: 'Фальцевая кровля', life: 70, quiet: 2, weight: 5.5, slope: 'от 7°', price: 35,
    text: 'Гладкие панели со скрытым креплением. Ни одного отверстия в листе, строгий современный вид.' },
  { t: 'ceramic', name: 'Керамическая черепица', life: 100, quiet: 5, weight: 45, slope: 'от 22°', price: 60,
    text: 'Обожжённая глина, служит столетие. Тяжёлая, поэтому нужна усиленная стропильная система.' },
  { t: 'pvc', name: 'ПВХ-мембрана', life: 30, quiet: 3, weight: 1.5, slope: 'от 0°', price: 25,
    text: 'Для плоских крыш. Швы сваривают горячим воздухом, получается сплошной водонепроницаемый ковёр.' },
  { t: 'ondulin', name: 'Ондулин', life: 25, quiet: 4, weight: 3, slope: 'от 6°', price: 12,
    text: 'Лёгкие битумные волнистые листы. Можно класть поверх старого шифера без демонтажа.' }
];
const matList = $('#matList'), sample = $('#matSample'), info = $('.mat__info');
const years = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'год' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'года' : 'лет');
const matBtns = MATERIALS.map((m, i) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'tab');
  b.innerHTML = `<i data-t="${m.t}"></i>${m.name}`;
  b.addEventListener('click', () => pickMat(i));
  matList.append(b);
  return b;
});
matList.addEventListener('keydown', e => {
  const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!k) return;
  e.preventDefault();
  const i = (matBtns.indexOf(document.activeElement) + k + matBtns.length) % matBtns.length;
  pickMat(i); matBtns[i].focus();
});
function bar(id, k) {
  const u = $(id);
  u.style.transition = 'none'; u.style.width = 0; u.offsetWidth;
  u.style.transition = ''; u.style.width = Math.max(k, .03) * 100 + '%';
}
function pickMat(i) {
  const m = MATERIALS[i];
  matBtns.forEach((b, j) => { b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
  sample.dataset.t = m.t;
  $('#matName').textContent = m.name;
  $('#matText').textContent = m.text;
  $('#sLife').textContent = 'до ' + years(m.life);
  $('#sQuiet').textContent = m.quiet + ' из 5';
  $('#sWeight').textContent = String(m.weight).replace('.', ',') + ' кг/м²';
  $('#sSlope').textContent = m.slope;
  $('#sPrice').innerHTML = `от ${m.price} <span class="nbrb-icon">BYN</span>/м²`;
  [sample, info].forEach(el => { el.classList.remove('swap'); el.offsetWidth; el.classList.add('swap'); });
  bar('#bLife', m.life / 100); bar('#bQuiet', m.quiet / 5); bar('#bWeight', m.weight / 50);
}
pickMat(0);

// ===== Заглушки: если файла в images/ нет, показываем плашку «Фото скоро» =====
const STUB = '<span class="stub"><svg viewBox="0 0 64 64"><use href="#roofIcon"/></svg>Фото скоро</span>';
const imgUrl = el => (el.style.getPropertyValue('--img').match(/url\((.+)\)/) || [])[1];
function checkImg(el) {
  el.classList.remove('noimg');
  el.querySelector('.stub')?.remove();
  const url = imgUrl(el);
  const fail = () => {
    if (imgUrl(el) !== url) return; // пока грузилось, фото уже сменили
    el.classList.add('noimg'); el.insertAdjacentHTML('afterbegin', STUB);
  };
  if (!url) return fail();
  const im = new Image();
  im.onerror = fail;
  im.src = url;
}
document.querySelectorAll('.ph,.ba__img').forEach(checkImg);

// ===== До / после =====
const ba = $('.ba'), range = $('.ba__range');
const baBefore = $('.ba__img--before'), baAfter = $('.ba__img--after');
let baTimer, baTouched = false;
const setP = v => ba.style.setProperty('--p', v + '%');
range.addEventListener('input', () => {
  baTouched = true; setP(range.value);
  ba.classList.add('moving');
  clearTimeout(baTimer); baTimer = setTimeout(() => ba.classList.remove('moving'), 200);
});
document.querySelectorAll('#baTabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#baTabs button').forEach(x => x.classList.toggle('on', x === b));
  baBefore.style.setProperty('--img', `url(./images/before${b.dataset.n}.jpg)`);
  baAfter.style.setProperty('--img', `url(./images/after${b.dataset.n}.jpg)`);
  checkImg(baBefore); checkImg(baAfter);
  setP(50); range.value = 50;
  ba.classList.remove('swap'); ba.offsetWidth; ba.classList.add('swap');
}));
// подсказка: при первом показе ползунок сам «покачивается»
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting || reduce) return;
  o.disconnect();
  const t0 = performance.now();
  (function hint(now) {
    if (baTouched) return;
    const k = (now - t0) / 2200;
    if (k >= 1) { setP(50); range.value = 50; return; }
    setP(50 + Math.sin(k * Math.PI * 2) * 25 * (1 - k));
    requestAnimationFrame(hint);
  })(t0);
}, { threshold: .5 }).observe(ba);

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
document.querySelectorAll('.card,.ph,.stats>div,.soc,.ba,.mat').forEach((el, i) => {
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
