/**
 * Online Quiz System - User Dashboard Logic
 */

let performanceChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  loadUserProfile();
  loadDashboardData();
});

async function loadUserProfile() {
  const user = getUser();
  if (user) {
    const greetingEl = document.getElementById('welcomeUserGreeting');
    if (greetingEl) greetingEl.textContent = `Welcome Back, ${user.name}!`;

    const sideNameEl = document.getElementById('sidebarUserName');
    if (sideNameEl) sideNameEl.textContent = user.name;

    const sideAvatarEl = document.getElementById('sidebarUserAvatar');
    if (sideAvatarEl) {
      if (user.profileImage) {
        sideAvatarEl.innerHTML = `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        sideAvatarEl.textContent = user.name.charAt(0).toUpperCase();
      }
    }
  }
}

async function loadDashboardData() {
  try {
    // 1. Fetch Profile & Aggregated Stats
    const profileRes = await apiFetch('/profile');
    if (profileRes.success && profileRes.stats) {
      const s = profileRes.stats;
      document.getElementById('dashTotalQuizzes').textContent = s.totalQuizzes;
      document.getElementById('dashTotalQuestions').textContent = s.totalQuestionsAnswered;
      document.getElementById('dashAvgScore').textContent = `${s.avgScore}%`;
      document.getElementById('dashBestScore').textContent = `${s.bestScore}%`;
    }

    // 2. Fetch Quiz History for Table & Chart
    const historyRes = await apiFetch('/quiz/history');
    const history = historyRes.data || [];
    renderRecentHistory(history.slice(0, 5));
    renderPerformanceChart(history);

    // 3. Fetch Categories Preview
    const categoriesRes = await apiFetch('/categories');
    const categories = categoriesRes.data || [];
    renderCategoriesPreview(categories.slice(0, 4));

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showToast('Failed to load some dashboard metrics.', 'error');
  }
}

function renderRecentHistory(recentList) {
  const tbody = document.getElementById('dashRecentHistoryTbody');
  if (!tbody) return;

  if (recentList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block text-light mb-1"></i>
          You have not attempted any quizzes yet.
          <div class="mt-2">
            <a href="/categories.html" class="btn btn-primary btn-sm">Take Your First Quiz</a>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recentList.map(item => `
    <tr>
      <td>
        <div class="fw-bold text-white">${item.categoryId ? item.categoryId.categoryName : 'Quiz'}</div>
        <small class="text-muted">${item.totalQuestions} Questions</small>
      </td>
      <td class="text-muted small">${formatDate(item.createdAt)}</td>
      <td>
        <span class="fw-bold text-white">${item.obtainedMarks}</span>
        <span class="text-muted small">/ ${item.totalMarks}</span>
      </td>
      <td>
        <div class="fw-bold" style="color: #ec4899;">${item.percentage}%</div>
      </td>
      <td>${getPerformanceBadge(item.percentage)}</td>
      <td class="text-end">
        <a href="/result.html?resultId=${item._id}" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-eye"></i> Review
        </a>
      </td>
    </tr>
  `).join('');
}

function renderPerformanceChart(history) {
  const canvas = document.getElementById('userPerformanceChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }

  // Reverse so chronological order from left to right (last 8 attempts)
  const sorted = [...history].reverse().slice(-8);

  const labels = sorted.length > 0 
    ? sorted.map((h, i) => `${h.categoryId ? h.categoryId.categoryName : 'Quiz'} (${new Date(h.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })})`)
    : ['No Data'];

  const scores = sorted.length > 0
    ? sorted.map(h => h.percentage)
    : [0];

  performanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Score Percentage (%)',
        data: scores,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Score: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (v) => `${v}%`,
            color: '#9d9bc2'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.08)'
          }
        },
        x: {
          ticks: {
            color: '#9d9bc2'
          },
          grid: { display: false }
        }
      }
    }
  });
}

function renderCategoriesPreview(categories) {
  const container = document.getElementById('dashCategoriesRow');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-2">No active categories available.</div>`;
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="col-md-6 col-lg-3">
      <div class="card h-100 p-3 card-hover shadow-none" style="background: #252047; border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="stats-icon m-0" style="width: 38px; height: 38px; font-size: 1.15rem;">
            <i class="bi ${cat.icon || 'bi-journal-bookmark'}"></i>
          </div>
          ${getDifficultyBadge(cat.difficulty)}
        </div>
        <h6 class="fw-bold mb-1 text-white">${cat.categoryName}</h6>
        <p class="text-muted small mb-3 text-truncate" style="max-height: 40px;">${cat.description}</p>
        <div class="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
          <small style="color: #cbd5e1;">${cat.questionCount || 0} Questions</small>
          <a href="/quiz.html?categoryId=${cat._id}" class="btn btn-primary btn-sm px-3 py-1">
            Play <i class="bi bi-play-fill"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}
