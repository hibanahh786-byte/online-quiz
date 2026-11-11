/**
 * Online Quiz System - Home / Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroActions();
  loadFeaturedCategories();
});

function initHeroActions() {
  const startBtn = document.getElementById('heroStartQuizBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isAuthenticated()) {
        window.location.href = '/categories.html';
      } else {
        window.location.href = '/login.html?redirect=/categories.html';
      }
    });
  }
}

async function loadFeaturedCategories() {
  const container = document.getElementById('featuredCategoriesRow');
  if (!container) return;

  try {
    const res = await apiFetch('/categories');
    const categories = res.data || [];

    // Update stats on hero card
    const statsCatEl = document.getElementById('statsCategories');
    if (statsCatEl) statsCatEl.textContent = categories.length;

    const totalQuestionsCount = categories.reduce((sum, c) => sum + (c.questionCount || 0), 0);
    const statsQuestEl = document.getElementById('statsQuestions');
    if (statsQuestEl) statsQuestEl.textContent = `${totalQuestionsCount}+`;

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <p class="text-muted">No quiz categories currently available.</p>
        </div>
      `;
      return;
    }

    // Display first 6 featured categories
    const featured = categories.slice(0, 6);
    container.innerHTML = featured.map(cat => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 card-hover border-0 shadow-sm p-3" style="background: #252047; border-radius: 22px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <div class="p-3 rounded-4 mb-3 d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(168, 85, 247, 0.2) 100%); border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="stats-icon m-0" style="width: 48px; height: 48px; font-size: 1.4rem;">
              <i class="bi ${cat.icon || 'bi-journal-bookmark'}"></i>
            </div>
            ${getDifficultyBadge(cat.difficulty)}
          </div>
          <div class="card-body d-flex flex-column p-1">
            <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
              <span class="badge bg-secondary" style="font-size: 0.7rem;">Live Quiz</span>
              <span><i class="bi bi-clock me-1"></i>~${Math.max(5, (cat.questionCount || 5) * 1)} mins</span>
            </div>
            <h5 class="fw-bold mb-2 text-white">${cat.categoryName}</h5>
            <p class="text-muted small flex-grow-1 mb-3">${cat.description}</p>
            <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
              <span class="small fw-semibold" style="color: #cbd5e1;">
                <i class="bi bi-patch-question text-info me-1"></i> ${cat.questionCount || 0} Questions
              </span>
              <button class="btn btn-primary btn-sm px-3" onclick="startCategoryQuiz('${cat._id}')">
                Play Quiz <i class="bi bi-play-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load categories:', err);
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <p class="text-danger small">Failed to load categories. Please check server connection.</p>
      </div>
    `;
  }
}

function startCategoryQuiz(categoryId) {
  if (!isAuthenticated()) {
    showToast('Please log in first to begin this quiz.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(`/quiz.html?categoryId=${categoryId}`)}`;
    }, 600);
    return;
  }
  window.location.href = `/quiz.html?categoryId=${categoryId}`;
}
