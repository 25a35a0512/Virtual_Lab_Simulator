

const AUTH_KEY   = 'vlab_users';
const SESSION_KEY = 'vlab_session';

function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}
function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function isLoggedIn() {
  return getSession() !== null;
}

function signup(name, email, password) {
  name    = name.trim();
  email   = email.trim().toLowerCase();
  password = password.trim();

  // Validate
  if (!name || !email || !password) {
    return { ok: false, msg: 'All fields are required.' };
  }
  if (!isValidEmail(email)) {
    return { ok: false, msg: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, msg: 'Password must be at least 6 characters.' };
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { ok: false, msg: 'An account with this email already exists.' };
  }

  const user = {
    id:        Date.now().toString(),
    name,
    email,
    password,           
    joinedAt:  new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
    completed: 0,
  };
  users.push(user);
  saveUsers(users);
  saveSession(user);
  return { ok: true, user };
}

function login(email, password) {
  email    = email.trim().toLowerCase();
  password = password.trim();

  if (!email || !password) {
    return { ok: false, msg: 'Email and password are required.' };
  }

  const users = getUsers();
  const user  = users.find(u => u.email === email);
  if (!user) {
    return { ok: false, msg: 'No account found with that email address.' };
  }
  if (user.password !== password) {
    return { ok: false, msg: 'Incorrect password. Please try again.' };
  }

  saveSession(user);
  return { ok: true, user };
}

function logout() {
  clearSession();
  window.location.href = getRoot() + 'pages/login.html';
}

function markExperimentDone() {
  const session = getSession();
  if (!session) return;
  const users = getUsers();
  const idx   = users.findIndex(u => u.id === session.id);
  if (idx === -1) return;
  users[idx].completed = (users[idx].completed || 0) + 1;
  saveUsers(users);
  session.completed = users[idx].completed;
  saveSession(session);
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = getRoot() + 'pages/login.html?reason=auth';
    return false;
  }
  return true;
}
function redirectIfLoggedIn(dest) {
  if (isLoggedIn()) {
    window.location.href = dest || (getRoot() + 'pages/dashboard.html');
    return true;
  }
  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function getRoot() {
  const path = window.location.pathname;
  return path.includes('/pages/') ? '../' : './';
}
function showAlert(container, msg, type = 'error') {
  const icons = { error: '✕', success: '✓', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.insertBefore(el, container.firstChild);
  setTimeout(() => el.remove(), 4500);
}
