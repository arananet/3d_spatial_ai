import { loadThreeJs } from './utils/three-loader.js';
import { bootScene } from './scene/index.js';
import { startTracking } from './tracking/index.js';
import {
  setStatus,
  showError,
  clearError,
  showLoadingCard,
  disableStartButton,
  enableStartButton,
  setLoadMessage,
  hideOverlay,
  getStartButton,
} from './ui/index.js';

const trackingState = { pose: null, tracking: false };

loadThreeJs()
  .then(() => {
    bootScene(() => trackingState);
  })
  .catch((err) => {
    console.error('Three.js load failed:', err);
    document.getElementById('c3d').style.background = '#1a0a00';
  });

getStartButton().addEventListener('click', () => {
  clearError();
  disableStartButton();
  showLoadingCard();
  startTrackingFlow();
});

async function startTrackingFlow() {
  try {
    await startTracking({
      onPose: (pose) => {
        trackingState.pose = pose;
        trackingState.tracking = true;
        setStatus('Tracking', 'on');
      },
      onTrackingLost: () => {
        trackingState.tracking = false;
        setStatus('Searching…', 'seek');
      },
      onLoadMessage: (msg) => setLoadMessage(msg),
      onReady: () => {
        hideOverlay();
        setStatus('Searching…', 'seek');
      },
    });
    enableStartButton();
  } catch (err) {
    const friendly = mapCameraError(err);
    showError(friendly);
  }
}

function mapCameraError(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Camera permission denied. Allow camera in browser settings, then reload.';
  }
  if (err?.name === 'NotFoundError') {
    return 'No camera found on this device.';
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'Camera not available. Use Chrome or Safari over HTTPS.';
  }
  return err?.message || 'Unknown error — try reloading.';
}
