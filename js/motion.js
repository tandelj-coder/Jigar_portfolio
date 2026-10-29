/* ═══════════════════════════════════════════════════════
   JIGAR TANDEL — motion.js
   Motion graphics layer:
   - Magnetic cursor with distortion ring
   - SplitText hero character animation
   - Pinned hero scroll scrub
   - Particle field canvas overlay
   - Stagger reveals with GSAP
   - Nav morph on scroll
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────────────────
     1. MAGNETIC CURSOR
  ───────────────────────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');

  if (cursor && cursorDot) {
    let mx = 0, my = 0;
    let cx = 0, cy = 0;
    let cdx = 0, cdy = 0;
    let isHovering = false;

    window.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
    });

    // Magnetic targets
    const magnets = document.querySelectorAll('.hero-cta, .contact-row:not(.no-link), .nav-links a, .project-item');
    magnets.forEach(el => {
      el.addEventListener('mouseenter', () => { isHovering = true; cursor.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', () => { isHovering = false; cursor.classList.remove('cursor-hover'); });
    });

    function animateCursor() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cdx += (mx - cdx) * 0.85;
      cdy += (my - cdy) * 0.85;

      cursor.style.transform = `translate(${cx - 20}px, ${cy - 20}px)`;
      cursorDot.style.transform = `translate(${cdx - 3}px, ${cdy - 3}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mousedown', () => cursor.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('cursor-click'));
  }

  /* ─────────────────────────────────────────────────────
     2. PARTICLE FIELD (hero canvas background)
  ───────────────────────────────────────────────────── */
  const heroCanvas = document.getElementById('particle-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let particles = [];
    const LIME = '#d4f23b';

    function resize() {
      heroCanvas.width = heroCanvas.offsetWidth;
      heroCanvas.height = heroCanvas.offsetHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const count = Math.floor((heroCanvas.width * heroCanvas.height) / 14000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * heroCanvas.width,
          y: Math.random() * heroCanvas.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.4 + 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let frame = 0;
    function drawParticles() {
      requestAnimationFrame(drawParticles);
      ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
      frame += 0.008;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = heroCanvas.width;
        if (p.x > heroCanvas.width) p.x = 0;
        if (p.y < 0) p.y = heroCanvas.height;
        if (p.y > heroCanvas.height) p.y = 0;

        const pulse = p.alpha + Math.sin(frame + p.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = LIME;
        ctx.globalAlpha = Math.max(0, pulse);
        ctx.fill();

        // Connect nearby
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = LIME;
            ctx.globalAlpha = (1 - dist / 90) * 0.07;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
    }

    resize();
    window.addEventListener('resize', resize);
    drawParticles();
  }

  /* ─────────────────────────────────────────────────────
     3. SPLITTEXT HERO — char-by-char reveal
  ───────────────────────────────────────────────────── */
  function splitChars(el) {
    const text = el.textContent;
    el.innerHTML = '';
    text.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.display = 'inline-block';
      el.appendChild(span);
    });
    return el.querySelectorAll('.char');
  }

  const heroLines = document.querySelectorAll('.hero-line');
  const allChars = [];
  heroLines.forEach(line => {
    const chars = splitChars(line);
    chars.forEach(c => allChars.push(c));
  });

  gsap.from(allChars, {
    opacity: 0,
    y: 80,
    skewX: -8,
    rotateX: -45,
    duration: 0.7,
    stagger: 0.028,
    ease: 'power3.out',
    delay: 0.15,
    transformOrigin: '0% 50% -20px',
  });

  /* ─────────────────────────────────────────────────────
     4. HERO TOP BAR + DESC: staggered fade
  ───────────────────────────────────────────────────── */
  gsap.from(['.hero-top-bar span', '.hero-desc', '.hero-sub-right'], {
    opacity: 0,
    y: 18,
    duration: 0.65,
    stagger: 0.09,
    ease: 'power2.out',
    delay: 0.85,
  });

  gsap.from('.hero-marquee-wrap', {
    opacity: 0,
    duration: 0.5,
    ease: 'none',
    delay: 1.2,
  });

  /* ─────────────────────────────────────────────────────
     5. NAV: hide on scroll-down, show on scroll-up + slim
  ───────────────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  let lastY = 0;
  nav.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.35s';

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      nav.classList.add('nav-scrolled');
      nav.style.transform = y > lastY ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      nav.classList.remove('nav-scrolled');
      nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });

  /* ─────────────────────────────────────────────────────
     6. SECTION HEADINGS: slide from left with clip reveal
  ───────────────────────────────────────────────────── */
  document.querySelectorAll('.section-heading').forEach(el => {
    // Wrap for clip-path reveal
    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    gsap.from(el, {
      scrollTrigger: { trigger: wrapper, start: 'top 88%' },
      x: -60,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
    });
  });

  /* ─────────────────────────────────────────────────────
     7. SECTION NUMBERS: fade in
  ───────────────────────────────────────────────────── */
  document.querySelectorAll('.section-num').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      opacity: 0,
      x: -20,
      duration: 0.5,
      ease: 'power2.out',
    });
  });

  /* ─────────────────────────────────────────────────────
     8. ABOUT BODY: paragraphs stagger
  ───────────────────────────────────────────────────── */
  gsap.from('.about-body', {
    scrollTrigger: { trigger: '.about-grid', start: 'top 82%' },
    opacity: 0,
    y: 24,
    duration: 0.7,
    stagger: 0.14,
    ease: 'power2.out',
  });

  /* ─────────────────────────────────────────────────────
     9. GRID STAGGER (fact-cells, skill-blocks, exp-items,
        project-items) via IntersectionObserver + delay
  ───────────────────────────────────────────────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const items = e.target.querySelectorAll(
          '.fact-cell, .skill-block, .exp-item, .project-item'
        );
        items.forEach((item, i) => {
          setTimeout(() => item.classList.add('in-view'), i * 60);
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.fact-grid, .skills-grid, #experience, .projects-list')
    .forEach(el => io.observe(el));

  /* ─────────────────────────────────────────────────────
     10. PROJECT ROW: title nudge + arrow tilt on hover
  ───────────────────────────────────────────────────── */
  document.querySelectorAll('.project-item').forEach(item => {
    const title = item.querySelector('.pi-title');
    item.addEventListener('mouseenter', () => {
      if (title) gsap.to(title, { x: 8, duration: 0.22, ease: 'power2.out' });
    });
    item.addEventListener('mouseleave', () => {
      if (title) gsap.to(title, { x: 0, duration: 0.22, ease: 'power2.out' });
    });
  });

  /* ─────────────────────────────────────────────────────
     11. SKILL BLOCKS: letter-spacing expand on hover
  ───────────────────────────────────────────────────── */
  document.querySelectorAll('.skill-block').forEach(block => {
    const label = block.querySelector('.skill-block-label');
    block.addEventListener('mouseenter', () => {
      if (label) gsap.to(label, { letterSpacing: '0.22em', duration: 0.3, ease: 'power2.out' });
    });
    block.addEventListener('mouseleave', () => {
      if (label) gsap.to(label, { letterSpacing: '0.16em', duration: 0.3, ease: 'power2.out' });
    });
  });

  /* ─────────────────────────────────────────────────────
     12. MARQUEE: pause on hover
  ───────────────────────────────────────────────────── */
  const track = document.getElementById('marquee-track');
  const marqueeWrap = document.querySelector('.hero-marquee-wrap');
  if (track && marqueeWrap) {
    marqueeWrap.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    marqueeWrap.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  }

  /* ─────────────────────────────────────────────────────
     13. CONTACT ROWS: scale bounce on hover
  ───────────────────────────────────────────────────── */
  document.querySelectorAll('.contact-row:not(.no-link)').forEach(row => {
    row.addEventListener('mouseenter', () => {
      gsap.fromTo(row, { scaleX: 0.975 }, { scaleX: 1, duration: 0.28, ease: 'back.out(2.5)' });
    });
  });

  /* ─────────────────────────────────────────────────────
     14. PAGE LOAD: reduce motion guard
  ───────────────────────────────────────────────────── */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) {
    gsap.globalTimeline.timeScale(0);
    document.querySelectorAll('.fact-cell, .skill-block, .exp-item, .project-item')
      .forEach(el => el.classList.add('in-view'));
  }

})();
