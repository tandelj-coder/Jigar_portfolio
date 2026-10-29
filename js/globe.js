import * as THREE from 'three';
import { attribute, cos, mix, positionLocal, sin, time, uniform, vec3 } from 'three/tsl';
import { animate, frame, motionValue } from 'motion';

const JAPAN_PHOTOS = [
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80&crossorigin=anonymous',
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200&auto=format&fit=crop&q=80&crossorigin=anonymous',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&auto=format&fit=crop&q=80&crossorigin=anonymous',
  'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1200&auto=format&fit=crop&q=80&crossorigin=anonymous',
];
const COLUMNS  = 180;
const globeYaw = Math.random() * Math.PI * 2;

const section    = document.getElementById('globe-section');
const canvasWrap = document.getElementById('globe-canvas-wrap');
const canvas     = document.getElementById('globe-canvas');
const fallback   = document.getElementById('globe-fallback');
const hint       = document.querySelector('.globe-hint');

// ── Fallback: 2D canvas starfield ──────────────────────────────────
function startStarfield() {
  const fb = document.getElementById('globe-fallback');
  fb.style.display = 'block';

  const c = document.createElement('canvas');
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  fb.appendChild(c);

  const ctx = c.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = c.width  = fb.clientWidth  || window.innerWidth;
    H = c.height = fb.clientHeight || window.innerHeight;
  }

  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 3200);
    for (let i = 0; i < count; i++) {
      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.6 + 0.2,
        alpha: Math.random() * 0.7 + 0.15,
        speed: Math.random() * 0.3 + 0.05,
        twinkle: Math.random() * Math.PI * 2,
        tspeed: Math.random() * 0.02 + 0.005,
      });
    }
  }

  // A few "nebula" blobs for atmosphere
  const nebulae = [
    { x: 0.18, y: 0.3,  r: 0.22, col: 'rgba(45,74,110,' },
    { x: 0.75, y: 0.6,  r: 0.18, col: 'rgba(184,92,56,' },
    { x: 0.5,  y: 0.85, r: 0.15, col: 'rgba(45,74,110,' },
  ];

  let t = 0;
  function draw() {
    t += 0.016;

    // Deep-space background
    ctx.fillStyle = '#0e0e0a';
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    nebulae.forEach(n => {
      const grd = ctx.createRadialGradient(n.x*W, n.y*H, 0, n.x*W, n.y*H, n.r*Math.min(W,H));
      grd.addColorStop(0, n.col + '0.07)');
      grd.addColorStop(1, n.col + '0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(n.x*W, n.y*H, n.r*W*0.7, n.r*H, 0, 0, Math.PI*2);
      ctx.fill();
    });

    // Stars
    stars.forEach(s => {
      s.twinkle += s.tspeed;
      const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));

      // Gentle drift
      s.y -= s.speed * 0.12;
      if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }

      // Glow
      if (s.r > 1.0) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        grd.addColorStop(0, `rgba(232,228,217,${a * 0.5})`);
        grd.addColorStop(1, 'rgba(232,228,217,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,228,217,${a})`;
      ctx.fill();
    });

    // Shooting star occasionally
    if (Math.floor(t * 10) % 180 === 0) {
      const sx = Math.random() * W * 0.7;
      const sy = Math.random() * H * 0.4;
      const len = 80 + Math.random() * 120;
      const g = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
      g.addColorStop(0, 'rgba(232,228,217,0)');
      g.addColorStop(0.5, 'rgba(232,228,217,0.7)');
      g.addColorStop(1, 'rgba(232,228,217,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy + len * 0.4);
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  window.addEventListener('resize', () => { resize(); initStars(); });
  draw();
}

// ── WebGPU globe ──────────────────────────────────────────────────
function highResolutionMix(globeAmount) {
  const amount = Math.max(globeAmount, 0);
  const start  = 0.005, end = 0.035;
  const t = Math.min(1, Math.max(0, (amount - start) / (end - start)));
  return 1 - t * t * (3 - 2 * t);
}

function pickPhoto() {
  const prev    = sessionStorage.getItem('jt-globe-photo');
  const choices = JAPAN_PHOTOS.filter(p => p !== prev);
  const pick    = choices[Math.floor(Math.random() * choices.length)];
  sessionStorage.setItem('jt-globe-photo', pick);
  return pick;
}

function loadPhoto(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const source = document.createElement('canvas');
      source.width  = image.naturalWidth;
      source.height = image.naturalHeight;
      const ctx = source.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const map = new THREE.Texture(image);
      map.colorSpace = THREE.SRGBColorSpace;
      map.needsUpdate = true;
      resolve({
        width:  source.width,
        height: source.height,
        pixels: ctx.getImageData(0, 0, source.width, source.height).data,
        map,
      });
    };
    image.onerror = () => reject(new Error('Photo load failed'));
    image.src = url;
  });
}

