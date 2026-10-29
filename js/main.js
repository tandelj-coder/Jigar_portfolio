// Scroll-driven fade-ins
(function() {
  const els = document.querySelectorAll('.exp-row,.skill-item,.service-item,.about-text-col,.fact-cell');
  const io  = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    io.observe(el);
  });

  document.querySelectorAll('.fact-cell').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.05) + 's';
  });
  document.querySelectorAll('.skill-item,.service-item').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.07) + 's';
  });
})();
