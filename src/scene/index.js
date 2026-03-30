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
  scene.fog = new THREE.Fog(0x0a0604, 1.5, 5.0);
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
  renderer.toneMappingExposure = 1.35;
  renderer.physicallyCorrectLights = true;

  // Chocolate table lighting — dramatic studio product-photography feel
  scene.add(new THREE.HemisphereLight(0x1a0c05, 0x040201, 0.12));

  // Key light — warm amber from upper-right (like a ring/beauty dish)
  const keyLight = new THREE.SpotLight(0xff9535, 3.2, 4.5, Math.PI / 5, 0.28, 1.1);
  keyLight.position.set(0.75, 1.5, 0.9);
  keyLight.target.position.set(0, -0.08, 0);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 4;
  keyLight.shadow.camera.left = -1;
  keyLight.shadow.camera.right = 1;
  keyLight.shadow.camera.top = 1;
  keyLight.shadow.camera.bottom = -1;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Rim light — warm orange from behind-left (separation/edge glow)
  const rimLight = new THREE.SpotLight(0xff5a10, 1.6, 4, Math.PI / 4, 0.5, 1.4);
  rimLight.position.set(-1.0, 0.9, -0.6);
  rimLight.target.position.set(0, -0.08, 0);
  scene.add(rimLight);
  scene.add(rimLight.target);

  // Warm fill — soft bounce light from front-left
  const fillGlow = new THREE.PointLight(0xff7822, 0.45, 2.2);
  fillGlow.position.set(-0.4, 0.35, 0.7);
  scene.add(fillGlow);

  const chocoBg = makeChocolateBackdropTex();
  scene.background = chocoBg;
  const chocoBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(8.0, 5.0),
    new THREE.MeshStandardMaterial({ map: chocoBg, roughness: 0.98, metalness: 0.0, emissive: 0x0a0402, emissiveIntensity: 0.15 })
  );
  chocoBackdrop.position.set(0, 0.30, -1.8);
  scene.add(chocoBackdrop);

  const counterTop = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x1a0d08, roughness: 0.08, metalness: 0.45, envMapIntensity: 1.2 })
  );
  counterTop.rotation.x = -Math.PI / 2;
  counterTop.position.set(0, -0.11, 0.18);
  counterTop.receiveShadow = true;
  scene.add(counterTop);

  const counterBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.26, 1.05),
    new THREE.MeshLambertMaterial({ color: 0x0d0806 })
  );
  counterBody.position.set(0, -0.25, 0.15);
  scene.add(counterBody);

  const underGlow = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.01, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xff6e10 })
  );
  underGlow.position.set(0, 0.34, -0.2);
  scene.add(underGlow);

  // Cereal box proportions that fit the off-axis frustum (SH=0.19m = full portrait height)
  // BH=0.16 ≈ 84% of SH → fills screen nicely without overflowing
  const BW = 0.13; const BH = 0.16; const BD = 0.040;
  const heroBox = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#1255b8', '#0a3a8a'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeSideTex('DEPTHCRUNCH', '#1255b8', '#0a3a8a'), roughness: 0.5, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeTopTex(), roughness: 0.4, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ map: makeBotTex(), roughness: 0.55, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: makeFrontTex(), roughness: 0.32, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: makeBackTex(), roughness: 0.35, metalness: 0.08 }),
  ]);
  heroBox.position.set(0, -0.11 + BH / 2, -0.02);
  heroBox.castShadow = true;
  heroBox.receiveShadow = true;
  scene.add(heroBox);

  // Variant boxes: smaller + further behind so they don't bleed off-screen on mobile
  const variantBoxes = [
    {
      title: 'SKYLINE LOOPS',
      flavor: 'Tropical Citrus',
      tagline: 'Kellogg Studio holographic loops built for spatial packaging pilots.',
      brand: 'Kellogg Studio',
      gradient: ['#ff7a36', '#ffbe5c'],
      short: 'SKYLINE',
      width: 0.10,
      height: 0.13,
      depth: 0.032,
      topColor: 0xfff0d0,
      bottomColor: 0xcc5a29,
      position: { x: -0.20, y: -0.11 + 0.065, z: 0.06 },
      rotationY: 0.22,
    },
    {
      title: 'GENERAL GRAINS',
      flavor: 'Maple Crunch',
      tagline: 'General Grains reference build for Spec Kit calibration flows.',
      brand: 'General Grains R&D',
      gradient: ['#9227ff', '#f94892'],
      short: 'GEN GRAINS',
      width: 0.09,
      height: 0.11,
      depth: 0.028,
      topColor: 0xfdf0ff,
      bottomColor: 0x7a2078,
      position: { x: -0.12, y: -0.11 + 0.055, z: 0.10 },
      rotationY: 0.06,
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
  bowl.position.set(0.22, -0.075, 0.12);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  const milk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.03, 0.008, 20),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  );
  milk.position.set(0.22, -0.070, 0.12);
  milk.receiveShadow = true;
  scene.add(milk);

  const spoon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.09, 8),
    new THREE.MeshLambertMaterial({ color: 0xd0d0d0 })
  );
  spoon.position.set(0.28, -0.105, 0.17);
  spoon.rotation.z = 0.45;
  spoon.rotation.x = 0.1;
  spoon.castShadow = true;
  scene.add(spoon);

  const placemat = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 40),
    new THREE.MeshStandardMaterial({ color: 0x2a1508, roughness: 0.88 })
  );
  placemat.rotation.x = -Math.PI / 2;
  placemat.position.set(0.22, -0.108, 0.12);
  placemat.receiveShadow = true;
  scene.add(placemat);

  const fruitBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.025, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a1008, metalness: 0.75, roughness: 0.18 })
  );
  fruitBowl.position.set(-0.22, -0.094, 0.10);
  fruitBowl.castShadow = true;
  fruitBowl.receiveShadow = true;
  scene.add(fruitBowl);
  addFruit(fruitBowl);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.07, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a0e08, metalness: 0.05, roughness: 0.72 })
  );
  mug.position.set(-0.24, -0.075, -0.02);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.004, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a0e08, metalness: 0.05, roughness: 0.72 })
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
    const idleRadius = CFG.viewDist * CFG.ws;      // same z as tracking mode
    camera.position.set(Math.sin(autoAngle) * 0.04, 0.02, idleRadius);
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

