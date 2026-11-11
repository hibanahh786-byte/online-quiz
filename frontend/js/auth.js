/**
 * Online Quiz System - Authentication Logic (Login & Register)
 */

document.addEventListener('DOMContentLoaded', () => {
  // If user is already logged in, redirect them
  redirectIfAuthenticated();

  initLoginForm();
  initRegisterForm();
  initPasswordToggle();
});

// Password visibility toggle
function initPasswordToggle() {
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('loginPassword');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    });
  }
}

// Login Handler
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');

    try {
      submitBtn.disabled = true;
      btnText.textContent = 'Verifying...';
      spinner.classList.remove('d-none');

      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);

        showToast(`Welcome back, ${res.user.name}!`, 'success');

        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');

        setTimeout(() => {
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else if (res.user.role === 'admin') {
            window.location.href = '/admin/dashboard.html';
          } else {
            window.location.href = '/dashboard.html';
          }
        }, 600);
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please verify credentials.', 'error');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Sign In';
      spinner.classList.add('d-none');
    }
  });
}

// Register Handler
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Client-side validations
    if (!name || !email || !phone || !password || !confirmPassword) {
      showToast('Please complete all required fields.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('registerSubmitBtn');
    const btnText = document.getElementById('regBtnText');
    const spinner = document.getElementById('regSpinner');

    try {
      submitBtn.disabled = true;
      btnText.textContent = 'Creating Account...';
      spinner.classList.remove('d-none');

      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, confirmPassword })
      });

      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);

        showToast('Registration successful! Directing to dashboard...', 'success');

        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 800);
      }
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Create Student Account';
      spinner.classList.add('d-none');
    }
  });
}
