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

/* Sidebar toggle (dashboard) */
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

/* Active sidebar item */
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

/* Dashboard Chart */
function initDashboardChart() {
  const canvas = document.getElementById('activityChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');

  const labels = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00',
                   '14:00','16:00','18:00','20:00','22:00','Now'];

  const data = [412, 389, 401, 445, 523, 687, 812, 934, 1102, 1247, 1389, 1601, 1847];

  const hairlineColor  = 'rgba(28,28,32,1)';
  const gridColor      = 'rgba(28,28,32,0.8)';
  const tickColor      = 'rgba(90,90,98,1)';
  const lineColor      = 'rgba(255,255,255,0.9)';
  const fillStart      = 'rgba(255,255,255,0.07)';
  const fillEnd        = 'rgba(255,255,255,0)';

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, fillStart);
  gradient.addColorStop(1, fillEnd);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: lineColor,
        borderWidth: 1,
        backgroundColor: gradient,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#000000',
        pointHoverBorderWidth: 1,
        tension: 0.35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0A0A0C',
          borderColor: hairlineColor,
          borderWidth: 1,
          titleColor: '#7A7A82',
          bodyColor: '#FFFFFF',
          titleFont: { family: "'JetBrains Mono', monospace", size: 10, weight: '500' },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 12, weight: '400' },
          padding: 12,
          cornerRadius: 0,
          displayColors: false,
          callbacks: {
            title: items => items[0].label,
            label: item => `${item.raw.toLocaleString()} ops`,
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          border: { color: hairlineColor, width: 0.5 },
          ticks: {
            color: tickColor,
            font: { family: "'JetBrains Mono', monospace", size: 9 },
            maxRotation: 0,
            maxTicksLimit: 7,
          }
        },
        y: {
          position: 'right',
          grid: { color: gridColor, drawBorder: false },
          border: { color: hairlineColor, width: 0.5 },
          ticks: {
            color: tickColor,
            font: { family: "'JetBrains Mono', monospace", size: 9 },
            callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v,
          }
        }
      }
    }
  });
}

/* Animated counter for metric values */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isFloat = String(target).includes('.');
    const duration = 1200;
    const start = performance.now();

    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = target * ease;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* Intersection observer for counter animation */
const counterSection = document.querySelector('.metrics');
if (counterSection) {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounters();
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(counterSection);
}

/* Init on DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  initDashboardChart();
});
