/* ── Quelion — main.js ── */

/* Mobile nav toggle */
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    mobileToggle.setAttribute('aria-expanded', isOpen);
  });
}

/* Close mobile nav on link click */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks?.classList.remove('open'));
});
