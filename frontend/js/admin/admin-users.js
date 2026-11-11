/**
 * Online Quiz System - Admin User Management Logic
 */

let userDetailsModal = null;
let currentUsers = [];
let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth(true)) return;

  const modalEl = document.getElementById('userDetailsModal');
  if (modalEl) {
    userDetailsModal = new bootstrap.Modal(modalEl);
  }

  await loadUsers(1);
  initFilters();
});

async function loadUsers(page = 1) {
  const tbody = document.getElementById('adminUsersTbody');
  if (!tbody) return;

  currentPage = page;

  const search = document.getElementById('userSearchInput').value.trim();
  const role = document.getElementById('filterRoleSelect').value;
  const status = document.getElementById('filterStatusSelect').value;

  const params = new URLSearchParams({
    page,
    limit: 10
  });

  if (search) params.append('search', search);
  if (role && role !== 'all') params.append('role', role);
  if (status && status !== 'all') params.append('status', status);

  try {
    const res = await apiFetch(`/admin/users?${params.toString()}`);
    currentUsers = res.data || [];
    totalPages = res.totalPages || 1;

    document.getElementById('totalUsersBadge').textContent = `${res.total || 0} Registered Users`;
    document.getElementById('userPaginationInfo').textContent = `Showing ${(page - 1) * 10 + (currentUsers.length > 0 ? 1 : 0)} to ${(page - 1) * 10 + currentUsers.length} of ${res.total || 0}`;

    renderUsersTable(currentUsers);
    renderPagination();

  } catch (err) {
    console.error('Users load error:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-danger">Failed to load users.</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('adminUsersTbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="bi bi-people fs-1 text-light d-block mb-3"></i>
          <h5>No users match your criteria</h5>
        </td>
      </tr>
    `;
    return;
  }

  const currentAdmin = getUser();

  tbody.innerHTML = users.map(u => {
    const isSelf = currentAdmin && currentAdmin._id === u._id;
    const avatarHtml = u.profileImage
      ? `<img src="${u.profileImage}" alt="${u.name}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`
      : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px; font-size: 0.85rem;">${u.name.charAt(0).toUpperCase()}</div>`;

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${avatarHtml}
            <div>
              <div class="fw-bold text-white">${u.name} ${isSelf ? '<span class="badge bg-secondary ms-1">You</span>' : ''}</div>
            </div>
          </div>
        </td>
        <td class="text-muted small">${u.email}</td>
        <td class="text-muted small">${u.phone}</td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${u.role.toUpperCase()}</span>
        </td>
        <td class="text-center fw-bold" style="color: #ec4899;">${u.quizzesCount || 0}</td>
        <td>
          <div class="form-check form-switch m-0">
            <input class="form-check-input" type="checkbox" role="switch" ${u.isActive ? 'checked' : ''} ${isSelf ? 'disabled' : ''} onchange="toggleUserStatus('${u._id}', this.checked)">
          </div>
        </td>
        <td class="text-muted small">${new Date(u.createdAt).toLocaleDateString()}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="viewUserDetails('${u._id}')" title="View Profile & Quiz History">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-danger" ${isSelf ? 'disabled' : ''} onclick="deleteUser('${u._id}', '${u.name.replace(/'/g, "\\'")}')" title="Delete User">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  const ul = document.getElementById('userPaginationUl');
  if (!ul) return;

  if (totalPages <= 1) {
    ul.innerHTML = '';
    return;
  }

  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="loadUsers(${currentPage - 1})">Prev</button>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <button class="page-link" onclick="loadUsers(${i})">${i}</button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="loadUsers(${currentPage + 1})">Next</button>
    </li>
  `;

  ul.innerHTML = html;
}

function initFilters() {
  const search = document.getElementById('userSearchInput');
  const role = document.getElementById('filterRoleSelect');
  const status = document.getElementById('filterStatusSelect');

  let timeout = null;
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadUsers(1), 350);
    });
  }

  if (role) role.addEventListener('change', () => loadUsers(1));
  if (status) status.addEventListener('change', () => loadUsers(1));
}

async function toggleUserStatus(id, newStatus) {
  try {
    const res = await apiFetch(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: newStatus })
    });

    if (res.success) {
      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update user status.', 'error');
    await loadUsers(currentPage); // rollback
  }
}

async function deleteUser(id, name) {
  const confirmed = await confirmDialog(
    'Delete User Account',
    `Are you sure you want to permanently delete user <strong>${name}</strong> and all their quiz history? This action cannot be undone.`,
    'Delete User',
    'btn-danger'
  );
  if (!confirmed) return;

  try {
    const res = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('User and associated records deleted.', 'success');
      await loadUsers(currentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete user.', 'error');
  }
}

async function viewUserDetails(id) {
  const user = currentUsers.find(u => u._id === id);
  if (!user) return;

  document.getElementById('modalUserName').textContent = user.name;
  document.getElementById('modalUserEmail').textContent = user.email;
  document.getElementById('modalUserPhone').textContent = user.phone;
  document.getElementById('modalUserRole').textContent = user.role.toUpperCase();

  const avatarContainer = document.getElementById('modalUserAvatar');
  if (user.profileImage) {
    avatarContainer.innerHTML = `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  } else {
    avatarContainer.textContent = user.name.charAt(0).toUpperCase();
  }

  const tbody = document.getElementById('modalUserHistoryTbody');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Loading user attempts...</td></tr>`;

  if (userDetailsModal) userDetailsModal.show();

  try {
    const res = await apiFetch(`/admin/results?search=${encodeURIComponent(user.email)}`);
    const results = res.data || [];

    if (results.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No quizzes completed by this student yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = results.map(r => `
      <tr>
        <td class="fw-semibold">${r.categoryId ? r.categoryId.categoryName : 'Quiz'}</td>
        <td class="text-muted small">${new Date(r.createdAt).toLocaleDateString()}</td>
        <td>${r.obtainedMarks}/${r.totalMarks}</td>
        <td class="fw-bold text-primary">${r.percentage}%</td>
        <td>${getPerformanceBadge(r.percentage)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">Failed to load user quiz records.</td></tr>`;
  }
}
