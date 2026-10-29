/* ═══════════════════════════════════════════════════════
   JIGAR TANDEL — logo3d.js
   Three.js WebGL 3D "JT" logo with extrusion + glow
   Falls back to CSS 3D if WebGL unavailable
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('logo-canvas');
  if (!canvas) return;

  /* ── WebGL availability check ───────────────────────── */
  function hasWebGL() {
    try {
      const ctx = document.createElement('canvas').getContext('webgl2') ||
                  document.createElement('canvas').getContext('webgl');
      return !!ctx;
    } catch (_) { return false; }
  }

  if (!hasWebGL()) {
    startCSSLogo();
    return;
  }

  /* ── Three.js 3D Logo ───────────────────────────────── */
  function startThreeLogo() {
    const THREE = window.THREE;
    if (!THREE) { startCSSLogo(); return; }

    const W = canvas.offsetWidth || 120;
    const H = canvas.offsetHeight || 120;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    /* Accent colour */
    const LIME = 0xd4f23b;
    const WHITE = 0xf0ede6;

    /* Letter "J" via shape */
    function makeJ() {
      const shape = new THREE.Shape();
      // J bar (top)
      shape.moveTo(-0.55, 0.9);
      shape.lineTo(0.55, 0.9);
      shape.lineTo(0.55, 0.65);
      shape.lineTo(0.1, 0.65);
      // J stem
      shape.lineTo(0.1, -0.45);
      // J curve at bottom
      shape.quadraticCurveTo(0.1, -0.9, -0.2, -0.9);
      shape.quadraticCurveTo(-0.55, -0.9, -0.55, -0.5);
      shape.lineTo(-0.55, -0.3);
      shape.lineTo(-0.3, -0.3);
      shape.lineTo(-0.3, -0.5);
      shape.quadraticCurveTo(-0.3, -0.65, -0.12, -0.65);
      shape.quadraticCurveTo(0.1, -0.65, -0.12, -0.45);
      shape.lineTo(-0.12, 0.65);
      shape.lineTo(-0.55, 0.65);
      shape.closePath();
      return shape;
    }

    /* Letter "T" via shape */
    function makeT() {
      const shape = new THREE.Shape();
      // T bar
      shape.moveTo(-0.55, 0.65);
      shape.lineTo(-0.55, 0.9);
      shape.lineTo(0.55, 0.9);
      shape.lineTo(0.55, 0.65);
      // right gap
      shape.lineTo(0.15, 0.65);
      // T stem
      shape.lineTo(0.15, -0.9);
      shape.lineTo(-0.15, -0.9);
      shape.lineTo(-0.15, 0.65);
      shape.closePath();
      return shape;
    }

    const extrudeSettings = {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
    };

    /* Material: metallic lime on front, dark on sides */
    const matFront = new THREE.MeshStandardMaterial({
      color: LIME,
      metalness: 0.65,
      roughness: 0.18,
      envMapIntensity: 1.2,
    });
    const matSide = new THREE.MeshStandardMaterial({
      color: 0x1a1a0a,
      metalness: 0.4,
      roughness: 0.4,
    });

    const jGeo = new THREE.ExtrudeGeometry(makeJ(), extrudeSettings);
    const tGeo = new THREE.ExtrudeGeometry(makeT(), extrudeSettings);

    const jMesh = new THREE.Mesh(jGeo, [matFront, matSide]);
    jMesh.position.set(-0.68, 0, 0);

    const tMesh = new THREE.Mesh(tGeo, [matFront, matSide]);
    tMesh.position.set(0.68, 0, 0);

    const group = new THREE.Group();
    group.add(jMesh, tMesh);
    group.position.z = -0.11; // center on z
    scene.add(group);

    /* Lights */
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const key = new THREE.DirectionalLight(LIME, 2.5);
    key.position.set(2, 3, 4);
    const fill = new THREE.DirectionalLight(WHITE, 0.7);
    fill.position.set(-3, -1, 2);
    const rim = new THREE.PointLight(LIME, 1.8, 12);
    rim.position.set(0, -2, 2);
    scene.add(ambient, key, fill, rim);

    /* Idle rotation + mouse tilt */
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;
    const wrapper = canvas.closest('.nav-logo-wrap') || canvas.parentElement;

    wrapper.addEventListener('mousemove', e => {
      const r = wrapper.getBoundingClientRect();
      targetRotX = ((e.clientY - r.top) / r.height - 0.5) * 0.8;
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
    });
    wrapper.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.012;

      // Gentle idle sway
      const idleY = Math.sin(t) * 0.12;
      const idleX = Math.cos(t * 0.7) * 0.06;

      // Lerp to mouse
      currentRotX += (targetRotX + idleX - currentRotX) * 0.07;
      currentRotY += (targetRotY + idleY - currentRotY) * 0.07;

      group.rotation.x = currentRotX;
      group.rotation.y = currentRotY;

      // Subtle rim pulse
      rim.intensity = 1.6 + Math.sin(t * 1.8) * 0.4;

      renderer.render(scene, camera);
    }
    animate();

    /* Handle resize */
    const ro = new ResizeObserver(() => {
      const nW = canvas.offsetWidth;
      const nH = canvas.offsetHeight;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);
  }

  /* ── CSS 3D fallback logo ───────────────────────────── */
  function startCSSLogo() {
    canvas.style.display = 'none';
    const logo = document.querySelector('.nav-logo-text');
    if (logo) logo.style.display = '';
  }

  /* Boot — Three.js is loaded via CDN in index.html head */
  if (window.THREE) {
    startThreeLogo();
  } else {
    startCSSLogo();
  }

})();
