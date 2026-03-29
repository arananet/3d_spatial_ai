import { CFG, amplifyAxis } from '../config/index.js';

let scene;
let camera;
let renderer;
let autoAngle = 0;
let useOffAxis = false;
let trackingSnapshot = () => ({ tracking: false, pose: null });
let textureLoader;

export function bootScene(getTrackingState) {
  trackingSnapshot = getTrackingState;
  buildScene();
  tick();
}

function buildScene() {
  const canvas = document.getElementById('c3d');
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0x120a16, 0.2, 4.5);
  textureLoader = new THREE.TextureLoader();

  const baseViewDist = CFG.viewDist * CFG.ws;
  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, CFG.near, CFG.far);
  camera.position.set(0, 0.04, baseViewDist + 0.35);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.physicallyCorrectLights = true;

  scene.add(new THREE.HemisphereLight(0xfff4de, 0x0b0307, 0.45));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.25);
  sun.position.set(0.9, 1.6, 1.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 3;
  sun.shadow.camera.left = -1;
  sun.shadow.camera.right = 1;
  sun.shadow.camera.top = 1;
  sun.shadow.camera.bottom = -1;
  scene.add(sun);

  const fill = new THREE.SpotLight(0x9fdcff, 0.55, 4, Math.PI / 4, 0.4, 0.7);
  fill.position.set(-1.2, 0.7, 0.6);
  scene.add(fill);

  const accent = new THREE.PointLight(0xff935c, 0.65, 2.5);
  accent.position.set(0.35, 0.5, 0.4);
  scene.add(accent);

  const placeholderKitchen = makeKitchenBackdropTex();
  const kitchenBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 2.7),
    new THREE.MeshStandardMaterial({ map: placeholderKitchen, roughness: 0.95, metalness: 0.04 })
  );
  kitchenBackdrop.position.set(0, 0.55, -1.8);
  scene.add(kitchenBackdrop);
  scene.background = placeholderKitchen;
  loadKitchenTexture(kitchenBackdrop.material);

  const backsplash = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf9efe3, roughness: 0.9, metalness: 0.02 })
  );
  backsplash.position.set(0, 0.05, -0.18);
  scene.add(backsplash);

  const counterTop = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xb3764a, roughness: 0.45, metalness: 0.1 })
  );
  counterTop.rotation.x = -Math.PI / 2;
  counterTop.position.set(0, -0.11, 0.18);
  counterTop.receiveShadow = true;
  scene.add(counterTop);

  const counterBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.26, 1.05),
    new THREE.MeshLambertMaterial({ color: 0x4a2b1c })
  );
  counterBody.position.set(0, -0.25, 0.15);
  scene.add(counterBody);

  const underGlow = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.01, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xfff0cf })
  );
  underGlow.position.set(0, 0.34, -0.2);
  scene.add(underGlow);

  const BW = 0.044; const BH = 0.145; const BD = 0.018;
  const heroBox = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#ff6600', '#cc2200'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#ff6600', '#cc2200'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeTopTex(), roughness: 0.4, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ map: makeBotTex(), roughness: 0.55, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeFrontTex(), roughness: 0.32, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: makeBackTex(), roughness: 0.35, metalness: 0.08 }),
  ]);
  heroBox.position.set(0, -0.108 + BH / 2, -0.02);
  heroBox.castShadow = true;
  heroBox.receiveShadow = true;
  scene.add(heroBox);

  const variantBoxes = [
    {
      title: 'SKYLINE LOOPS',
      flavor: 'Tropical Citrus',
      tagline: 'Kellogg Studio holographic loops built for spatial packaging pilots.',
      brand: 'Kellogg Studio',
      gradient: ['#ff7a36', '#ffbe5c'],
      short: 'SKYLINE',
      width: 0.034,
      height: 0.12,
      depth: 0.014,
      topColor: 0xfff0d0,
      bottomColor: 0xcc5a29,
      position: { x: -0.09, y: -0.11 + 0.12 / 2, z: 0.035 },
      rotationY: 0.38,
    },
    {
      title: 'GENERAL GRAINS',
      flavor: 'Maple Crunch',
      tagline: 'General Grains reference build for Spec Kit calibration flows.',
      brand: 'General Grains R&D',
      gradient: ['#9227ff', '#f94892'],
      short: 'GEN GRAINS',
      width: 0.03,
      height: 0.11,
      depth: 0.013,
      topColor: 0xfdf0ff,
      bottomColor: 0x7a2078,
      position: { x: -0.045, y: -0.11 + 0.11 / 2, z: 0.09 },
      rotationY: 0.08,
    },
  ];

  variantBoxes.forEach((cfg) => {
    const mesh = createVariantBox(cfg);
    mesh.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
    mesh.rotation.y = cfg.rotationY;
    scene.add(mesh);
  });

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  bowl.rotation.x = Math.PI;
  bowl.position.set(0.11, -0.075, 0.12);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  const milk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.03, 0.008, 20),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  );
  milk.position.set(0.11, -0.07, 0.12);
  milk.receiveShadow = true;
  scene.add(milk);

  const spoon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.09, 8),
    new THREE.MeshLambertMaterial({ color: 0xd0d0d0 })
  );
  spoon.position.set(0.17, -0.105, 0.18);
  spoon.rotation.z = 0.45;
  spoon.rotation.x = 0.1;
  spoon.castShadow = true;
  scene.add(spoon);

  const placemat = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 40),
    new THREE.MeshStandardMaterial({ color: 0xe7cfa8, roughness: 0.85 })
  );
  placemat.rotation.x = -Math.PI / 2;
  placemat.position.set(0.11, -0.108, 0.12);
  placemat.receiveShadow = true;
  scene.add(placemat);

  const fruitBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.025, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.25 })
  );
  fruitBowl.position.set(-0.18, -0.094, 0.08);
  fruitBowl.castShadow = true;
  fruitBowl.receiveShadow = true;
  scene.add(fruitBowl);
  addFruit(fruitBowl);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.07, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.15 })
  );
  mug.position.set(-0.14, -0.075, -0.02);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.004, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.15 })
  );
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.028, 0, 0);
  mug.add(handle);
  mug.castShadow = true;
  mug.receiveShadow = true;
  scene.add(mug);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    if (!useOffAxis) {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }
  });
}

