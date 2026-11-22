/* ── Quelion — main.js ── */

/* Menú móvil: abre y cierra con el botón; se cierra al tocar un enlace, al tocar fuera, con Escape o al ensanchar la ventana. */
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (mobileToggle && navLinks) {
  const nav = mobileToggle.closest('.nav') || navLinks.parentElement;
  const etiquetaAbrir = mobileToggle.getAttribute('aria-label') || '';
  const etiquetaCerrar = (document.documentElement.lang || '').toLowerCase().startsWith('en') ? 'Close menu' : 'Cerrar menú';
  const abierto = () => navLinks.classList.contains('open');
  const abrir = (v) => {
    navLinks.classList.toggle('open', v);
    mobileToggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    mobileToggle.setAttribute('aria-label', v ? etiquetaCerrar : etiquetaAbrir);
  };
  mobileToggle.addEventListener('click', () => abrir(!abierto()));
  nav.addEventListener('click', (e) => { if (abierto() && e.target.closest('a')) abrir(false); });
  document.addEventListener('click', (e) => { if (abierto() && !nav.contains(e.target)) abrir(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && abierto()) { abrir(false); mobileToggle.focus(); } });
  const ancho = matchMedia('(min-width: 1101px)');
  if (ancho.addEventListener) ancho.addEventListener('change', (e) => { if (e.matches) abrir(false); });
}
