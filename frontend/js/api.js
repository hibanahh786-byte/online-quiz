/**
 * Online Quiz System - Central API Client & Utilities
 */

const API_BASE_URL = '/api';

const TOKEN_KEY = 'quiz_token';
const USER_KEY = 'quiz_user';

// Auth State Helpers
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

function logout() {
  clearAuth();
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 500);
}

// Ensure protected pages redirect unauthenticated users
function requireAuth(adminOnly = false) {
  if (!isAuthenticated()) {
    showToast('Please log in to continue.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, 400);
    return false;
  }

  if (adminOnly && !isAdmin()) {
    showToast('Access denied. Administrator privileges required.', 'error');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 500);
    return false;
  }

  return true;
}

// Redirect already logged-in users away from login/register
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    if (isAdmin()) {
      window.location.href = '/admin/dashboard.html';
    } else {
      window.location.href = '/dashboard.html';
    }
  }
}

// Central API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON
  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Check if token expired / unauthorized
    if (response.status === 401) {
      const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
      if (!isAuthPage) {
        clearAuth();
        showToast('Session expired. Please log in again.', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 800);
        return { success: false, message: 'Session expired' };
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// Toast Notification Manager
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-exclamation-triangle-fill text-danger',
    warning: 'bi-exclamation-circle-fill text-warning',
    info: 'bi-info-circle-fill text-primary'
  };

  const defaultTitles = {
    success: 'Success',
    error: 'Error',
    warning: 'Notice',
    info: 'Information'
  };

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info} fs-4"></i>
    <div class="flex-grow-1">
      <div class="fw-bold mb-1" style="font-size: 0.9rem;">${title || defaultTitles[type]}</div>
      <div style="font-size: 0.85rem; color: #475569;">${message}</div>
    </div>
    <button type="button" class="btn-close btn-sm" aria-label="Close" onclick="this.parentElement.remove()"></button>
  `;

  container.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Generic Confirmation Modal Dialog
function confirmDialog(title, message, confirmBtnText = 'Confirm', btnClass = 'btn-danger') {
  return new Promise((resolve) => {
    const modalId = 'dynamicConfirmModal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title fw-bold text-dark">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-4 text-muted">
              ${message}
            </div>
            <div class="modal-footer border-0 pt-0">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" id="confirmCancelBtn">Cancel</button>
              <button type="button" class="btn ${btnClass} btn-sm" id="confirmActionBtn">${confirmBtnText}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalEl);

    document.getElementById('confirmActionBtn').addEventListener('click', () => {
      modal.hide();
      resolve(true);
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      resolve(false);
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
      resolve(false);
    }, { once: true });

    modal.show();
  });
}

// Format Date string nicely
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format Duration in seconds to mm:ss
function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Get Badge for Difficulty
function getDifficultyBadge(diff) {
  const d = (diff || 'medium').toLowerCase();
  return `<span class="badge badge-${d}">${d.toUpperCase()}</span>`;
}

// Get Badge for Performance
function getPerformanceBadge(percentage) {
  if (percentage >= 85) {
    return '<span class="badge bg-success">EXCELLENT</span>';
  } else if (percentage >= 70) {
    return '<span class="badge bg-primary">VERY GOOD</span>';
  } else if (percentage >= 50) {
    return '<span class="badge bg-info text-dark">GOOD</span>';
  } else if (percentage >= 35) {
    return '<span class="badge bg-warning text-dark">AVERAGE</span>';
  }
  return '<span class="badge bg-danger">NEEDS IMPROVEMENT</span>';
}
