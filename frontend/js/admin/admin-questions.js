/**
 * Online Quiz System - Admin Question Bank Logic
 */

let categoriesList = [];
let currentPage = 1;
let totalPages = 1;
let questionModal = null;
let currentQuestions = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth(true)) return;

  const modalEl = document.getElementById('questionModal');
  if (modalEl) {
    questionModal = new bootstrap.Modal(modalEl);
  }

  await loadCategories();
  await loadQuestions(1);
  initFilters();
  initFormSubmit();
});

async function loadCategories() {
  try {
    const res = await apiFetch('/categories?includeInactive=true');
    categoriesList = res.data || [];

    // Populate filter dropdown
    const filterSelect = document.getElementById('filterCategorySelect');
    const modalSelect = document.getElementById('qCategorySelect');

    const optionsHtml = categoriesList.map(c => `
      <option value="${c._id}">${c.categoryName}</option>
    `).join('');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="all">All Categories</option>` + optionsHtml;
    }

    if (modalSelect) {
      modalSelect.innerHTML = `<option value="">Select Category...</option>` + optionsHtml;
    }
  } catch (err) {
    console.error('Failed to load categories list:', err);
  }
}

async function loadQuestions(page = 1) {
  const tbody = document.getElementById('adminQuestionsTbody');
  if (!tbody) return;

  currentPage = page;

  const search = document.getElementById('questionSearchInput').value.trim();
  const categoryId = document.getElementById('filterCategorySelect').value;
  const difficulty = document.getElementById('filterDifficultySelect').value;

  const params = new URLSearchParams({
    page,
    limit: 10
  });

  if (search) params.append('search', search);
  if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
  if (difficulty && difficulty !== 'all') params.append('difficulty', difficulty);

  try {
    const res = await apiFetch(`/questions?${params.toString()}`);
    currentQuestions = res.data || [];
    totalPages = res.totalPages || 1;

    document.getElementById('totalQuestionsCountBadge').textContent = `${res.total || 0} Questions`;
    document.getElementById('paginationInfo').textContent = `Showing ${(page - 1) * 10 + (currentQuestions.length > 0 ? 1 : 0)} to ${(page - 1) * 10 + currentQuestions.length} of ${res.total || 0}`;

    renderQuestionsTable(currentQuestions, page);
    renderPagination();

  } catch (err) {
    console.error('Questions load error:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-danger">Failed to load questions.</td></tr>`;
  }
}

function renderQuestionsTable(questions, page) {
  const tbody = document.getElementById('adminQuestionsTbody');
  if (!tbody) return;

  if (questions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          <i class="bi bi-question-circle fs-1 text-light d-block mb-3"></i>
          <h5>No questions found</h5>
          <p class="small text-muted mb-0">Try different filters or add questions to this category.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = questions.map((q, idx) => {
    const rowNum = (page - 1) * 10 + idx + 1;
    const catName = q.categoryId ? q.categoryId.categoryName : 'Unknown';

    return `
      <tr>
        <td class="text-muted small">${rowNum}</td>
        <td>
          <div class="fw-bold text-white text-truncate" style="max-width: 360px;" title="${q.questionText}">${q.questionText}</div>
          <small class="text-muted d-block text-truncate" style="max-width: 360px;">
            A: ${q.options[0]?.text || ''} | B: ${q.options[1]?.text || ''}
          </small>
        </td>
        <td>
          <span class="badge bg-light text-dark border">${catName}</span>
        </td>
        <td>
          <span class="badge bg-success-subtle text-success fw-bold px-2 py-1">Option ${q.correctAnswer}</span>
        </td>
        <td>${getDifficultyBadge(q.difficulty)}</td>
        <td class="text-center fw-semibold">${q.marks || 1}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" onclick="openEditQuestionModal('${q._id}')" title="Edit Question">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteQuestion('${q._id}')" title="Delete Question">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  const ul = document.getElementById('paginationUl');
  if (!ul) return;

  if (totalPages <= 1) {
    ul.innerHTML = '';
    return;
  }

  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="loadQuestions(${currentPage - 1})">Prev</button>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <button class="page-link" onclick="loadQuestions(${i})">${i}</button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="loadQuestions(${currentPage + 1})">Next</button>
    </li>
  `;

  ul.innerHTML = html;
}

function initFilters() {
  const searchInput = document.getElementById('questionSearchInput');
  const catSelect = document.getElementById('filterCategorySelect');
  const diffSelect = document.getElementById('filterDifficultySelect');

  let timeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadQuestions(1), 350);
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => loadQuestions(1));
  }

  if (diffSelect) {
    diffSelect.addEventListener('change', () => loadQuestions(1));
  }
}

