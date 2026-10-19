// Слайдер работ: кнопки, точки, свайп, автопрокрутка, клавиатура
(() => {
  const root = document.querySelector('.slider');
  const track = root.querySelector('.slider__track');
  const slides = [...track.children];
  const dotsBox = root.querySelector('.slider__dots');
  let index = 0, timer;

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Фото ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(b);
    return b;
  });

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, n) => d.classList.toggle('on', n === index));
  }
  const restart = () => {
    clearInterval(timer);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      timer = setInterval(() => go(index + 1), 4500);
  };

  root.querySelector('.prev').addEventListener('click', () => { go(index - 1); restart(); });
  root.querySelector('.next').addEventListener('click', () => { go(index + 1); restart(); });
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  root.tabIndex = 0;
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });

  let startX = null;
  root.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
  root.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });

  go(0);
  restart();
})();

document.getElementById('year').textContent = new Date().getFullYear();