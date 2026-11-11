/**
 * Online Quiz System - Admin Results Management Logic
 */

let currentPage = 1;
let totalPages = 1;
let resultDetailModal = null;
let currentResults = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth(true)) return;

  const modalEl = document.getElementById('resultDetailModal');
  if (modalEl) {
    resultDetailModal = new bootstrap.Modal(modalEl);
  }

  await loadCategories();
  await loadResults(1);
  initFilters();
  initExportBtn();
});

async function loadCategories() {
  try {
    const res = await apiFetch('/categories?includeInactive=true');
    const categories = res.data || [];
    const select = document.getElementById('filterResultCategorySelect');
    if (select) {
      select.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `<option value="${c._id}">${c.categoryName}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load categories for filter:', err);
  }
}

async function loadResults(page = 1) {
  const tbody = document.getElementById('adminResultsTbody');
  if (!tbody) return;

  currentPage = page;

  const search = document.getElementById('resultSearchInput').value.trim();
  const categoryId = document.getElementById('filterResultCategorySelect').value;
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  const params = new URLSearchParams({
    page,
    limit: 10
  });

  if (search) params.append('search', search);
  if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  try {
    const res = await apiFetch(`/admin/results?${params.toString()}`);
    currentResults = res.data || [];
    totalPages = res.totalPages || 1;

    document.getElementById('totalResultsBadge').textContent = `${res.total || 0} Total Submissions`;
    document.getElementById('resultPaginationInfo').textContent = `Showing ${(page - 1) * 10 + (currentResults.length > 0 ? 1 : 0)} to ${(page - 1) * 10 + currentResults.length} of ${res.total || 0}`;

    renderResultsTable(currentResults);
    renderPagination();

  } catch (err) {
    console.error('Failed to load results:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-danger">Failed to load submissions.</td></tr>`;
  }
}

function renderResultsTable(results) {
  const tbody = document.getElementById('adminResultsTbody');
  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 text-light d-block mb-3"></i>
          <h5>No quiz submissions found</h5>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = results.map(r => {
    const userName = r.userId ? r.userId.name : 'Unknown';
    const userEmail = r.userId ? r.userId.email : 'N/A';
    const catName = r.categoryId ? r.categoryId.categoryName : 'Quiz';

    return `
      <tr>
        <td>
          <div class="fw-bold text-white">${userName}</div>
          <small class="text-muted">${userEmail}</small>
        </td>
        <td>
          <span class="badge bg-secondary">${catName}</span>
        </td>
        <td class="text-muted small">${formatDate(r.createdAt)}</td>
        <td class="text-center">
          <span class="text-success fw-bold">${r.correctAnswers}</span> /
          <span class="text-danger fw-bold">${r.wrongAnswers}</span> /
          <span class="text-muted fw-bold">${r.unanswered}</span>
        </td>
        <td class="text-center">
          <span class="fw-bold text-white">${r.obtainedMarks}</span>
          <span class="text-muted small">/ ${r.totalMarks}</span>
        </td>
        <td class="text-center">
          <span class="fw-bold" style="color: #ec4899;">${r.percentage}%</span>
        </td>
        <td>${getPerformanceBadge(r.percentage)}</td>
        <td class="text-end">
          <button class="btn btn-outline-primary btn-sm" onclick="openResultDetail('${r._id}')">
            <i class="bi bi-eye"></i> Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  const ul = document.getElementById('resultPaginationUl');
  if (!ul) return;

  if (totalPages <= 1) {
    ul.innerHTML = '';
    return;
  }

  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="loadResults(${currentPage - 1})">Prev</button>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <button class="page-link" onclick="loadResults(${i})">${i}</button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="loadResults(${currentPage + 1})">Next</button>
    </li>
  `;

  ul.innerHTML = html;
}

function initFilters() {
  const searchInput = document.getElementById('resultSearchInput');
  const catSelect = document.getElementById('filterResultCategorySelect');
  const startInput = document.getElementById('filterStartDate');
  const endInput = document.getElementById('filterEndDate');
  const clearBtn = document.getElementById('clearDateBtn');

  let timeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadResults(1), 350);
    });
  }

  if (catSelect) catSelect.addEventListener('change', () => loadResults(1));
  if (startInput) startInput.addEventListener('change', () => loadResults(1));
  if (endInput) endInput.addEventListener('change', () => loadResults(1));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (startInput) startInput.value = '';
      if (endInput) endInput.value = '';
      loadResults(1);
    });
  }
}

function openResultDetail(id) {
  const r = currentResults.find(item => item._id === id);
  if (!r) return;

  const userName = r.userId ? r.userId.name : 'Unknown';
  const catName = r.categoryId ? r.categoryId.categoryName : 'Quiz';

  document.getElementById('detailModalTitle').textContent = `${userName} - ${catName} Submission`;

  document.getElementById('detailScoreBanner').innerHTML = `
    <div class="row text-center g-2">
      <div class="col-3 border-end">
        <div class="text-muted small">Score Percentage</div>
        <div class="fw-bold fs-5 text-primary">${r.percentage}%</div>
      </div>
      <div class="col-3 border-end">
        <div class="text-muted small">Marks Scored</div>
        <div class="fw-bold fs-5 text-dark">${r.obtainedMarks} / ${r.totalMarks}</div>
      </div>
      <div class="col-3 border-end">
        <div class="text-muted small">Breakdown</div>
        <div class="small mt-1">
          <span class="text-success fw-bold">${r.correctAnswers}C</span> • 
          <span class="text-danger fw-bold">${r.wrongAnswers}W</span> • 
          <span class="text-muted fw-bold">${r.unanswered}U</span>
        </div>
      </div>
      <div class="col-3">
        <div class="text-muted small">Time Taken</div>
        <div class="fw-bold fs-5 text-info">${formatDuration(r.timeTaken)}</div>
      </div>
    </div>
  `;

  const container = document.getElementById('detailAnswersContainer');
  if (!r.answers || r.answers.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-3">No question breakdown stored for this attempt.</p>`;
  } else {
    container.innerHTML = r.answers.map((ans, idx) => {
      let badge = '';
      if (!ans.selectedOption) {
        badge = '<span class="badge bg-secondary">Unanswered</span>';
      } else if (ans.isCorrect) {
        badge = '<span class="badge bg-success">Correct (+1)</span>';
      } else {
        badge = '<span class="badge bg-danger">Incorrect</span>';
      }

      return `
        <div class="p-3 bg-white border rounded-3 small">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-bold">Q${idx + 1}. ${ans.questionText}</span>
            ${badge}
          </div>
          <div class="text-muted">
            Selected: <span class="fw-bold ${ans.isCorrect ? 'text-success' : 'text-danger'}">${ans.selectedOption || 'None'}</span> | 
            Correct: <span class="fw-bold text-success">${ans.correctAnswer}</span>
          </div>
          ${ans.explanation ? `<div class="mt-1 text-info-emphasis small"><i class="bi bi-info-circle me-1"></i>${ans.explanation}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  if (resultDetailModal) resultDetailModal.show();
}

function initExportBtn() {
  const exportBtn = document.getElementById('exportCsvBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', async () => {
    try {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Exporting...';

      const token = getToken();
      const response = await fetch('/api/admin/results/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('CSV Export request failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `quiz-results-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('CSV export downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export results.', 'error');
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<i class="bi bi-file-earmark-spreadsheet me-1"></i> Export Results (CSV)';
    }
  });
}
