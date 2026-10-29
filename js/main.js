/* ═══════════════════════════════════════════════════════
   JIGAR TANDEL PORTFOLIO — main.js
   GSAP ScrollTrigger animations + nav behaviour
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  /* ── Nav: hide/show on scroll ─────────────────────── */
  const nav = document.getElementById('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      nav.style.transform = y > lastY ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });
  nav.style.transition = 'transform 0.3s ease';

  /* ── Hero name: stagger lines in ─────────────────── */
  gsap.from('.hero-line', {
    y: 60,
    opacity: 0,
    skewX: -4,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.1,
  });

  gsap.from('.hero-top-bar, .hero-desc, .hero-sub-right', {
    opacity: 0,
    y: 20,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.55,
  });

  gsap.from('.hero-marquee-wrap', {
    opacity: 0,
    duration: 0.5,
    ease: 'none',
    delay: 0.9,
  });

  /* ── Section headings: slide-in left ─────────────── */
  document.querySelectorAll('.section-heading').forEach(el => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  });

  /* ── Section numbers: fade ────────────────────────── */
  document.querySelectorAll('.section-num').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      opacity: 0,
      duration: 0.6,
      ease: 'none',
    });
  });

  /* ── About body paragraphs ────────────────────────── */
  document.querySelectorAll('.about-body').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      opacity: 0,
      y: 20,
      duration: 0.7,
      delay: i * 0.1,
      ease: 'power2.out',
    });
  });

  /* ── Fact cells: IntersectionObserver stagger ─────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const cells = e.target.querySelectorAll('.fact-cell, .skill-block, .exp-item, .project-item');
        cells.forEach((c, i) => {
          setTimeout(() => c.classList.add('in-view'), i * 60);
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.fact-grid, .skills-grid, #experience, .projects-list').forEach(el => io.observe(el));

  /* ── Project rows: horizontal slide on hover ──────── */
  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      gsap.to(item.querySelector('.pi-title'), { x: 6, duration: 0.25, ease: 'power2.out' });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(item.querySelector('.pi-title'), { x: 0, duration: 0.25, ease: 'power2.out' });
    });
  });

  /* ── Contact rows: flash on hover ────────────────── */
  document.querySelectorAll('.contact-row:not(.no-link)').forEach(row => {
    row.addEventListener('mouseenter', () => {
      gsap.fromTo(row, { scaleX: 0.97 }, { scaleX: 1, duration: 0.25, ease: 'power2.out' });
    });
  });

  /* ── Marquee: slow on hover ───────────────────────── */
  const track = document.getElementById('marquee-track');
  if (track) {
    document.querySelector('.hero-marquee-wrap').addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    document.querySelector('.hero-marquee-wrap').addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  /* ── Skill blocks: accent label reveal ───────────── */
  document.querySelectorAll('.skill-block').forEach(block => {
    const label = block.querySelector('.skill-block-label');
    block.addEventListener('mouseenter', () => {
      gsap.to(label, { letterSpacing: '0.2em', duration: 0.3, ease: 'power2.out' });
    });
    block.addEventListener('mouseleave', () => {
      gsap.to(label, { letterSpacing: '0.16em', duration: 0.3, ease: 'power2.out' });
    });
  });

})();
