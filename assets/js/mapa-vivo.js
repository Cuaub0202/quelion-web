/* Mapa vivo: proyección equirrectangular de las ciudades reales; rutas en línea fina; cargas como puntos.
   Espera window.MAPA_REGION, un <canvas id="mapa"> y, si existe, una ficha #ficha que aparece con el aviso. */
(() => {
  const REGION = window.MAPA_REGION, cv = document.getElementById('mapa');
  if (!REGION || !cv || !cv.getContext) return;
  const { lat0, C, R, rotulos, rotulosMovil, foco } = REGION;
  const ficha = document.getElementById('ficha'), cx = cv.getContext('2d');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, raf = 0, t0 = 0, P = {}, visible = true;
  const cargas = R.map((r, i) => ({ r: i, v: 0.035 + (i * 37 % 11) / 400, f: (i * 0.37) % 1, d: i % 2 ? 1 : -1 }));
  const iFoco = R.findIndex((r) => r[0] === foco[0] && r[1] === foco[1]);
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = Math.cos(lat0 * Math.PI / 180), xs = [], ys = [];
    for (const n in C) { xs.push(C[n][1] * k); ys.push(-C[n][0]); }
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const caja = W < 860 ? { x: W * 0.07, y: 96, w: W * 0.80, h: Math.min(H * 0.30, 220) } : { x: W * 0.42, y: H * 0.14, w: W * 0.49, h: H * 0.70 };
    const s = Math.min(caja.w / (x1 - x0), caja.h / (y1 - y0));
    const ox = caja.x + (caja.w - (x1 - x0) * s) / 2, oy = caja.y + (caja.h - (y1 - y0) * s) / 2;
    P = {}; for (const n in C) P[n] = [ox + (C[n][1] * k - x0) * s, oy + (-C[n][0] - y0) * s];
  }
  function pinta(ts) {
    if (!t0) t0 = ts; const t = (ts - t0) / 1000;
    cx.clearRect(0, 0, W, H);
    cx.lineWidth = 1; cx.strokeStyle = 'rgba(242,239,232,0.2)';
    for (const [a, b] of R) { cx.beginPath(); cx.moveTo(P[a][0], P[a][1]); cx.lineTo(P[b][0], P[b][1]); cx.stroke(); }
    cx.fillStyle = 'rgba(242,239,232,0.55)';
    for (const n in P) { cx.beginPath(); cx.arc(P[n][0], P[n][1], 1.6, 0, 6.3); cx.fill(); }
    cx.font = '12px Inter, sans-serif'; cx.fillStyle = 'rgba(184,179,168,0.75)';
    for (const n of (W < 860 ? rotulosMovil : rotulos)) { const w = cx.measureText(n).width; const izq = P[n][0] + 8 + w > W - 6; cx.fillText(n, izq ? P[n][0] - 8 - w : P[n][0] + 8, P[n][1] + 4); }
    cargas.forEach((c, i) => {
      const [a, b] = R[c.r];
      let f = (c.f + t * c.v) % 1; if (c.d < 0) f = 1 - f;
      if (i === iFoco) f = Math.min(0.62, 0.18 + t * 0.075);
      const x = P[a][0] + (P[b][0] - P[a][0]) * f, y = P[a][1] + (P[b][1] - P[a][1]) * f;
      if (i === iFoco) {
        if (t > 6) { const q = ((t - 6) % 2.4) / 2.4; cx.beginPath(); cx.arc(x, y, 5 + q * 22, 0, 6.3); cx.strokeStyle = 'rgba(242,239,232,' + (0.5 * (1 - q)) + ')'; cx.stroke(); }
        cx.beginPath(); cx.arc(x, y, 4, 0, 6.3); cx.fillStyle = '#F2EFE8'; cx.fill();
        if (ficha) ficha.classList.toggle('ver', t > 9);
      } else { cx.beginPath(); cx.arc(x, y, 2.2, 0, 6.3); cx.fillStyle = 'rgba(242,239,232,0.9)'; cx.fill(); }
    });
    if (!reducido && visible) raf = requestAnimationFrame(pinta);
  }
  function arrancar() { cancelAnimationFrame(raf); medir(); if (reducido) { t0 = -12000; pinta(0); } else raf = requestAnimationFrame(pinta); }
  addEventListener('resize', arrancar);
  if ('IntersectionObserver' in window) new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v && !visible) { visible = true; raf = requestAnimationFrame(pinta); } else if (!v) { visible = false; cancelAnimationFrame(raf); } }).observe(cv);
  arrancar();
})();
