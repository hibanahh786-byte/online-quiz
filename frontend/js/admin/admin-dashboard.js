/**
 * Online Quiz System - Admin Dashboard Overview Logic
 */

let userRegChart = null;
let categoryParticipationChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth(true)) return;

  const user = getUser();
  if (user) {
    document.getElementById('adminSidebarName').textContent = user.name;
  }

  await loadAdminDashboard();
});

async function loadAdminDashboard() {
  try {
    const res = await apiFetch('/admin/dashboard');
    if (!res.success) throw new Error(res.message);

    const s = res.stats || {};
    document.getElementById('admTotalUsers').textContent = s.totalUsers || 0;
    document.getElementById('admTotalCategories').textContent = s.totalCategories || 0;
    document.getElementById('admTotalQuestions').textContent = s.totalQuestions || 0;
    document.getElementById('admTotalAttempts').textContent = s.totalQuizzesAttempted || 0;
    document.getElementById('admAvgScore').textContent = `${s.averageScore || 0}%`;

    // Render Charts
    renderUserRegChart(res.charts ? res.charts.userRegistrations : []);
    renderCategoryChart(res.charts ? res.charts.quizParticipation : []);

    // Render Recent Tables
    renderRecentUsers(res.recentUsers || []);
    renderRecentResults(res.recentResults || []);

  } catch (err) {
    console.error('Admin dashboard error:', err);
    showToast('Failed to load administrative analytics.', 'error');
  }
}

function renderUserRegChart(data) {
  const canvas = document.getElementById('adminUserRegChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (userRegChart) userRegChart.destroy();

  const labels = data.length > 0 ? data.map(d => d._id) : ['Past Days'];
  const counts = data.length > 0 ? data.map(d => d.count) : [0];

  userRegChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'New Registrations',
        data: counts,
        backgroundColor: '#ec4899',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#9d9bc2' },
          grid: { color: 'rgba(255, 255, 255, 0.08)' }
        },
        x: {
          ticks: { color: '#9d9bc2' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderCategoryChart(data) {
  const canvas = document.getElementById('adminCategoryParticipationChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (categoryParticipationChart) categoryParticipationChart.destroy();

  const labels = data.length > 0 ? data.map(d => d.categoryName) : ['No attempts yet'];
  const counts = data.length > 0 ? data.map(d => d.attemptsCount) : [0];

  const colors = [
    '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
    '#ec4899', '#8b5cf6', '#64748b', '#ef4444'
  ];

  categoryParticipationChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: colors.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { size: 11 }, color: '#9d9bc2' }
        }
      }
    }
  });
}

function renderRecentUsers(users) {
  const tbody = document.getElementById('admRecentUsersTbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No registered users yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div class="fw-bold text-dark">${u.name}</div>
        <small class="text-muted">${u.phone}</small>
      </td>
      <td class="text-muted small">${u.email}</td>
      <td class="text-muted small">${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        <span class="badge ${u.isActive ? 'bg-success' : 'bg-danger'}">
          ${u.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderRecentResults(results) {
  const tbody = document.getElementById('admRecentResultsTbody');
  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No quiz submissions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = results.map(r => {
    const studentName = r.userId ? r.userId.name : 'Unknown';
    const catName = r.categoryId ? r.categoryId.categoryName : 'Quiz';

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${studentName}</div>
          <small class="text-muted">${formatDate(r.createdAt)}</small>
        </td>
        <td>
          <span class="badge bg-light text-dark border">${catName}</span>
        </td>
        <td>
          <div class="fw-bold text-primary">${r.percentage}%</div>
          <small class="text-muted">${r.obtainedMarks}/${r.totalMarks} pts</small>
        </td>
        <td>${getPerformanceBadge(r.percentage)}</td>
      </tr>
    `;
  }).join('');
}
