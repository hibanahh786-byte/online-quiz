/**
 * Online Quiz System - Admin Category Management Logic
 */

let categories = [];
let categoryModal = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth(true)) return;

  const modalEl = document.getElementById('categoryModal');
  if (modalEl) {
    categoryModal = new bootstrap.Modal(modalEl);
  }

  await loadCategories();
  initSearch();
  initFormSubmit();
});

async function loadCategories() {
  const tbody = document.getElementById('adminCategoriesTbody');
  if (!tbody) return;

  try {
    const res = await apiFetch('/categories?includeInactive=true');
    categories = res.data || [];
    renderCategoriesTable(categories);
  } catch (err) {
    console.error('Failed to load categories:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-danger">Failed to load categories.</td></tr>`;
  }
}

function renderCategoriesTable(list) {
  const tbody = document.getElementById('adminCategoriesTbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">No categories found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>
        <div class="stats-icon bg-primary bg-opacity-10 text-primary" style="width: 38px; height: 38px; font-size: 1.1rem;">
          <i class="bi ${c.icon || 'bi-journal-bookmark'}"></i>
        </div>
      </td>
      <td>
        <div class="fw-bold text-white">${c.categoryName}</div>
      </td>
      <td class="text-muted small" style="max-width: 250px;">
        <div class="text-truncate">${c.description}</div>
      </td>
      <td>${getDifficultyBadge(c.difficulty)}</td>
      <td class="text-center">
        <span class="badge bg-light text-primary border fw-bold">${c.questionCount || 0}</span>
      </td>
      <td>
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" role="switch" ${c.isActive ? 'checked' : ''} onchange="toggleCategoryStatus('${c._id}', this.checked)">
        </div>
      </td>
      <td class="text-muted small">${new Date(c.createdAt).toLocaleDateString()}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" onclick="openEditCategoryModal('${c._id}')" title="Edit Category">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteCategory('${c._id}', '${c.categoryName.replace(/'/g, "\\'")}')" title="Delete Category">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initSearch() {
  const searchInput = document.getElementById('adminCategorySearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderCategoriesTable(categories);
      return;
    }

    const filtered = categories.filter(c =>
      c.categoryName.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
    renderCategoriesTable(filtered);
  });
}

function openCreateCategoryModal() {
  document.getElementById('editCategoryId').value = '';
  document.getElementById('categoryModalTitle').textContent = 'Add Quiz Category';
  document.getElementById('catNameInput').value = '';
  document.getElementById('catDescInput').value = '';
  document.getElementById('catDiffSelect').value = 'medium';
  document.getElementById('catIconSelect').value = 'bi-journal-bookmark';
  document.getElementById('catQuizCountInput').value = '5';
  document.getElementById('catStatusSwitch').checked = true;

  if (categoryModal) categoryModal.show();
}

function openEditCategoryModal(id) {
  const c = categories.find(item => item._id === id);
  if (!c) return;

  document.getElementById('editCategoryId').value = c._id;
  document.getElementById('categoryModalTitle').textContent = 'Edit Quiz Category';
  document.getElementById('catNameInput').value = c.categoryName;
  document.getElementById('catDescInput').value = c.description;
  document.getElementById('catDiffSelect').value = c.difficulty || 'medium';
  document.getElementById('catIconSelect').value = c.icon || 'bi-journal-bookmark';
  document.getElementById('catQuizCountInput').value = c.quizQuestionCount || 5;
  document.getElementById('catStatusSwitch').checked = !!c.isActive;

  if (categoryModal) categoryModal.show();
}

function initFormSubmit() {
  const form = document.getElementById('categoryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editCategoryId').value;
    const categoryName = document.getElementById('catNameInput').value.trim();
    const description = document.getElementById('catDescInput').value.trim();
    const difficulty = document.getElementById('catDiffSelect').value;
    const icon = document.getElementById('catIconSelect').value;
    const quizQuestionCount = parseInt(document.getElementById('catQuizCountInput').value, 10) || 5;
    const isActive = document.getElementById('catStatusSwitch').checked;

    if (!categoryName || !description) {
      showToast('Please provide category name and description.', 'warning');
      return;
    }

    const saveBtn = document.getElementById('saveCategoryBtn');

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

      const payload = { categoryName, description, difficulty, icon, quizQuestionCount, isActive };

      let res;
      if (id) {
        res = await apiFetch(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.success) {
        showToast(`Category ${id ? 'updated' : 'created'} successfully!`, 'success');
        if (categoryModal) categoryModal.hide();
        await loadCategories();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save category.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Category';
    }
  });
}

async function toggleCategoryStatus(id, newStatus) {
  try {
    const res = await apiFetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: newStatus })
    });

    if (res.success) {
      showToast(`Category status set to ${newStatus ? 'Active' : 'Inactive'}`, 'success');
    }
  } catch (err) {
    showToast('Failed to update category status.', 'error');
    await loadCategories(); // rollback UI
  }
}

async function deleteCategory(id, name) {
  const confirmed = await confirmDialog(
    'Delete Category',
    `Are you sure you want to delete <strong>${name}</strong>?`,
    'Delete Category',
    'btn-danger'
  );
  if (!confirmed) return;

  try {
    const res = await apiFetch(`/categories/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Category deleted successfully.', 'success');
      await loadCategories();
    }
  } catch (err) {
    // Check if safety check was triggered because of existing questions/results
    const forceConfirm = await confirmDialog(
      'Warning: Existing Test Content',
      `${err.message}<br><br>Do you want to <strong>Force Delete</strong> this category and all its attached questions?`,
      'Force Delete Everything',
      'btn-danger'
    );

    if (forceConfirm) {
      try {
        const forceRes = await apiFetch(`/categories/${id}?force=true`, { method: 'DELETE' });
        if (forceRes.success) {
          showToast('Category and associated questions force deleted.', 'success');
          await loadCategories();
        }
      } catch (forceErr) {
        showToast(forceErr.message || 'Force delete failed.', 'error');
      }
    }
  }
}