function makeChocolateBackdropTex() {
  const W = 2048; const H = 1152; const [c, ctx] = mkCtx(W, H);

  // ── Deep dark chocolate base ─────────────────────────────────────────────
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.38, H * 0.05, W * 0.5, H * 0.42, W * 0.88);
  bgGrad.addColorStop(0, '#2e1508');
  bgGrad.addColorStop(0.38, '#180a04');
  bgGrad.addColorStop(0.75, '#0e0603');
  bgGrad.addColorStop(1, '#060302');
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

  // ── Warm amber key-light bloom — upper-right (primary light source) ──────
  const bloom1 = ctx.createRadialGradient(W * 0.74, H * 0.18, 0, W * 0.74, H * 0.20, W * 0.46);
  bloom1.addColorStop(0,   'rgba(255,165,45,0.22)');
  bloom1.addColorStop(0.35,'rgba(255,105,15,0.10)');
  bloom1.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = bloom1; ctx.fillRect(0, 0, W, H);

  // ── Secondary warm fill — left side ──────────────────────────────────────
  const bloom2 = ctx.createRadialGradient(W * 0.16, H * 0.32, 0, W * 0.16, H * 0.32, W * 0.36);
  bloom2.addColorStop(0,   'rgba(200,85,15,0.13)');
  bloom2.addColorStop(0.5, 'rgba(160,55,8,0.05)');
  bloom2.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = bloom2; ctx.fillRect(0, 0, W, H);

  // ── Horizontal warm band — studio product backlight strip ─────────────────
  const band = ctx.createLinearGradient(0, H * 0.24, 0, H * 0.58);
  band.addColorStop(0,    'rgba(0,0,0,0)');
  band.addColorStop(0.30, 'rgba(130,50,8,0.14)');
  band.addColorStop(0.55, 'rgba(90,28,4,0.09)');
  band.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, H * 0.24, W, H * 0.34);

  // ── Soft bokeh orbs — out-of-focus warm lights ────────────────────────────
  const bokehOrbs = [
    { x: W * 0.10, y: H * 0.14, r: W * 0.12, a: 0.09, col: '255,160,40' },
    { x: W * 0.82, y: H * 0.10, r: W * 0.16, a: 0.10, col: '255,135,20' },
    { x: W * 0.94, y: H * 0.50, r: W * 0.10, a: 0.07, col: '230,95,12' },
    { x: W * 0.04, y: H * 0.58, r: W * 0.09, a: 0.06, col: '190,75,10' },
    { x: W * 0.56, y: H * 0.06, r: W * 0.08, a: 0.07, col: '255,175,55' },
    { x: W * 0.38, y: H * 0.12, r: W * 0.07, a: 0.05, col: '210,110,28' },
    { x: W * 0.66, y: H * 0.70, r: W * 0.06, a: 0.04, col: '160,60,8'   },
    { x: W * 0.26, y: H * 0.72, r: W * 0.08, a: 0.05, col: '200,85,15'  },
  ];
  for (const orb of bokehOrbs) {
    const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
    g.addColorStop(0,   `rgba(${orb.col},${orb.a})`);
    g.addColorStop(0.55,`rgba(${orb.col},${orb.a * 0.35})`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ── Fine film-grain / noise ───────────────────────────────────────────────
  ctx.save();
  for (let i = 0; i < 7000; i++) {
    const gx = Math.random() * W;
    const gy = Math.random() * H;
    ctx.fillStyle = `rgba(255,190,100,${Math.random() * 0.022})`;
    ctx.fillRect(gx, gy, 1, 1);
  }
  ctx.restore();

  // ── Vignette — deep dark edges and corners ───────────────────────────────
  const vigL = ctx.createLinearGradient(0, 0, W * 0.22, 0);
  vigL.addColorStop(0, 'rgba(0,0,0,0.68)'); vigL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vigL; ctx.fillRect(0, 0, W * 0.22, H);

  const vigR = ctx.createLinearGradient(W, 0, W * 0.78, 0);
  vigR.addColorStop(0, 'rgba(0,0,0,0.68)'); vigR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vigR; ctx.fillRect(W * 0.78, 0, W * 0.22, H);

  const vigT = ctx.createLinearGradient(0, 0, 0, H * 0.22);
  vigT.addColorStop(0, 'rgba(0,0,0,0.55)'); vigT.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vigT; ctx.fillRect(0, 0, W, H * 0.22);

  const vigB = ctx.createLinearGradient(0, H, 0, H * 0.72);
  vigB.addColorStop(0, 'rgba(0,0,0,0.62)'); vigB.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vigB; ctx.fillRect(0, H * 0.72, W, H * 0.28);

  // ── Subtle centre brightness lift (keeps boxes readable) ─────────────────
  const centreLift = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, W * 0.32);
  centreLift.addColorStop(0, 'rgba(80,30,8,0.10)');
  centreLift.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centreLift; ctx.fillRect(0, 0, W, H);

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