function openCreateQuestionModal() {
  document.getElementById('editQuestionId').value = '';
  document.getElementById('questionModalTitle').textContent = 'Add New Question';
  document.getElementById('qCategorySelect').value = '';
  document.getElementById('qDifficultySelect').value = 'medium';
  document.getElementById('qMarksInput').value = '1';
  document.getElementById('qTextInput').value = '';
  document.getElementById('qOptionA').value = '';
  document.getElementById('qOptionB').value = '';
  document.getElementById('qOptionC').value = '';
  document.getElementById('qOptionD').value = '';
  document.getElementById('qCorrectAnswerSelect').value = 'A';
  document.getElementById('qExplanationInput').value = '';

  if (questionModal) questionModal.show();
}

function openEditQuestionModal(id) {
  const q = currentQuestions.find(item => item._id === id);
  if (!q) return;

  document.getElementById('editQuestionId').value = q._id;
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('qCategorySelect').value = q.categoryId?._id || q.categoryId || '';
  document.getElementById('qDifficultySelect').value = q.difficulty || 'medium';
  document.getElementById('qMarksInput').value = q.marks || 1;
  document.getElementById('qTextInput').value = q.questionText;

  const optA = q.options?.find(o => o.key === 'A');
  const optB = q.options?.find(o => o.key === 'B');
  const optC = q.options?.find(o => o.key === 'C');
  const optD = q.options?.find(o => o.key === 'D');

  document.getElementById('qOptionA').value = optA ? optA.text : '';
  document.getElementById('qOptionB').value = optB ? optB.text : '';
  document.getElementById('qOptionC').value = optC ? optC.text : '';
  document.getElementById('qOptionD').value = optD ? optD.text : '';

  document.getElementById('qCorrectAnswerSelect').value = q.correctAnswer || 'A';
  document.getElementById('qExplanationInput').value = q.explanation || '';

  if (questionModal) questionModal.show();
}

function initFormSubmit() {
  const form = document.getElementById('questionForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editQuestionId').value;
    const categoryId = document.getElementById('qCategorySelect').value;
    const difficulty = document.getElementById('qDifficultySelect').value;
    const marks = Number(document.getElementById('qMarksInput').value) || 1;
    const questionText = document.getElementById('qTextInput').value.trim();

    const optA = document.getElementById('qOptionA').value.trim();
    const optB = document.getElementById('qOptionB').value.trim();
    const optC = document.getElementById('qOptionC').value.trim();
    const optD = document.getElementById('qOptionD').value.trim();

    const correctAnswer = document.getElementById('qCorrectAnswerSelect').value;
    const explanation = document.getElementById('qExplanationInput').value.trim();

    if (!categoryId || !questionText || !optA || !optB || !optC || !optD) {
      showToast('Please provide category, question text, and all 4 options.', 'warning');
      return;
    }

    const options = [
      { key: 'A', text: optA },
      { key: 'B', text: optB },
      { key: 'C', text: optC },
      { key: 'D', text: optD }
    ];

    const payload = {
      categoryId,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      marks
    };

    const saveBtn = document.getElementById('saveQuestionBtn');

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

      let res;
      if (id) {
        res = await apiFetch(`/questions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/questions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.success) {
        showToast(`Question ${id ? 'updated' : 'added'} successfully!`, 'success');
        if (questionModal) questionModal.hide();
        await loadQuestions(currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save question.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Question';
    }
  });
}

async function deleteQuestion(id) {
  const confirmed = await confirmDialog(
    'Delete Question',
    'Are you sure you want to permanently delete this question from the question bank?',
    'Delete Question',
    'btn-danger'
  );
  if (!confirmed) return;

  try {
    const res = await apiFetch(`/questions/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Question deleted successfully.', 'success');
      await loadQuestions(currentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete question.', 'error');
  }
}
