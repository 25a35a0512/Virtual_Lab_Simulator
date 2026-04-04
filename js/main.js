/* ── main.js ─────────────────────────────────────────────────
   Shared UI: navbar rendering, active links, hamburger menu,
   page-specific init routing.
──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPageLogic();
});

// ── Determine current page ─────────────────────────────────
function currentPage() {
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path.endsWith('/') || path === '') return 'home';
  const name = path.split('/').pop().replace('.html','');
  return name;
}

// ── Navbar ─────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const root    = getRoot();
  const loggedIn = isLoggedIn();
  const page    = currentPage();

  const links = [
    { href: root + (page === 'home' ? '' : 'index.html'), label: 'Home',        key: 'home'        },
    { href: root + 'pages/experiments.html',               label: 'Experiments', key: 'experiments' },
    { href: root + 'pages/dashboard.html',                 label: 'Dashboard',   key: 'dashboard'   },
  ];

  const linkHTML = links.map(l =>
    `<li><a href="${l.href}" class="${page === l.key ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  const authHTML = loggedIn
    ? `<button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    : `<a href="${root}pages/login.html"  class="btn btn-outline btn-sm">Login</a>
       <a href="${root}pages/signup.html" class="btn btn-primary btn-sm">Sign Up</a>`;

  const mobileAuth = loggedIn
    ? `<button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    : `<a href="${root}pages/login.html"  class="btn btn-outline btn-sm">Login</a>
       <a href="${root}pages/signup.html" class="btn btn-primary btn-sm">Sign Up</a>`;

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="${root}index.html" class="nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
        </svg>
        VirtualLab
      </a>
      <ul class="nav-links">${linkHTML}</ul>
      <div class="nav-actions">${authHTML}</div>
      <button class="hamburger" id="ham-btn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-mobile" id="nav-mobile">
      ${links.map(l => `<a href="${l.href}" class="${page===l.key?'active':''}">${l.label}</a>`).join('')}
      <div class="mobile-actions">${mobileAuth}</div>
    </div>
  `;

  document.getElementById('ham-btn').addEventListener('click', () => {
    document.getElementById('nav-mobile').classList.toggle('open');
  });
}

// ── Page-specific initialisation routing ──────────────────
function initPageLogic() {
  const page = currentPage();

  switch (page) {
    case 'home':        initHome();       break;
    case 'experiments': initExpPage();    break;
    case 'dashboard':   initDashboard();  break;
    case 'login':       initLogin();      break;
    case 'signup':      initSignup();     break;
  }
}

// ── HOME ───────────────────────────────────────────────────
function initHome() {
  // Animate stat counters
  document.querySelectorAll('.counter').forEach(el => {
    const target = +el.dataset.target;
    let current  = 0;
    const step   = Math.ceil(target / 50);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ── EXPERIMENTS PAGE ───────────────────────────────────────
function initExpPage() {
  if (!requireAuth()) return;
}

// ── DASHBOARD ──────────────────────────────────────────────
function initDashboard() {
  if (!requireAuth()) return;

  const user = getSession();
  if (!user) return;

  // Populate profile
  setText('dash-name',   user.name);
  setText('dash-email',  user.email);
  setText('dash-joined', user.joinedAt || '—');
  setText('dash-completed', user.completed || 0);

  // Avatar initials
  const av = document.getElementById('dash-avatar');
  if (av) av.textContent = user.name.charAt(0).toUpperCase();

  // Welcome
  setText('welcome-name', user.name.split(' ')[0]);
}

// ── LOGIN ──────────────────────────────────────────────────
function initLogin() {
  redirectIfLoggedIn('../pages/dashboard.html');

  // Show reason message if redirected from guard
  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'auth') {
    const form = document.getElementById('login-form-wrap');
    if (form) showAlert(form, 'Please log in to access that page.', 'info');
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearFieldErrors(form);
    const email    = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const result   = login(email, password);

    if (result.ok) {
      showAlert(form.closest('.auth-card'), 'Login successful! Redirecting…', 'success');
      setTimeout(() => { window.location.href = '../pages/dashboard.html'; }, 900);
    } else {
      showAlert(form.closest('.auth-card'), result.msg, 'error');
    }
  });
}

// ── SIGNUP ─────────────────────────────────────────────────
function initSignup() {
  redirectIfLoggedIn('../pages/dashboard.html');

  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearFieldErrors(form);
    const name     = form.querySelector('#name').value;
    const email    = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const confirm  = form.querySelector('#confirm').value;

    if (password !== confirm) {
      showAlert(form.closest('.auth-card'), 'Passwords do not match.', 'error');
      markError(form.querySelector('#confirm'));
      return;
    }

    const result = signup(name, email, password);
    if (result.ok) {
      showAlert(form.closest('.auth-card'), 'Account created! Redirecting…', 'success');
      setTimeout(() => { window.location.href = '../pages/dashboard.html'; }, 900);
    } else {
      showAlert(form.closest('.auth-card'), result.msg, 'error');
    }
  });
}

// ── DOM Helpers ────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function clearFieldErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}
function markError(input) {
  if (input) input.classList.add('error');
}
function togglePassword(id) {
  const input = document.getElementById(id);
  const btn   = input.nextElementSibling;
  if (input.type === 'password') {
    input.type  = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type  = 'password';
    btn.textContent = 'Show';
  }
}