function createParticles(photo) {
  const imageAspect = photo.width / photo.height;
  const rows  = Math.round(COLUMNS / imageAspect);
  const count = COLUMNS * rows;
  const imagePositions = new Float32Array(count * 3);
  const globePositions = new Float32Array(count * 3);
  const colours = new Float32Array(count * 3);
  const phases  = new Float32Array(count);
  const speeds  = new Float32Array(count);
  const colour  = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    const sx  = Math.min(photo.width  - 1, Math.floor((col + 0.5) / COLUMNS * photo.width));
    const sy  = Math.min(photo.height - 1, Math.floor((row + 0.5) / rows    * photo.height));
    const px  = (sy * photo.width + sx) * 4;
    const off = i * 3;
    colour.setRGB(photo.pixels[px]/255, photo.pixels[px+1]/255, photo.pixels[px+2]/255, THREE.SRGBColorSpace);
    colours[off]   = colour.r;
    colours[off+1] = colour.g;
    colours[off+2] = colour.b;
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.7 + Math.random() * 0.35;
  }

  const geometry = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  geometry.instanceCount = count;
  geometry.setAttribute('imagePosition', new THREE.InstancedBufferAttribute(imagePositions, 3));
  geometry.setAttribute('globePosition', new THREE.InstancedBufferAttribute(globePositions, 3));
  geometry.setAttribute('colour',        new THREE.InstancedBufferAttribute(colours, 3));
  geometry.setAttribute('phase',         new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('speed',         new THREE.InstancedBufferAttribute(speeds, 1));

  const globeUniform    = uniform(1);
  const particleSize    = uniform(new THREE.Vector2(0.01, 0.01));
  const imagePositionA  = attribute('imagePosition');
  const spherePositionA = attribute('globePosition');
  const phaseA  = attribute('phase');
  const speedA  = attribute('speed');

  const turbulence = vec3(
    sin(time.mul(speedA.add(0.6)).add(phaseA)).mul(0.045),
    cos(time.mul(speedA.add(0.37)).add(phaseA.mul(1.71))).mul(0.035),
    sin(time.mul(speedA.add(0.22)).add(phaseA.mul(2.13))).mul(0.045)
  );

  const material = new THREE.MeshBasicNodeMaterial({ toneMapped: false });
  material.colorNode = attribute('colour');
  const center = mix(imagePositionA, spherePositionA.add(turbulence), globeUniform);
  material.positionNode = center.add(vec3(positionLocal.xy.mul(particleSize), 0));

  return { imageAspect, columns: COLUMNS, rows, particleSize, globeUniform, object: new THREE.Mesh(geometry, material) };
}

