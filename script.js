// ===== Список лендингов =====
// Чтобы добавить новый: положите папку рядом с index.html и добавьте объект ниже.
// path — точное имя папки (на GitHub Pages регистр важен!)
const LANDINGS = [
  {
    title: 'Орхидея',
    niche: 'Студия маникюра',
    text: 'Лендинг салона красоты: звонок, маршрут, соцсети и слайдер работ.',
    path: 'BeautySalon',
    colors: ['#b83a8e', '#f5c9dd']
  },
  {
    title: 'Воложинская пивоварня',
    niche: 'Пивоварня',
    text: 'Лендинг пивоварни: информация, фото, звонок, маршрут',
    path: 'vol.pivovarnya',
    colors: ['#3b2a8f', '#7b5cf0'],
  },
  {
    title: 'Свадебный фотограф',
    niche: 'Фотоиндустрия',
    text: 'Лендинг фотобизнеса: информация, фото, звонок',
    path: 'SvadebniyPhotograph',
    colors: ['#fc98ffff', '#d0aa14ff'],
  }
];

const grid = document.getElementById('grid');

LANDINGS.forEach(item => {
  const a = document.createElement(item.soon ? 'div' : 'a');
  a.className = 'card' + (item.soon ? ' card--soon' : '');
  if (!item.soon) a.href = item.path;
  a.innerHTML = `
    <div class="card__swatch" style="background:linear-gradient(135deg,${item.colors[0]},${item.colors[1]})"></div>
    <h3>${item.title}</h3>
    <p>${item.niche}. ${item.text}</p>
    <span class="card__go">${item.soon ? 'Скоро' : 'Открыть'} <span aria-hidden="true">→</span></span>`;
  grid.appendChild(a);

  if (item.soon) return;
  // подсветка за курсором и лёгкий наклон
  a.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = a.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    a.style.setProperty('--mx', x + 'px');
    a.style.setProperty('--my', y + 'px');
    const rx = ((y / r.height) - .5) * -6, ry = ((x / r.width) - .5) * 6;
    a.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  a.addEventListener('pointerleave', () => { a.style.transform = ''; });
});

// счётчик готовых лендингов
const ready = LANDINGS.filter(l => !l.soon).length;
const counter = document.getElementById('count');
let n = 0;
const tick = setInterval(() => {
  counter.textContent = ++n;
  if (n >= ready) clearInterval(tick);
}, 250);

document.getElementById('year').textContent = new Date().getFullYear();