/**
 * Online Quiz System - Categories Page Logic
 */

let allCategories = [];
let selectedCategory = null;
let instructionsModal = null;

document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('quizInstructionsModal');
  if (modalEl) {
    instructionsModal = new bootstrap.Modal(modalEl);
  }

  loadCategories();
  initSearch();
  initModalButton();
});

async function loadCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  try {
    const res = await apiFetch('/categories');
    allCategories = res.data || [];
    renderCategories(allCategories);
  } catch (err) {
    console.error('Failed to load categories:', err);
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-danger">Failed to load categories. Please check your network or server status.</p>
      </div>
    `;
  }
}

function renderCategories(list) {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search fs-1 text-light d-block mb-3"></i>
        <h5 class="text-muted">No matching categories found</h5>
        <p class="text-muted small">Try adjusting your search criteria</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(cat => `
    <div class="col-md-6 col-lg-4 col-xl-3">
      <div class="card h-100 card-hover border-0 shadow-sm p-3" style="background: #252047; border-radius: 22px; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div class="p-3 rounded-4 mb-3 d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(168, 85, 247, 0.2) 100%); border: 1px solid rgba(255, 255, 255, 0.08);">
          <div class="stats-icon m-0" style="width: 46px; height: 46px; font-size: 1.35rem;">
            <i class="bi ${cat.icon || 'bi-journal-bookmark'}"></i>
          </div>
          ${getDifficultyBadge(cat.difficulty)}
        </div>
        <div class="card-body d-flex flex-column p-1">
          <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
            <span class="badge bg-secondary" style="font-size: 0.7rem;">Live Quiz</span>
            <span><i class="bi bi-clock me-1"></i>~${Math.max(5, (cat.questionCount || 5) * 1)} mins</span>
          </div>
          <h5 class="fw-bold text-white mb-2">${cat.categoryName}</h5>
          <p class="text-muted small flex-grow-1 mb-3" style="line-height: 1.5;">${cat.description}</p>
          <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
            <span class="small fw-semibold" style="color: #cbd5e1;">
              <i class="bi bi-patch-question text-info me-1"></i> ${cat.questionCount || 0} Q's
            </span>
            <button class="btn btn-primary btn-sm px-3" onclick="openInstructionsModal('${cat._id}')">
              Play <i class="bi bi-play-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function initSearch() {
  const searchInput = document.getElementById('categorySearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderCategories(allCategories);
      return;
    }

    const filtered = allCategories.filter(c =>
      c.categoryName.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );

    renderCategories(filtered);
  });
}

function openInstructionsModal(categoryId) {
  if (!isAuthenticated()) {
    showToast('Please sign in or register to participate in quizzes.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(`/categories.html`)}`;
    }, 600);
    return;
  }

  const category = allCategories.find(c => c._id === categoryId);
  if (!category) return;

  selectedCategory = category;

  document.getElementById('modalCategoryTitle').textContent = `${category.categoryName} Quiz`;
  const poolBadge = document.getElementById('modalPoolInfo');
  if (poolBadge) poolBadge.textContent = `Pool: ${category.questionCount || 0} Qs`;

  const countSelect = document.getElementById('modalQuestionCountSelect');
  const total = category.questionCount || 0;
  const defaultCount = category.quizQuestionCount || 5;

  if (countSelect) {
    // If the category default is 5, 10, or 15, match it, otherwise keep selection or default to 5
    if (['5', '10', '15'].includes(String(defaultCount))) {
      countSelect.value = String(defaultCount);
    }
  }

  updateModalSpecs();

  if (instructionsModal) {
    instructionsModal.show();
  }
}

function updateModalSpecs() {
  if (!selectedCategory) return;
  const countSelect = document.getElementById('modalQuestionCountSelect');
  const requested = countSelect ? parseInt(countSelect.value, 10) : (selectedCategory.quizQuestionCount || 5);
  const total = selectedCategory.questionCount || 0;
  const actualCount = Math.min(requested, Math.max(1, total));

  document.getElementById('modalQuestionCount').textContent = `${actualCount} Random`;
  const duration = Math.max(5, actualCount * 1);
  document.getElementById('modalDuration').textContent = `${duration} mins`;
  document.getElementById('modalDifficultyBadge').innerHTML = getDifficultyBadge(selectedCategory.difficulty);
}

function initModalButton() {
  const beginBtn = document.getElementById('modalBeginQuizBtn');
  const countSelect = document.getElementById('modalQuestionCountSelect');

  if (countSelect) {
    countSelect.addEventListener('change', updateModalSpecs);
  }

  if (!beginBtn) return;

  beginBtn.addEventListener('click', () => {
    if (!selectedCategory) return;
    if (instructionsModal) {
      instructionsModal.hide();
    }
    const requested = countSelect ? countSelect.value : (selectedCategory.quizQuestionCount || 5);
    window.location.href = `/quiz.html?categoryId=${selectedCategory._id}&questionCount=${requested}`;
  });
}