function createPhotoOverlay(photo) {
  const mat = new THREE.MeshBasicMaterial({
    map: photo.map, toneMapped: false,
    transparent: true, depthWrite: false, depthTest: false, opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = 1;
  return mesh;
}

function layoutParticles(particles, photoMesh, aspect) {
  const { columns, imageAspect, object, particleSize, rows } = particles;
  const imageHalfHeight = Math.min(0.72, 0.86 * aspect / imageAspect);
  const imageHalfWidth  = imageHalfHeight * imageAspect;
  const globeRadius = Math.min(0.58, aspect * 0.82);
  const pos    = object.geometry.getAttribute('imagePosition');
  const sphere = object.geometry.getAttribute('globePosition');
  const yawCos = Math.cos(globeYaw);
  const yawSin = Math.sin(globeYaw);
  const tilt   = -0.28;

  for (let i = 0; i < pos.count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x   = (col + 0.5) / columns;
    const y   = (row + 0.5) / rows;
    const sphereY = 1 - i / Math.max(pos.count - 1, 1) * 2;
    const ringR   = Math.sqrt(Math.max(0, 1 - sphereY * sphereY));
    const angle   = i * 2.39996323;
    const sphereX = Math.cos(angle) * ringR;
    const sphereZ = Math.sin(angle) * ringR;
    const spunX   = sphereX * yawCos + sphereZ * yawSin;
    const spunZ   = -sphereX * yawSin + sphereZ * yawCos;

    pos.setXYZ(i, (x - 0.5) * imageHalfWidth * 2, (0.5 - y) * imageHalfHeight * 2, 0);
    sphere.setXYZ(i,
      spunX * globeRadius,
      (sphereY * Math.cos(tilt) - spunZ * Math.sin(tilt)) * globeRadius,
      (sphereY * Math.sin(tilt) + spunZ * Math.cos(tilt)) * globeRadius
    );
  }
  pos.needsUpdate    = true;
  sphere.needsUpdate = true;
  particleSize.value.set(
    imageHalfWidth  * 2 / columns * 1.01,
    imageHalfHeight * 2 / rows    * 1.01
  );
  photoMesh.scale.set(imageHalfWidth * 2, imageHalfHeight * 2, 1);
}

async function startGlobe() {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const photo     = await loadPhoto(pickPhoto());
  const particles = createParticles(photo);
  const photoMesh = createPhotoOverlay(photo);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e0a);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 4;

  scene.add(particles.object);
  scene.add(photoMesh);

  const globeValue = motionValue(1);
  globeValue.on('change', v => {
    particles.globeUniform.value = v;
    photoMesh.material.opacity   = highResolutionMix(v);
  });

  animate(globeValue, 0, { type: 'spring', stiffness: 55, damping: 16, mass: 1, delay: 0.8 });

  let pressing = false;
  canvas.addEventListener('pointerdown', () => {
    pressing = true;
    if (hint) hint.style.opacity = '0';
    animate(globeValue, 1, { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 });
  });
  const release = () => {
    if (!pressing) return;
    pressing = false;
    animate(globeValue, 0, { type: 'spring', stiffness: 70, damping: 16, mass: 1 });
  };
  canvas.addEventListener('pointerup',    release);
  canvas.addEventListener('pointerleave', release);
  canvas.addEventListener('touchend',     release);

  const resize = () => {
    const w = Math.max(section.clientWidth,  1);
    const h = Math.max(section.clientHeight, 1);
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.left   = -aspect;
    camera.right  =  aspect;
    camera.top    =  1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    layoutParticles(particles, photoMesh, aspect);
  };
  new ResizeObserver(resize).observe(section);
  resize();

  frame.render(() => renderer.render(scene, camera), true);
}

// ── Boot ──────────────────────────────────────────────────────────
if (!navigator.gpu) {
  canvasWrap.style.display = 'none';
  if (hint) hint.style.display = 'none';
  startStarfield();
} else {
  startGlobe().catch(err => {
    console.error('Globe error:', err);
    canvasWrap.style.display = 'none';
    if (hint) hint.style.display = 'none';
    startStarfield();
  });
}
