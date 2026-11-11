/**
 * Online Quiz System - Active Quiz Taking Engine
 */

let categoryId = null;
let attemptId = null;
let quizCategory = null;
let questions = [];
let currentIndex = 0;
let userAnswers = {}; // { questionId: 'A' | 'B' | 'C' | 'D' }
let totalDurationSeconds = 0;
let remainingSeconds = 0;
let timerInterval = null;
let isSubmitting = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  categoryId = urlParams.get('categoryId');

  if (!categoryId) {
    showToast('No quiz category specified. Redirecting to categories.', 'warning');
    setTimeout(() => {
      window.location.href = '/categories.html';
    }, 1000);
    return;
  }

  await initializeQuiz();
  initControlButtons();
});

// Fetch Questions and Start Quiz
async function initializeQuiz() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const countParam = urlParams.get('questionCount');
    const questionCount = countParam ? parseInt(countParam, 10) : undefined;

    const res = await apiFetch('/quiz/start', {
      method: 'POST',
      body: JSON.stringify({ categoryId, questionCount })
    });

    if (!res.success || !res.questions || res.questions.length === 0) {
      throw new Error(res.message || 'No questions available for this category');
    }

    attemptId = res.attemptId;
    quizCategory = res.category;
    questions = res.questions;
    totalDurationSeconds = res.durationSeconds || (questions.length * 60);
    remainingSeconds = totalDurationSeconds;

    // Update Header
    document.getElementById('quizCategoryTitle').textContent = quizCategory.categoryName;
    document.getElementById('quizCategoryBadge').textContent = quizCategory.categoryName;
    document.getElementById('quizDifficultyBadge').innerHTML = getDifficultyBadge(quizCategory.difficulty);

    // Hide loader, show quiz
    document.getElementById('quizLoader').classList.add('d-none');
    document.getElementById('quizContentRow').classList.remove('d-none');

    // Start Timer
    startCountdown();

    // Render Initial Question & Palette
    renderQuestion(0);
    renderPalette();

  } catch (err) {
    console.error('Quiz start error:', err);
    document.getElementById('quizLoader').innerHTML = `
      <div class="text-danger py-4">
        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
        <h5>Unable to start quiz</h5>
        <p class="text-muted small">${err.message}</p>
        <a href="/categories.html" class="btn btn-primary btn-sm mt-2">Back to Categories</a>
      </div>
    `;
  }
}

// Countdown Timer Handler
function startCountdown() {
  updateTimerUI();

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      updateTimerUI();
      showToast('Time has expired! Submitting your answers automatically...', 'warning');
      submitQuiz(true); // auto submit
      return;
    }

    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  const display = document.getElementById('timerDisplay');
  const timerBox = document.getElementById('timerBox');
  if (!display) return;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (remainingSeconds < 60) {
    timerBox.classList.add('timer-warning');
  } else {
    timerBox.classList.remove('timer-warning');
  }
}

// Render Current Question
function renderQuestion(index) {
  if (index < 0 || index >= questions.length) return;
  currentIndex = index;

  const q = questions[currentIndex];

  // Indicators
  document.getElementById('questionNumberIndicator').textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById('questionMarksBadge').textContent = `${q.marks || 1} ${q.marks === 1 ? 'Mark' : 'Marks'}`;
  document.getElementById('questionText').textContent = q.questionText;

  // Options
  const container = document.getElementById('optionsContainer');
  const currentSelected = userAnswers[q._id];

  container.innerHTML = q.options.map(opt => {
    const isSelected = currentSelected === opt.key;
    return `
      <div class="option-card ${isSelected ? 'selected' : ''}" onclick="selectOption('${q._id}', '${opt.key}')">
        <div class="option-key">${opt.key}</div>
        <div class="option-text flex-grow-1">${opt.text}</div>
      </div>
    `;
  }).join('');

  // Nav buttons state
  const prevBtn = document.getElementById('prevQuestionBtn');
  const nextBtn = document.getElementById('nextQuestionBtn');

  prevBtn.disabled = currentIndex === 0;

  if (currentIndex === questions.length - 1) {
    nextBtn.innerHTML = 'Review Palette <i class="bi bi-grid-3x3 ms-1"></i>';
  } else {
    nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right ms-1"></i>';
  }

  renderPalette();
}

// Option Selection Trigger
function selectOption(questionId, key) {
  userAnswers[questionId] = key;
  renderQuestion(currentIndex);
  renderPalette();
}

// Clear Selection Trigger
function clearCurrentSelection() {
  const q = questions[currentIndex];
  if (q && userAnswers[q._id]) {
    delete userAnswers[q._id];
    renderQuestion(currentIndex);
    renderPalette();
    showToast('Selection cleared for current question', 'info');
  }
}

// Render Question Palette Grid
function renderPalette() {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;

  let answeredCount = 0;

  grid.innerHTML = questions.map((q, idx) => {
    const isAnswered = !!userAnswers[q._id];
    const isCurrent = idx === currentIndex;

    if (isAnswered) answeredCount++;

    let classes = 'palette-btn';
    if (isCurrent) classes += ' current';
    if (isAnswered) classes += ' answered';

    return `
      <button type="button" class="${classes}" onclick="renderQuestion(${idx})">
        ${idx + 1}
      </button>
    `;
  }).join('');

  const unansweredCount = questions.length - answeredCount;
  document.getElementById('answeredCountBadge').textContent = answeredCount;
  document.getElementById('unansweredCountBadge').textContent = unansweredCount;
}

// Button Events
function initControlButtons() {
  document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    if (currentIndex > 0) renderQuestion(currentIndex - 1);
  });

  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    } else {
      showToast('You have reached the final question. Review your answers before submitting.', 'info');
    }
  });

  document.getElementById('clearSelectionBtn').addEventListener('click', clearCurrentSelection);

  document.getElementById('topSubmitBtn').addEventListener('click', () => submitQuiz(false));
  document.getElementById('finalSubmitBtn').addEventListener('click', () => submitQuiz(false));
}

// Submit Quiz Logic
async function submitQuiz(isAutoSubmit = false) {
  if (isSubmitting) return;

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  if (!isAutoSubmit) {
    let confirmMsg = 'Are you ready to submit your test for grading?';
    if (unansweredCount > 0) {
      confirmMsg = `You still have <strong>${unansweredCount} unanswered</strong> question(s). Are you sure you want to finish and submit now?`;
    }

    const confirmed = await confirmDialog('Submit Quiz', confirmMsg, 'Yes, Submit Test', 'btn-success');
    if (!confirmed) return;
  }

  isSubmitting = true;
  clearInterval(timerInterval);

  // Show submission modal
  const submitModalEl = document.getElementById('submittingModal');
  const submitModal = new bootstrap.Modal(submitModalEl);
  submitModal.show();

  const timeTaken = Math.max(1, totalDurationSeconds - remainingSeconds);

  // Format answers payload
  const answersPayload = questions.map(q => ({
    questionId: q._id,
    selectedOption: userAnswers[q._id] || null
  }));

  try {
    const res = await apiFetch('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        attemptId,
        categoryId,
        answers: answersPayload,
        timeTaken
      })
    });

    if (res.success && res.data) {
      showToast('Quiz evaluated successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/result.html?resultId=${res.data._id}`;
      }, 700);
    }
  } catch (err) {
    submitModal.hide();
    isSubmitting = false;
    showToast(err.message || 'Submission failed. Please try again.', 'error');
  }
}
