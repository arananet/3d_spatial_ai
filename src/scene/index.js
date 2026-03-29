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
  scene.fog = new THREE.Fog(0xf2e8d8, 1.2, 5.0);
  textureLoader = new THREE.TextureLoader();

  const baseViewDist = CFG.viewDist * CFG.ws;
  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, CFG.near, CFG.far);
  camera.position.set(0, 0.04, baseViewDist + 0.55);
  camera.lookAt(0, -0.04, 0);

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
  // Use procedural kitchen directly — avoids PNG override with stale asset
  scene.background = placeholderKitchen;
  const kitchenBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(8.0, 5.0),
    new THREE.MeshStandardMaterial({ map: placeholderKitchen, roughness: 0.95, metalness: 0.04 })
  );
  kitchenBackdrop.position.set(0, 0.30, -1.8);
  scene.add(kitchenBackdrop);

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

  // Real cereal box proportions: ~20cm wide × 30cm tall × 6.5cm deep
  const BW = 0.20; const BH = 0.30; const BD = 0.065;
  const heroBox = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#1255b8', '#0a3a8a'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#1255b8', '#0a3a8a'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeTopTex(), roughness: 0.4, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ map: makeBotTex(), roughness: 0.55, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeFrontTex(), roughness: 0.32, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: makeBackTex(), roughness: 0.35, metalness: 0.08 }),
  ]);
  heroBox.position.set(0.05, -0.11 + BH / 2, -0.04);
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
      width: 0.15,
      height: 0.26,
      depth: 0.055,
      topColor: 0xfff0d0,
      bottomColor: 0xcc5a29,
      position: { x: -0.28, y: -0.11 + 0.13, z: 0.04 },
      rotationY: 0.28,
    },
    {
      title: 'GENERAL GRAINS',
      flavor: 'Maple Crunch',
      tagline: 'General Grains reference build for Spec Kit calibration flows.',
      brand: 'General Grains R&D',
      gradient: ['#9227ff', '#f94892'],
      short: 'GEN GRAINS',
      width: 0.13,
      height: 0.22,
      depth: 0.050,
      topColor: 0xfdf0ff,
      bottomColor: 0x7a2078,
      position: { x: -0.16, y: -0.11 + 0.11, z: 0.09 },
      rotationY: 0.07,
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
  bowl.position.set(0.36, -0.075, 0.16);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  const milk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.03, 0.008, 20),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  );
  milk.position.set(0.36, -0.070, 0.16);
  milk.receiveShadow = true;
  scene.add(milk);

  const spoon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.09, 8),
    new THREE.MeshLambertMaterial({ color: 0xd0d0d0 })
  );
  spoon.position.set(0.45, -0.105, 0.22);
  spoon.rotation.z = 0.45;
  spoon.rotation.x = 0.1;
  spoon.castShadow = true;
  scene.add(spoon);

  const placemat = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 40),
    new THREE.MeshStandardMaterial({ color: 0xe7cfa8, roughness: 0.85 })
  );
  placemat.rotation.x = -Math.PI / 2;
  placemat.position.set(0.36, -0.108, 0.16);
  placemat.receiveShadow = true;
  scene.add(placemat);

  const fruitBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.025, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.25 })
  );
  fruitBowl.position.set(-0.32, -0.094, 0.12);
  fruitBowl.castShadow = true;
  fruitBowl.receiveShadow = true;
  scene.add(fruitBowl);
  addFruit(fruitBowl);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.07, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.15 })
  );
  mug.position.set(-0.24, -0.075, -0.02);
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
    const idleRadius = CFG.viewDist * CFG.ws + 0.55;
    camera.position.set(Math.sin(autoAngle) * 0.05, 0.02, idleRadius);
    camera.lookAt(0, -0.04, 0);
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
  // Kellogg's Froot Loops–inspired design (proof of concept parody)
  const W = 320; const H = 1008; const [c, ctx] = mkCtx(W, H);

  // --- Background: bright white with a sky-blue lower stripe ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Blue bottom zone
  const bgBlue = ctx.createLinearGradient(0, H * 0.55, 0, H);
  bgBlue.addColorStop(0, '#1666c8');
  bgBlue.addColorStop(1, '#0d3fa0');
  ctx.fillStyle = bgBlue;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // --- Kellogg's header band ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H * 0.12);
  ctx.fillStyle = '#e31b23';
  ctx.font = `italic 900 ${W * 0.10}px Georgia,'Times New Roman',serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText("Kellogg's", W / 2, H * 0.062);
  // thin red underline stripe
  ctx.fillStyle = '#e31b23';
  ctx.fillRect(0, H * 0.112, W, H * 0.012);

  // --- "DEPTH CRUNCH" product name ---
  const loopColors = ['#e03030', '#f07010', '#e8c010', '#2ab52a', '#1860d8', '#9030d8'];
  // Each letter in its own colour (simplified — paint word in solid white, then overlay)
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${W * 0.148}px 'Arial Black',Impact,sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.fillText('DEPTH', W / 2, H * 0.195);
  ctx.fillText('CRUNCH', W / 2, H * 0.285);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // flavour line
  ctx.fillStyle = '#111';
  ctx.font = `700 ${W * 0.052}px Arial,sans-serif`;
  ctx.fillText('FRUIT-FLAVORED LOOPS', W / 2, H * 0.335);

  // --- Colourful O–ring loops scattered across mid section ---
  const loops = [
    { cx: W * 0.14, cy: H * 0.42, r: 28, c: '#e03030' },
    { cx: W * 0.46, cy: H * 0.385, r: 24, c: '#f07010' },
    { cx: W * 0.78, cy: H * 0.43, r: 26, c: '#e8c010' },
    { cx: W * 0.28, cy: H * 0.505, r: 22, c: '#2ab52a' },
    { cx: W * 0.60, cy: H * 0.49, r: 30, c: '#1860d8' },
    { cx: W * 0.87, cy: H * 0.375, r: 18, c: '#9030d8' },
    { cx: W * 0.08, cy: H * 0.53, r: 16, c: '#e03030' },
    { cx: W * 0.50, cy: H * 0.54, r: 20, c: '#f07010' },
    { cx: W * 0.73, cy: H * 0.535, r: 14, c: '#2ab52a' },
    { cx: W * 0.35, cy: H * 0.44, r: 19, c: '#9030d8' },
  ];
  for (const l of loops) {
    // drop shadow
    ctx.beginPath(); ctx.arc(l.cx + 3, l.cy + 4, l.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = l.r * 0.44; ctx.stroke();
    // main ring
    ctx.beginPath(); ctx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
    ctx.strokeStyle = l.c; ctx.lineWidth = l.r * 0.40; ctx.stroke();
    // bright highlight arc
    ctx.beginPath(); ctx.arc(l.cx - l.r * 0.08, l.cy - l.r * 0.2, l.r * 0.82, -2.4, -0.5);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = l.r * 0.14; ctx.stroke();
  }

  // --- Simplified Toucan Sam mascot ---
  const bx = W * 0.5, by = H * 0.485;
  // body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(bx, by, 42, 50, 0, 0, Math.PI * 2); ctx.fill();
  // wings
  ctx.fillStyle = '#1255b8';
  ctx.beginPath(); ctx.ellipse(bx - 46, by + 4, 20, 38, -0.28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx + 46, by + 4, 20, 38, 0.28, 0, Math.PI * 2); ctx.fill();
  // belly highlight
  ctx.fillStyle = '#f0f0ff';
  ctx.beginPath(); ctx.ellipse(bx, by + 6, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.fillStyle = '#1255b8';
  ctx.beginPath(); ctx.arc(bx, by - 50, 30, 0, Math.PI * 2); ctx.fill();
  // eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(bx - 10, by - 56, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + 10, by - 56, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(bx - 9, by - 55, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + 11, by - 55, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(bx - 7, by - 57, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + 13, by - 57, 2, 0, Math.PI * 2); ctx.fill();
  // rainbow beak segments
  const beakSegs = ['#e03030', '#f07010', '#e8c010', '#2ab52a'];
  for (let i = 0; i < beakSegs.length; i++) {
    ctx.fillStyle = beakSegs[i];
    ctx.beginPath();
    ctx.ellipse(bx + 30 + i * 13, by - 50, 7, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // feet
  ctx.fillStyle = '#f5a623';
  ctx.fillRect(bx - 18, by + 48, 10, 7);
  ctx.fillRect(bx + 8, by + 48, 10, 7);

  // --- Stars / sparkles ---
  const stars = [{ x: W * 0.07, y: H * 0.35 }, { x: W * 0.90, y: H * 0.32 }, { x: W * 0.93, y: H * 0.65 }, { x: W * 0.04, y: H * 0.68 }];
  for (const s of stars) {
    ctx.fillStyle = 'rgba(255,230,50,.9)';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const r = i % 2 === 0 ? 9 : 3.5;
      i === 0 ? ctx.moveTo(s.x + r * Math.cos(a), s.y + r * Math.sin(a))
              : ctx.lineTo(s.x + r * Math.cos(a), s.y + r * Math.sin(a));
    }
    ctx.closePath(); ctx.fill();
  }

  // --- Slogan banner (yellow, over blue zone) ---
  ctx.fillStyle = '#ffe033';
  ctx.beginPath(); rrect(ctx, W * 0.04, H * 0.572, W * 0.92, H * 0.058, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0d3fa0';
  ctx.font = `800 ${W * 0.052}px 'Arial Black',sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('✦ FOLLOW YOUR NOSE ✦', W / 2, H * 0.601);

  // --- Cereal bowl illustration (simple) ---
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.71, W * 0.32, W * 0.10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.695, W * 0.28, W * 0.065, 0, 0, Math.PI); ctx.fill();
  // mini loops in bowl
  const bowlLoops = [
    { cx: W * 0.37, cy: H * 0.695, r: 8, c: '#e03030' },
    { cx: W * 0.50, cy: H * 0.688, r: 9, c: '#2ab52a' },
    { cx: W * 0.63, cy: H * 0.695, r: 8, c: '#f07010' },
    { cx: W * 0.44, cy: H * 0.708, r: 7, c: '#1860d8' },
    { cx: W * 0.57, cy: H * 0.706, r: 7, c: '#9030d8' },
  ];
  for (const l of bowlLoops) {
    ctx.beginPath(); ctx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
    ctx.strokeStyle = l.c; ctx.lineWidth = l.r * 0.42; ctx.stroke();
  }

  // --- Nutrition facts strip ---
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(0, H * 0.915, W, H * 0.085);
  ctx.fillStyle = '#fff';
  ctx.font = `${W * 0.036}px Arial,sans-serif`;
  ctx.fillText('NET WT 12 OZ (340g) · KELLOGG\'S CONCEPT', W / 2, H * 0.956);

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
  const W = 2048; const H = 1152; const [c, ctx] = mkCtx(W, H);

  // ── Warm cream wall ──────────────────────────────────────────────────────
  const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
  wallGrad.addColorStop(0, '#f8f0e4');
  wallGrad.addColorStop(0.55, '#f2e8d8');
  wallGrad.addColorStop(1, '#ddc8ae');
  ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, W, H);

  // Subtle wall texture (soft vertical stripes)
  ctx.save();
  for (let i = 0; i < 80; i++) {
    const x = (i / 80) * W;
    ctx.fillStyle = `rgba(${i % 2 ? 255 : 200},220,180,0.018)`;
    ctx.fillRect(x, 0, W / 80, H);
  }
  ctx.restore();

  // ── Ceiling ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ede4d5';
  ctx.fillRect(0, 0, W, H * 0.06);
  // cornice shadow
  const cornShadow = ctx.createLinearGradient(0, H * 0.06, 0, H * 0.10);
  cornShadow.addColorStop(0, 'rgba(0,0,0,.10)');
  cornShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cornShadow; ctx.fillRect(0, H * 0.06, W, H * 0.04);

  // ── Upper cabinets ───────────────────────────────────────────────────────
  const cabY = H * 0.065; const cabH = H * 0.305; const cabBottom = cabY + cabH;
  const cabColor = '#f5ede0';
  const cabBorder = '#d8c8b0';

  // Cabinet body shadow
  ctx.fillStyle = 'rgba(0,0,0,.06)';
  ctx.fillRect(W * 0.02, cabBottom, W * 0.96, H * 0.018);

  function drawCabDoor(dx, dy, dw, dh) {
    // Door body
    const doorGrad = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
    doorGrad.addColorStop(0, '#faf4eb');
    doorGrad.addColorStop(1, '#ede3d4');
    ctx.fillStyle = doorGrad;
    ctx.beginPath(); rrect(ctx, dx, dy, dw, dh, 6); ctx.closePath(); ctx.fill();
    // Border
    ctx.strokeStyle = cabBorder; ctx.lineWidth = 1.5;
    ctx.beginPath(); rrect(ctx, dx, dy, dw, dh, 6); ctx.stroke();
    // Inner inset panel
    ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 1;
    ctx.beginPath(); rrect(ctx, dx + 10, dy + 10, dw - 20, dh - 20, 4); ctx.stroke();
    // Bar handle
    const hx = dx + dw * 0.5 - 18; const hy = dy + dh - 22;
    ctx.fillStyle = '#c0a888'; ctx.beginPath();
    rrect(ctx, hx, hy, 36, 6, 3); ctx.fill();
    // handle highlight
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); rrect(ctx, hx + 2, hy + 1, 32, 2, 1); ctx.fill();
  }

  // Left cabinet block (3 doors)
  ctx.fillStyle = '#f0e6d8'; ctx.fillRect(0, cabY, W * 0.30, cabH);
  ctx.strokeStyle = cabBorder; ctx.lineWidth = 1;
  ctx.strokeRect(0, cabY, W * 0.30, cabH);
  drawCabDoor(W * 0.015, cabY + H * 0.018, W * 0.085, cabH - H * 0.036);
  drawCabDoor(W * 0.112, cabY + H * 0.018, W * 0.085, cabH - H * 0.036);
  drawCabDoor(W * 0.209, cabY + H * 0.018, W * 0.075, cabH - H * 0.036);

  // Right cabinet block (3 doors)
  ctx.fillStyle = '#f0e6d8'; ctx.fillRect(W * 0.70, cabY, W * 0.30, cabH);
  ctx.strokeStyle = cabBorder; ctx.lineWidth = 1;
  ctx.strokeRect(W * 0.70, cabY, W * 0.30, cabH);
  drawCabDoor(W * 0.712, cabY + H * 0.018, W * 0.075, cabH - H * 0.036);
  drawCabDoor(W * 0.799, cabY + H * 0.018, W * 0.085, cabH - H * 0.036);
  drawCabDoor(W * 0.896, cabY + H * 0.018, W * 0.088, cabH - H * 0.036);

  // Cabinet underside (thin dark strip)
  ctx.fillStyle = '#c4a880'; ctx.fillRect(0, cabBottom, W, H * 0.008);

  // Under-cabinet LED glow
  const ledGrad = ctx.createLinearGradient(0, cabBottom + H * 0.008, 0, cabBottom + H * 0.06);
  ledGrad.addColorStop(0, 'rgba(255,240,200,.22)');
  ledGrad.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = ledGrad; ctx.fillRect(0, cabBottom + H * 0.008, W, H * 0.06);

  // ── Window (centre) ─────────────────────────────────────────────────────
  const winX = W * 0.33; const winY = H * 0.07;
  const winW = W * 0.34; const winH = H * 0.30;
  // Window frame
  ctx.fillStyle = '#ffffff'; ctx.fillRect(winX - 12, winY - 8, winW + 24, winH + 16);
  // Sky gradient
  const sky = ctx.createLinearGradient(0, winY, 0, winY + winH);
  sky.addColorStop(0, '#c8e8fc');
  sky.addColorStop(0.6, '#e8f5ff');
  sky.addColorStop(1, '#f8fdff');
  ctx.fillStyle = sky; ctx.fillRect(winX, winY, winW, winH);
  // Outdoor foliage hint
  ctx.fillStyle = 'rgba(100,180,80,.22)';
  ctx.beginPath(); ctx.ellipse(winX + winW * 0.18, winY + winH * 0.85, winW * 0.18, winH * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(winX + winW * 0.78, winY + winH * 0.9, winW * 0.14, winH * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  // Light rays through glass
  ctx.save(); ctx.globalAlpha = 0.06;
  for (let i = 0; i < 3; i++) {
    const rx = winX + winW * (0.2 + i * 0.28);
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath(); ctx.moveTo(rx - 20, winY); ctx.lineTo(rx + 20, winY);
    ctx.lineTo(rx + 80, winY + winH); ctx.lineTo(rx - 80, winY + winH); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // Cross bars
  ctx.fillStyle = '#f8f8f8'; ctx.lineWidth = 0;
  ctx.fillRect(winX, winY + winH * 0.48, winW, 12); // horizontal
  ctx.fillRect(winX + winW * 0.488, winY, 12, winH); // vertical
  // Frame outer shadow
  ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.strokeStyle = '#e0d0bc'; ctx.lineWidth = 2;
  ctx.strokeRect(winX - 12, winY - 8, winW + 24, winH + 16);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // Windowsill
  const sillY = winY + winH + 8;
  const sillGrad = ctx.createLinearGradient(0, sillY, 0, sillY + H * 0.025);
  sillGrad.addColorStop(0, '#e8dcc8'); sillGrad.addColorStop(1, '#cec0a8');
  ctx.fillStyle = sillGrad; ctx.fillRect(winX - 20, sillY, winW + 40, H * 0.025);
  // Small potted plant on sill
  ctx.fillStyle = '#8b5e3c';
  ctx.beginPath(); rrect(ctx, winX + winW * 0.60, sillY - H * 0.04, W * 0.028, H * 0.04, 3); ctx.fill();
  ctx.fillStyle = '#3a8a28';
  ctx.beginPath(); ctx.ellipse(winX + winW * 0.614, sillY - H * 0.07, W * 0.018, H * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(winX + winW * 0.62, sillY - H * 0.09, W * 0.012, H * 0.03, 0.3, 0, Math.PI * 2); ctx.fill();

  // ── Subway tile backsplash ──────────────────────────────────────────────
  const tileZoneY = cabBottom + H * 0.008;
  const tileZoneH = H * 0.19;
  ctx.fillStyle = '#f9f3eb'; ctx.fillRect(0, tileZoneY, W, tileZoneH);
  const tW = 82; const tH = 38; const grout = 4;
  ctx.strokeStyle = '#ddd4c4'; ctx.lineWidth = grout;
  for (let row = 0; row * (tH + grout) < tileZoneH + tH; row++) {
    const offsetX = row % 2 === 0 ? 0 : tW / 2;
    for (let col = -1; col * (tW + grout) < W + tW; col++) {
      const tx = col * (tW + grout) + offsetX;
      const ty = tileZoneY + row * (tH + grout);
      // slight variation in tile shade
      const shade = 0.97 + (((row * 17 + col * 11) % 7) / 7) * 0.04;
      ctx.fillStyle = `rgb(${Math.round(249 * shade)},${Math.round(243 * shade)},${Math.round(235 * shade)})`;
      ctx.fillRect(tx + grout / 2, ty + grout / 2, tW, tH);
      ctx.strokeRect(tx + grout / 2, ty + grout / 2, tW, tH);
      // subtle glaze highlight on each tile
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(tx + grout / 2 + 4, ty + grout / 2 + 3, tW - 8, tH * 0.3);
    }
  }
  // Backsplash top highlight line
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, tileZoneY, W, 2);

  // ── Countertop ──────────────────────────────────────────────────────────
  const counterY = tileZoneY + tileZoneH;
  const counterH = H * 0.07;
  // Dark granite countertop
  const gGrad = ctx.createLinearGradient(0, counterY, 0, counterY + counterH);
  gGrad.addColorStop(0, '#4e3425');
  gGrad.addColorStop(0.25, '#5e4232');
  gGrad.addColorStop(0.7, '#4a3020');
  gGrad.addColorStop(1, '#3a2414');
  ctx.fillStyle = gGrad; ctx.fillRect(0, counterY, W, counterH);
  // Granite veins
  ctx.save();
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(200,170,130,${0.04 + Math.random() * 0.06})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, counterY);
    ctx.bezierCurveTo(Math.random() * W, counterY + counterH * 0.3,
      Math.random() * W, counterY + counterH * 0.7, Math.random() * W, counterY + counterH);
    ctx.stroke();
  }
  ctx.restore();
  // Counter top highlight
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(0, counterY, W, 3);
  // Counter edge / lip
  const edgeH = H * 0.012;
  const eGrad = ctx.createLinearGradient(0, counterY + counterH, 0, counterY + counterH + edgeH);
  eGrad.addColorStop(0, '#2e1d10'); eGrad.addColorStop(1, '#1a0e06');
  ctx.fillStyle = eGrad; ctx.fillRect(0, counterY + counterH, W, edgeH);

  // ── Lower cabinets / drawers ─────────────────────────────────────────────
  const lowerY = counterY + counterH + edgeH;
  ctx.fillStyle = '#e8ddd0'; ctx.fillRect(0, lowerY, W, H - lowerY);
  // Drawer fronts
  const drawerW = W * 0.14; const drawerGap = W * 0.016;
  const drawerH = H * 0.12; const drawerY = lowerY + H * 0.018;
  for (let i = 0; i < 6; i++) {
    const drx = drawerGap + i * (drawerW + drawerGap);
    const drGrad = ctx.createLinearGradient(drx, drawerY, drx + drawerW, drawerY + drawerH);
    drGrad.addColorStop(0, '#f2e8da'); drGrad.addColorStop(1, '#e2d4c2');
    ctx.fillStyle = drGrad;
    ctx.beginPath(); rrect(ctx, drx, drawerY, drawerW, drawerH, 5); ctx.fill();
    ctx.strokeStyle = '#cdc0ad'; ctx.lineWidth = 1;
    ctx.beginPath(); rrect(ctx, drx, drawerY, drawerW, drawerH, 5); ctx.stroke();
    // drawer handle
    const dhx = drx + drawerW * 0.35; const dhy = drawerY + drawerH * 0.82;
    ctx.fillStyle = '#b8a890';
    ctx.beginPath(); rrect(ctx, dhx, dhy, drawerW * 0.3, 5, 2); ctx.fill();
  }

  // ── Subtle ambient occlusion (darken sides & bottom) ────────────────────
  const aoL = ctx.createLinearGradient(0, 0, W * 0.12, 0);
  aoL.addColorStop(0, 'rgba(0,0,0,.10)'); aoL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aoL; ctx.fillRect(0, 0, W * 0.12, H);
  const aoR = ctx.createLinearGradient(W, 0, W * 0.88, 0);
  aoR.addColorStop(0, 'rgba(0,0,0,.10)'); aoR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aoR; ctx.fillRect(W * 0.88, 0, W * 0.12, H);

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
