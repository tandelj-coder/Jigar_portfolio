(function(){
  const SLIDES = [
    { url:'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&auto=format&fit=crop&q=80', label:'東京 — Tokyo', stamp:'東' },
    { url:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80', label:'京都 — Kyoto', stamp:'京' },
    { url:'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop&q=80', label:'富士山 — Fuji', stamp:'富' },
    { url:'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&auto=format&fit=crop&q=80', label:'大阪 — Osaka', stamp:'大' },
    { url:'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&auto=format&fit=crop&q=80', label:'奈良 — Nara', stamp:'奈' },
    { url:'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800&auto=format&fit=crop&q=80', label:'札幌 — Sapporo', stamp:'札' },
  ];

  let idx = 0;
  let animating = false;
  let dragStartX = 0;
  let isDragging = false;

  const card     = document.getElementById('carousel-card');
  const img      = document.getElementById('carousel-img');
  const lbl      = document.getElementById('card-label');
  const stamp    = document.getElementById('card-stamp');
  const dotsWrap = document.getElementById('carousel-dots');

  // Build dots
  SLIDES.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.addEventListener('click', () => {
      if (!animating && i !== idx) goTo(i > idx ? 1 : -1, i);
    });
    dotsWrap.appendChild(d);
  });

  function setDots() {
    dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  function loadSlide(i) {
    img.src = SLIDES[i].url;
    lbl.textContent   = SLIDES[i].label;
    stamp.textContent = SLIDES[i].stamp;
  }

  function goTo(dir, targetIdx) {
    if (animating) return;
    animating = true;
    const newIdx  = targetIdx !== undefined ? targetIdx : (idx + dir + SLIDES.length) % SLIDES.length;
    const exitX   = dir > 0 ? -260 : 260;
    const enterX  = dir > 0 ?  260 : -260;
    const exitRot = dir > 0 ? -22  :  22;
    const enterRot= dir > 0 ?  22  : -22;

    gsap.to(card, {
      x: exitX, rotation: exitRot, scale: 0.72, opacity: 0,
      filter: 'brightness(1.6) sepia(25%)',
      duration: 0.32, ease: 'power2.in',
      onComplete: () => {
        idx = newIdx;
        loadSlide(idx);
        setDots();
        gsap.fromTo(card,
          { x: enterX, rotation: enterRot, scale: 0.72, opacity: 0, filter: 'brightness(1.6) sepia(25%)' },
          { x: 0, rotation: -3, scale: 1, opacity: 1, filter: 'brightness(1) sepia(0%)',
            duration: 0.44, ease: 'back.out(1.4)',
            onComplete: () => { animating = false; }
          }
        );
      }
    });
  }

  document.getElementById('carousel-prev').addEventListener('click', () => goTo(-1));
  document.getElementById('carousel-next').addEventListener('click', () => goTo(1));

  // Drag support
  card.addEventListener('pointerdown', e => {
    isDragging = true;
    dragStartX = e.clientX;
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    gsap.set(card, { x: dx * 0.4, rotation: -3 + dx * 0.06 });
  });
  card.addEventListener('pointerup', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 100) {
      goTo(dx < 0 ? 1 : -1);
    } else {
      gsap.to(card, { x: 0, rotation: -3, duration: 0.35, ease: 'back.out(1.7)' });
    }
  });

  // Init
  loadSlide(0);
  gsap.set(card, { rotation: -3 });
})();
