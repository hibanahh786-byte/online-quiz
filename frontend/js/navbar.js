/**
 * Online Quiz System - Navigation & Dynamic Header
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

function renderNavbar() {
  const navContainer = document.getElementById('main-navbar-container');
  if (!navContainer) return;

  const user = getUser();
  const loggedIn = isAuthenticated() && user;
  const currentPath = window.location.pathname;

  let authNavHtml = '';

  if (loggedIn) {
    const avatarHtml = user.profileImage
      ? `<img src="${user.profileImage}" alt="${user.name}" class="user-avatar">`
      : `<div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>`;

    authNavHtml = `
      <div class="dropdown ms-lg-3">
        <div class="user-pill dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button">
          ${avatarHtml}
          <div class="d-flex flex-column text-start">
            <span class="fw-bold" style="font-size: 0.85rem; color: #1e293b; line-height: 1.2;">${user.name}</span>
            <span class="text-muted" style="font-size: 0.75rem; text-transform: capitalize;">${user.role}</span>
          </div>
        </div>
        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 py-2 mt-2" style="border-radius: 12px; min-width: 200px;">
          <li class="px-3 py-2 border-bottom mb-1">
            <div class="fw-bold text-dark small">${user.name}</div>
            <div class="text-muted small text-truncate">${user.email}</div>
          </li>
          <li>
            <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="/dashboard.html">
              <i class="bi bi-speedometer2 text-primary"></i> Dashboard
            </a>
          </li>
          <li>
            <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="/profile.html">
              <i class="bi bi-person-gear text-secondary"></i> My Profile
            </a>
          </li>
          <li>
            <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="/history.html">
              <i class="bi bi-clock-history text-info"></i> Quiz History
            </a>
          </li>
          ${
            user.role === 'admin'
              ? `<li>
                  <a class="dropdown-item py-2 d-flex align-items-center gap-2" href="/admin/dashboard.html">
                    <i class="bi bi-shield-lock text-warning"></i> Admin Panel
                  </a>
                </li>`
              : ''
          }
          <li><hr class="dropdown-divider my-1"></li>
          <li>
            <a class="dropdown-item py-2 text-danger d-flex align-items-center gap-2" href="javascript:void(0)" onclick="logout()">
              <i class="bi bi-box-arrow-right"></i> Sign Out
            </a>
          </li>
        </ul>
      </div>
    `;
  } else {
    authNavHtml = `
      <div class="d-flex align-items-center gap-2 ms-lg-3">
        <a href="/login.html" class="btn btn-outline-primary btn-sm">Sign In</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Get Started</a>
      </div>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg app-navbar">
      <div class="container">
        <a class="navbar-brand" href="/index.html">
          <div class="brand-icon">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <span>Online Quiz System</span>
        </a>
        <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#appNavCollapse">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="appNavCollapse">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            <li class="nav-item">
              <a class="nav-link ${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}" href="/index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('categories.html') ? 'active' : ''}" href="/categories.html">Categories</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('leaderboard.html') ? 'active' : ''}" href="/leaderboard.html">Leaderboard</a>
            </li>
            ${
              loggedIn
                ? `
                <li class="nav-item">
                  <a class="nav-link ${currentPath.includes('dashboard.html') ? 'active' : ''}" href="/dashboard.html">Dashboard</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link ${currentPath.includes('history.html') ? 'active' : ''}" href="/history.html">History</a>
                </li>
              `
                : `
                <li class="nav-item">
                  <a class="nav-link" href="/index.html#about">About</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="/index.html#how-it-works">How It Works</a>
                </li>
              `
            }
          </ul>
          ${authNavHtml}
        </div>
      </div>
    </nav>
  `;
}
