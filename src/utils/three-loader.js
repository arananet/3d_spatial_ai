export function loadThreeJs() {
  const cdns = [
    '/three.min.js',
    'https://unpkg.com/three@0.162.0/build/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js',
  ];

  return new Promise((resolve, reject) => {
    let i = 0;
    const tryNext = () => {
      if (i >= cdns.length) {
        reject(new Error('Three.js failed to load from all CDNs'));
        return;
      }
      const script = document.createElement('script');
      script.src = cdns[i++];
      script.onload = () => resolve(window.THREE);
      script.onerror = tryNext;
      document.head.appendChild(script);
    };
    tryNext();
  });
}
