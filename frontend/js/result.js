/**
 * Online Quiz System - Quiz Result & Review Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  const resultId = urlParams.get('resultId');

  if (!resultId) {
    showToast('No quiz result found. Redirecting to your dashboard.', 'warning');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
    return;
  }

  await loadResultData(resultId);
});

async function loadResultData(resultId) {
  try {
    const res = await apiFetch(`/quiz/history/${resultId}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Result record could not be found');
    }

    const result = res.data;
    renderResultScorecard(result);
    renderQuestionReview(result.answers || []);

    document.getElementById('resultLoader').classList.add('d-none');
    document.getElementById('resultContent').classList.remove('d-none');

  } catch (err) {
    console.error('Failed to load result:', err);
    document.getElementById('resultLoader').innerHTML = `
      <div class="text-danger py-4">
        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
        <h5>Unable to load result</h5>
        <p class="text-muted small">${err.message}</p>
        <a href="/dashboard.html" class="btn btn-primary btn-sm mt-2">Back to Dashboard</a>
      </div>
    `;
  }
}

function renderResultScorecard(r) {
  const categoryName = r.categoryId ? r.categoryId.categoryName : 'Quiz';
  document.getElementById('resultCategoryName').textContent = `${categoryName} Assessment`;
  document.getElementById('resultPercentage').textContent = `${r.percentage}%`;

  // Status & Headings
  const badgeContainer = document.getElementById('performanceBadgeContainer');
  badgeContainer.innerHTML = getPerformanceBadge(r.percentage);

  const headingEl = document.getElementById('performanceHeading');
  const iconEl = document.getElementById('performanceIcon');
  const iconBg = document.getElementById('performanceIconBg');

  if (r.percentage >= 80) {
    headingEl.textContent = 'Congrats! You Win';
    iconEl.className = 'bi bi-stars fs-1 text-warning';
    iconBg.style.background = 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)';
    iconBg.style.boxShadow = '0 0 25px rgba(236, 72, 153, 0.5)';
  } else if (r.percentage >= 50) {
    headingEl.textContent = 'Well Done! Test Passed';
    iconEl.className = 'bi bi-check-circle-fill text-success fs-1';
    iconBg.style.background = 'rgba(16, 185, 129, 0.2)';
    iconBg.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
  } else {
    headingEl.textContent = 'Good Effort! Keep Practicing';
    iconEl.className = 'bi bi-arrow-repeat text-danger fs-1';
    iconBg.style.background = 'rgba(244, 63, 94, 0.2)';
    iconBg.style.boxShadow = '0 0 20px rgba(244, 63, 94, 0.4)';
  }

  // Stat Breakdown Cards
  document.getElementById('statTotalQuestions').textContent = r.totalQuestions;
  document.getElementById('statCorrectAnswers').textContent = r.correctAnswers;
  document.getElementById('statWrongAnswers').textContent = r.wrongAnswers;
  document.getElementById('statUnanswered').textContent = r.unanswered;
  document.getElementById('statMarksObtained').textContent = `${r.obtainedMarks} / ${r.totalMarks}`;
  document.getElementById('statTimeTaken').textContent = formatDuration(r.timeTaken);

  // Retake Button
  const retakeBtn = document.getElementById('retakeQuizBtn');
  if (retakeBtn && r.categoryId) {
    retakeBtn.addEventListener('click', () => {
      window.location.href = `/quiz.html?categoryId=${r.categoryId._id || r.categoryId}`;
    });
  }
}

function renderQuestionReview(answers) {
  const container = document.getElementById('answersReviewContainer');
  if (!container) return;

  if (answers.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-4">No detailed question responses stored for this quiz.</p>`;
    return;
  }

  container.innerHTML = answers.map((ans, idx) => {
    let statusBadge = '';
    let cardBorder = '';

    if (!ans.selectedOption) {
      statusBadge = '<span class="badge bg-secondary">SKIPPED / UNANSWERED</span>';
      cardBorder = 'border-secondary-subtle';
    } else if (ans.isCorrect) {
      statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>CORRECT (+1)</span>';
      cardBorder = 'border-success-subtle';
    } else {
      statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>INCORRECT</span>';
      cardBorder = 'border-danger-subtle';
    }

    return `
      <div class="card p-4 ${cardBorder} shadow-none" style="background: #252047 !important; border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold text-white">Question ${idx + 1}</span>
          ${statusBadge}
        </div>
        <h6 class="fw-bold text-white mb-3">${ans.questionText}</h6>

        <!-- Options Breakdown -->
        <div class="d-flex flex-column gap-2 mb-3">
          ${(ans.options || []).map(opt => {
            const isCorrectAnswer = opt.key === ans.correctAnswer;
            const isUserPick = opt.key === ans.selectedOption;

            let optStyle = 'background: #1e1939; border: 1.5px solid rgba(255, 255, 255, 0.1); color: #ffffff;';
            let icon = '';

            if (isCorrectAnswer) {
              optStyle = 'background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; color: #34d399; font-weight: 700;';
              icon = '<span class="badge bg-success ms-auto"><i class="bi bi-check2"></i> Correct Answer</span>';
            } else if (isUserPick && !isCorrectAnswer) {
              optStyle = 'background: rgba(244, 63, 94, 0.2); border: 2px solid #f43f5e; color: #fb7185;';
              icon = '<span class="badge bg-danger ms-auto"><i class="bi bi-x"></i> Your Choice</span>';
            }

            return `
              <div class="p-3 px-3 rounded-3 d-flex align-items-center gap-2 small" style="${optStyle}">
                <span class="fw-bold me-1">${opt.key}.</span>
                <span>${opt.text}</span>
                ${icon}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Technical Explanation -->
        ${
          ans.explanation
            ? `
            <div class="p-3 rounded-3 small" style="background: #1b1736; border: 1px solid rgba(56, 189, 248, 0.25); color: #cbd5e1;">
              <div class="fw-bold text-info mb-1"><i class="bi bi-info-circle me-1"></i>Solution & Explanation:</div>
              <div class="text-muted" style="color: #9d9bc2 !important;">${ans.explanation}</div>
            </div>
          `
            : ''
        }
      </div>
    `;
  }).join('');
}
