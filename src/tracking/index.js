import { smoothPose } from '../config/index.js';

export async function startTracking({ onPose, onTrackingLost, onLoadMessage, onReady }) {
  const vid = document.getElementById('vid');
  const fc = document.getElementById('fc');
  const facePreviewPanel = document.getElementById('face-preview');
  const fcx = fc.getContext('2d');
  let lostFrames = 0;
  let hasTracking = false;

  const guard = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  if (!guard) {
    throw Object.assign(new Error('no mediaDevices'), { name: 'NotSupportedError' });
  }

  onLoadMessage?.('Requesting camera…');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  vid.srcObject = stream;

  onLoadMessage?.('Starting camera…');
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Camera timed out')), 12000);
    const tryPlay = () => vid.play().then(() => { clearTimeout(timer); resolve(); }).catch(reject);
    if (vid.readyState >= 1) {
      tryPlay();
    } else {
      vid.onloadedmetadata = tryPlay;
      vid.onerror = () => { clearTimeout(timer); reject(new Error('Video error')); };
    }
  });

  onLoadMessage?.('Loading AI model…');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

  onLoadMessage?.('Initialising…');
  const faceMesh = new window.FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  faceMesh.onResults((res) => handleResults(res));

  fc.width = 220;
  fc.height = 140;
  facePreviewPanel?.classList.add('active');

  let busy = false;
  function loop() {
    requestAnimationFrame(loop);
    if (busy || vid.readyState < 2 || vid.paused) return;
    busy = true;
    faceMesh
      .send({ image: vid })
      .catch(() => {})
      .finally(() => {
        busy = false;
      });
  }
  loop();
  onReady?.();

  function handleResults(res) {
    renderPreview(res, fc, fcx);
    if (res.multiFaceLandmarks && res.multiFaceLandmarks.length > 0) {
      const pose = smoothPose(extractPose(res.multiFaceLandmarks[0]));
      hasTracking = true;
      lostFrames = 0;
      onPose?.(pose);
    } else {
      if (hasTracking && ++lostFrames > 6) {
        hasTracking = false;
        onTrackingLost?.();
      }
    }
  }
}

function extractPose(lm) {
  const li = lm[133];
  const ri = lm[362];
  const no = lm[1];
  const lo = lm[33];
  const ro = lm[263];
  const fx = (li.x + ri.x + no.x) / 3;
  const fy = (li.y + ri.y + no.y) / 3;
  const iod = Math.hypot(ri.x - li.x, ri.y - li.y);
  const ew = Math.hypot(ro.x - lo.x, ro.y - lo.y);
  const z = Math.max(0.5, Math.min(2.5, (iod + ew * 0.5) / 0.15));
  return { x: Math.max(0.1, Math.min(0.9, fx)), y: Math.max(0.1, Math.min(0.9, fy)), z };
}

function renderPreview(res, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#050712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  if (res?.image) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const landmarks = res.multiFaceLandmarks && res.multiFaceLandmarks[0];
  if (!landmarks) {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '10px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Center your face', canvas.width / 2, canvas.height / 2);
    return;
  }

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  const connectors = window.FACEMESH_TESSELATION;
  if (window.drawConnectors && connectors) {
    window.drawConnectors(ctx, landmarks, connectors, { color: '#5bffe1', lineWidth: 0.5 });
    window.drawLandmarks?.(ctx, landmarks, { color: '#ffffff', radius: 0.4 });
  } else {
    drawFallbackMesh(ctx, canvas, landmarks);
  }
  ctx.restore();
}

function drawFallbackMesh(ctx, canvas, landmarks) {
  ctx.strokeStyle = 'rgba(91,255,225,.5)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < landmarks.length; i++) {
    const prev = landmarks[i - 1];
    const curr = landmarks[i];
    ctx.beginPath();
    ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
    ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}
