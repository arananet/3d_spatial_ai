const overlay = document.getElementById('overlay');
const permCard = document.getElementById('perm-card');
const loadCard = document.getElementById('load-card');
const btnStart = document.getElementById('btnStart');
const errEl = document.getElementById('err');
const loadMsgEl = document.getElementById('load-msg');
const statusDot = document.getElementById('dot');
const statusText = document.getElementById('stxt');

export function setStatus(text, cls = '') {
  statusText.textContent = text;
  statusDot.className = cls;
}

export function showLoadingCard() {
  permCard.classList.add('hidden');
  loadCard.classList.remove('hidden');
}

export function resetPermissionCard() {
  permCard.classList.remove('hidden');
  loadCard.classList.add('hidden');
}

export function disableStartButton() {
  btnStart.disabled = true;
}

export function enableStartButton() {
  btnStart.disabled = false;
}

export function clearError() {
  errEl.textContent = '';
  errEl.classList.add('hidden');
}

export function showError(message) {
  errEl.textContent = message;
  errEl.classList.remove('hidden');
  resetPermissionCard();
  enableStartButton();
}

export function setLoadMessage(message) {
  loadMsgEl.textContent = message;
}

export function hideOverlay() {
  overlay.classList.add('gone');
}

export function getStartButton() {
  return btnStart;
}
