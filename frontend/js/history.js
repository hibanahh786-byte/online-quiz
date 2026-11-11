/**
 * Online Quiz System - User Quiz History Logic
 */

let allHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  loadSidebarUser();
  await loadHistory();
  initSearch();
});

function loadSidebarUser() {
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('historyUserName');
    if (nameEl) nameEl.textContent = user.name;

    const avatarEl = document.getElementById('historyUserAvatar');
    if (avatarEl) {
      if (user.profileImage) {
        avatarEl.innerHTML = `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        avatarEl.textContent = user.name.charAt(0).toUpperCase();
      }
    }
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  try {
    const res = await apiFetch('/quiz/history');
    allHistory = res.data || [];

    document.getElementById('totalAttemptsBadge').textContent = allHistory.length;
    renderHistoryTable(allHistory);
  } catch (err) {
    console.error('History load error:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-danger">
          Failed to load history records. Please verify server connectivity.
        </td>
      </tr>
    `;
  }
}

function renderHistoryTable(list) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="bi bi-clock-history fs-1 text-light d-block mb-3"></i>
          <h5>No quiz attempts found</h5>
          <p class="small text-muted mb-3">You haven't completed any quizzes yet or no results match your filter.</p>
          <a href="/categories.html" class="btn btn-primary btn-sm">Explore Quiz Categories</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const catName = item.categoryId ? item.categoryId.categoryName : 'Quiz';
    const catDiff = item.categoryId ? item.categoryId.difficulty : 'medium';
    const shortId = item._id ? item._id.slice(-6).toUpperCase() : 'N/A';

    return `
      <tr>
        <td>
          <span class="badge bg-secondary font-monospace">#${shortId}</span>
        </td>
        <td>
          <div class="fw-bold text-white">${catName}</div>
          ${getDifficultyBadge(catDiff)}
        </td>
        <td class="text-muted small">${formatDate(item.createdAt)}</td>
        <td>
          <span class="fw-semibold text-white">${item.totalQuestions}</span>
          <span class="text-muted small">Q's</span>
        </td>
        <td>
          <span class="fw-bold text-white">${item.obtainedMarks}</span>
          <span class="text-muted small">/ ${item.totalMarks}</span>
        </td>
        <td>
          <span class="fw-bold" style="color: #ec4899;">${item.percentage}%</span>
        </td>
        <td>${getPerformanceBadge(item.percentage)}</td>
        <td class="text-end">
          <a href="/result.html?resultId=${item._id}" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-file-earmark-text"></i> View Details
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function initSearch() {
  const input = document.getElementById('historySearchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderHistoryTable(allHistory);
      return;
    }

    const filtered = allHistory.filter(h => {
      const cat = h.categoryId ? h.categoryId.categoryName.toLowerCase() : '';
      return cat.includes(term) || (h._id && h._id.toLowerCase().includes(term));
    });

    renderHistoryTable(filtered);
  });
}