function tick() {
  requestAnimationFrame(tick);
  const snapshot = trackingSnapshot ? trackingSnapshot() : { tracking: false };
  if (snapshot.tracking && snapshot.pose) {
    useOffAxis = true;
    applyOffAxis(camera, snapshot.pose);
  } else if (camera) {
    useOffAxis = false;
    autoAngle += 0.004;
    const idleRadius = CFG.viewDist * CFG.ws + 0.35;
    camera.position.set(Math.sin(autoAngle) * 0.08, 0.02, idleRadius);
    camera.lookAt(0, -0.02, 0);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function applyOffAxis(cam, pose) {
  const dx = amplifyAxis(pose.x - 0.5, 'x');
  const dy = amplifyAxis(pose.y - 0.5, 'y');
  const depthBoost = THREE.MathUtils.clamp(1.25 - (pose.z - 1.2) * 0.4, 0.85, 1.4);
  const SW = CFG.screenW * CFG.ws;
  const SH = CFG.screenH * CFG.ws;
  const VD = CFG.viewDist * CFG.ws;
  const ex = -dx * SW * CFG.moveScale * depthBoost;
  const ey = -dy * SH * CFG.moveScale * (depthBoost * 0.9);
  const ez = VD / Math.max(0.65, pose.z * 0.9);
  if (ez <= 0) return;
  const nd = CFG.near / ez;
  cam.projectionMatrix.makePerspective(
    (-SW / 2 - ex) * nd,
    (SW / 2 - ex) * nd,
    (SH / 2 - ey) * nd,
    (-SH / 2 - ey) * nd,
    CFG.near,
    CFG.far
  );
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  cam.position.set(ex, ey, ez);
  cam.lookAt(ex, ey, 0);
}

function loadKitchenTexture(targetMat) {
  if (!textureLoader) return;
  textureLoader.load(
    './assets/kitchen-backdrop.png',
    (tex) => {
      finalizeTexture(tex);
      targetMat.map = tex;
      targetMat.needsUpdate = true;
      scene.background = tex;
    },
    undefined,
    () => {
      if (!targetMat.map) {
        const fallback = makeKitchenBackdropTex();
        targetMat.map = fallback;
        targetMat.needsUpdate = true;
        scene.background = fallback;
      }
    }
  );
}

function finalizeTexture(tex) {
  if (!tex) return tex;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function mkCtx(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

function rrect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const paragraphs = text.split(/\n/);
  paragraphs.forEach((para) => {
    if (!para.trim()) {
      y += lineH;
      return;
    }
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const testLine = line + w + ' ';
      if (ctx.measureText(testLine).width > maxW && line) {
        ctx.fillText(line.trim(), x, y);
        y += lineH;
        line = w + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, y);
      y += lineH;
    }
  });
}

function makeFrontTex() {
  const W = 320; const H = 1008; const [c, ctx] = mkCtx(W, H);
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#ff5500');
  gradient.addColorStop(0.55, '#ffaa00');
  gradient.addColorStop(1, '#ff3300');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.13);
  ctx.bezierCurveTo(W * 0.4, H * 0.08, W * 0.6, H * 0.19, W, H * 0.14);
  ctx.lineTo(W, H * 0.2);
  ctx.bezierCurveTo(W * 0.6, H * 0.25, W * 0.4, H * 0.14, 0, H * 0.19);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${W * 0.155}px 'Arial Black',Impact,sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillText('DEPTH', W / 2, H * 0.10);
  ctx.fillText('CRUNCH', W / 2, H * 0.18);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const mx = W / 2;
  const my = H * 0.46;
  const R = W * 0.30;
  ctx.save();
  ctx.translate(mx, my);
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.moveTo(R * 0.78, 0);
    ctx.lineTo(R * 1.08, -R * 0.07);
    ctx.lineTo(R * 1.18, 0);
    ctx.lineTo(R * 1.08, R * 0.07);
    ctx.closePath();
    ctx.fillStyle = '#ffe85a';
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(mx, my, R * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe85a';
  ctx.fill();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(mx - R * 0.22, my - R * 0.09, R * 0.09, R * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(mx + R * 0.22, my - R * 0.09, R * 0.09, R * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(mx - R * 0.17, my - R * 0.14, R * 0.033, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + R * 0.27, my - R * 0.14, R * 0.033, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx, my + R * 0.06, R * 0.34, 0.18, Math.PI - 0.18);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = '#ff5050';
  ctx.beginPath();
  ctx.ellipse(mx - R * 0.46, my + R * 0.12, R * 0.14, R * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(mx + R * 0.46, my + R * 0.12, R * 0.14, R * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath();
  rrect(ctx, W * 0.25, H * 0.67, W * 0.50, H * 0.055, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${W * 0.07}px Arial,sans-serif`;
  ctx.fillText('SUNNY', W / 2, H * 0.698);
  ctx.font = `bold ${W * 0.058}px Arial,sans-serif`;
  ctx.fillText('HONEY OAT', W / 2, H * 0.778);
  ctx.fillText('CLUSTERS', W / 2, H * 0.828);
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.font = `italic ${W * 0.046}px Georgia,serif`;
  ctx.fillText('"Look Deeper"', W / 2, H * 0.876);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fillRect(0, H * 0.915, W, H * 0.085);
  ctx.fillStyle = '#fff';
  ctx.font = `${W * 0.038}px Arial,sans-serif`;
  ctx.fillText('NET WT 12 OZ (340g)', W / 2, H * 0.958);
  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeBackTex() {
  const W = 320; const H = 1008; const [c, ctx] = mkCtx(W, H);
  ctx.fillStyle = '#fff9f2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(0, 0, W, H * 0.11);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${W * 0.072}px 'Arial Black',sans-serif`;
  ctx.fillText('HOW THIS WORKS', W / 2, H * 0.055);
  const steps = [
    { e: '📸', t: 'Scan the QR code', d: 'Point your phone at the QR on the side panel.' },
    { e: '🧠', t: 'AI tracks your head', d: 'FaceMesh detects 468 face landmarks locally, 60× per second.' },
    { e: '👁️', t: 'Three.js shifts view', d: 'Camera perspective updates in real time based on your position.' },
    { e: '✨', t: 'Move your head', d: 'Lean left, right, forward or back — the box responds in 3D.' },
  ];
  steps.forEach((step, i) => {
    const cy = H * (0.18 + i * 0.185);
    ctx.fillStyle = i % 2 === 0 ? '#fff3e0' : '#fff';
    ctx.beginPath();
    rrect(ctx, W * 0.08, cy - H * 0.075, W * 0.84, H * 0.14, 16);
    ctx.fill();
    ctx.fillStyle = '#ff6600';
    ctx.font = `${W * 0.1}px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif`;
    ctx.fillText(step.e, W * 0.17, cy);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.font = `700 ${W * 0.06}px 'Space Grotesk',sans-serif`;
    ctx.fillText(step.t, W * 0.27, cy - H * 0.02);
    ctx.font = `400 ${W * 0.045}px 'Space Grotesk',sans-serif`;
    wrapText(ctx, step.d, W * 0.27, cy + H * 0.02, W * 0.62, H * 0.05);
    ctx.textAlign = 'center';
  });
  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeSideTex(label, c1, c2) {
  const W = 200; const H = 1008; const [c, ctx] = mkCtx(W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  ctx.fillRect(W * 0.08, 0, W * 0.12, H);
  ctx.fillRect(W * 0.80, 0, W * 0.12, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = `bold ${H * 0.055}px 'Arial Black',Impact,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeTopTex() {
  const W = 400; const H = 160; const [c, ctx] = mkCtx(W, H);
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${H * 0.52}px 'Arial Black',Impact,sans-serif`;
  ctx.fillText('DEPTHCRUNCH', W / 2, H / 2);
  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeBotTex() {
  const W = 400; const H = 160; const [c, ctx] = mkCtx(W, H);
  ctx.fillStyle = '#cc4400';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  let bx = W * 0.2;
  while (bx < W * 0.8) {
    const bw = Math.random() * 2.5 + 1;
    ctx.fillRect(bx, H * 0.15, bw, H * 0.55);
    bx += bw + Math.random() * 3.5 + 1;
  }
  ctx.font = `${H * 0.15}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('0 12345 67890 5', W / 2, H * 0.73);
  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeKitchenBackdropTex() {
  const W = 2048; const H = 1024; const [c, ctx] = mkCtx(W, H);
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#f4ece2');
  wall.addColorStop(0.6, '#f1e2d2');
  wall.addColorStop(1, '#d9c5b1');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  const cabY = H * 0.08; const cabH = H * 0.32;
  ctx.fillStyle = '#f3e8d7';
  ctx.fillRect(W * 0.05, cabY, W * 0.9, cabH);
  const doorW = W * 0.18; const gap = W * 0.02;
  ctx.strokeStyle = 'rgba(0,0,0,.08)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const dx = W * 0.07 + i * (doorW + gap);
    ctx.fillStyle = i % 2 ? '#f0e1cf' : '#f8efe2';
    ctx.beginPath();
    rrect(ctx, dx, cabY + H * 0.02, doorW, cabH - H * 0.04, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c2b4a3';
    ctx.fillRect(dx + doorW * 0.4, cabY + cabH * 0.8, doorW * 0.2, 8);
  }

  const tileY = H * 0.42; const tileH = H * 0.15;
  ctx.fillStyle = '#fffaf4';
  ctx.fillRect(W * 0.04, tileY, W * 0.92, tileH);
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  for (let y = 0; y < 6; y++) {
    for (let i = 0; i < 18; i++) {
      const tw = W * 0.045;
      const th = tileH / 6 - 6;
      ctx.globalAlpha = 0.08 + (i % 3) * 0.02;
      ctx.fillRect(W * 0.05 + i * (tw + 6), tileY + 4 + y * (th + 6), tw, th);
    }
  }
  ctx.globalAlpha = 1;

  const winX = W * 0.65; const winY = H * 0.11; const winW = W * 0.24; const winH = H * 0.28;
  ctx.fillStyle = '#d0e9ff';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.fillStyle = '#fef9e6';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(winX + 10, winY + 10, winW - 20, winH - 20);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 10;
  ctx.strokeRect(winX, winY, winW, winH);

  const counterGrad = ctx.createLinearGradient(0, tileY + tileH, 0, H);
  counterGrad.addColorStop(0, '#b7774b');
  counterGrad.addColorStop(1, '#6a3a1e');
  ctx.fillStyle = counterGrad;
  ctx.fillRect(0, tileY + tileH, W, H - (tileY + tileH));

  return finalizeTexture(new THREE.CanvasTexture(c));
}

function makeVariantTex(cfg) {
  const W = 300; const H = 900; const [c, ctx] = mkCtx(W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, cfg.gradient[0]);
  grad.addColorStop(1, cfg.gradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(0, 0, W, H * 0.22);
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.fillRect(0, H * 0.65, W, H * 0.2);

  if (cfg.side === 'back') {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${W * 0.1}px 'Space Grotesk',sans-serif`;
    ctx.fillText('Spec Flow', W * 0.08, H * 0.07);
    ctx.font = `500 ${W * 0.055}px 'Space Grotesk',sans-serif`;
    wrapText(
      ctx,
      '1. Scan QR on packaging\n2. Calibrate screen + view distance\n3. Allow camera access\n4. Lean and explore',
      W * 0.08,
      H * 0.17,
      W * 0.84,
      H * 0.08
    );
    ctx.font = `600 ${W * 0.06}px 'Space Grotesk',sans-serif`;
    ctx.fillText(`Powered by ${cfg.brand}`, W * 0.08, H * 0.58);
  } else {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${W * 0.17}px 'Arial Black',Impact,sans-serif`;
    const lines = cfg.title.split(' ');
    lines.forEach((line, i) => ctx.fillText(line, W / 2, H * 0.18 + i * W * 0.12));
    ctx.font = `600 ${W * 0.075}px 'Space Grotesk',sans-serif`;
    ctx.fillText(cfg.flavor, W / 2, H * 0.45);
    ctx.font = `500 ${W * 0.06}px 'Space Grotesk',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    wrapText(ctx, cfg.tagline, W / 2, H * 0.58, W * 0.8, H * 0.08);
  }

  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.12);
  ctx.bezierCurveTo(W * 0.4, H * 0.05, W * 0.6, H * 0.2, W, H * 0.14);
  ctx.lineTo(W, H * 0.24);
  ctx.bezierCurveTo(W * 0.65, H * 0.31, W * 0.35, H * 0.16, 0, H * 0.26);
  ctx.closePath();
  ctx.fill();

  return finalizeTexture(new THREE.CanvasTexture(c));
}

function createVariantBox(cfg) {
  const geometry = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const matFront = new THREE.MeshStandardMaterial({
    map: makeVariantTex({ ...cfg, side: 'front' }),
    roughness: 0.45,
    metalness: 0.08,
  });
  const matBack = new THREE.MeshStandardMaterial({
    map: makeVariantTex({ ...cfg, side: 'back' }),
    roughness: 0.45,
    metalness: 0.08,
  });
  const sideTex = makeSideTex(cfg.short, cfg.gradient[0], cfg.gradient[1]);
  const mats = [
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.52, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.52, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: cfg.topColor || 0xfff0d2, roughness: 0.38, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ color: cfg.bottomColor || 0xb85529, roughness: 0.6, metalness: 0.05 }),
    matFront,
    matBack,
  ];
  const mesh = new THREE.Mesh(geometry, mats);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addFruit(parent) {
  const base = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffb347 })
  );
  const fruit2 = base.clone();
  fruit2.position.set(-0.005, 0.01, 0.012);
  base.position.set(0.01, 0.008, 0);
  const fruit3 = base.clone();
  fruit3.material = new THREE.MeshStandardMaterial({ color: 0xff6f61 });
  fruit3.position.set(-0.012, 0.006, -0.01);
  parent.add(base, fruit2, fruit3);
}
