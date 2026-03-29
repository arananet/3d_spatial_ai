function getLocalNumber(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const BASE_CFG = {
  screenW: getLocalNumber('dc_sw', 34),
  screenH: getLocalNumber('dc_sh', 19),
  viewDist: getLocalNumber('dc_vd', 60),
  ws: 0.01,
  moveScale: 5.5,
  smooth: 0.32,
  near: 0.005,
  far: 20,
};

export const CFG = Object.freeze(BASE_CFG);

export const HEAD_RESP = Object.freeze({
  deadX: 0.004,
  deadY: 0.006,
  curveX: 1.9,
  curveY: 2.1,
  max: 0.58,
});

const smoothedPose = { x: 0.5, y: 0.5, z: 1 };

export function smoothPose(nextPose) {
  const delta = Math.max(
    Math.abs(nextPose.x - smoothedPose.x),
    Math.abs(nextPose.y - smoothedPose.y)
  );
  const blend = Math.min(0.55, CFG.smooth + delta * 1.4);
  smoothedPose.x += blend * (nextPose.x - smoothedPose.x);
  smoothedPose.y += blend * (nextPose.y - smoothedPose.y);
  smoothedPose.z += blend * (nextPose.z - smoothedPose.z);
  return { ...smoothedPose };
}

export function amplifyAxis(raw, axis) {
  const cfgDead = axis === 'y' ? HEAD_RESP.deadY : HEAD_RESP.deadX;
  const cfgCurve = axis === 'y' ? HEAD_RESP.curveY : HEAD_RESP.curveX;
  const magnitude = Math.max(0, Math.abs(raw) - cfgDead);
  const curveBoost = magnitude * cfgCurve + Math.pow(magnitude, 2) * (axis === 'y' ? 2.1 : 1.6);
  const output = Math.sign(raw || 1) * Math.min(HEAD_RESP.max, curveBoost);
  return Number.isFinite(output) ? output : 0;
}
