/**
 * Online Quiz System - Leaderboard Logic
 */

let currentFilter = 'overall';

document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard('overall');
});

function switchFilter(filter) {
  currentFilter = filter;

  // Update button active states
  ['tabOverall', 'tabWeekly', 'tabMonthly'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  if (filter === 'overall') document.getElementById('tabOverall').classList.add('active');
  if (filter === 'weekly') document.getElementById('tabWeekly').classList.add('active');
  if (filter === 'monthly') document.getElementById('tabMonthly').classList.add('active');

  loadLeaderboard(filter);
}

async function loadLeaderboard(filter) {
  const podiumRow = document.getElementById('podiumRow');
  const tbody = document.getElementById('leaderboardTbody');

  let endpoint = '/leaderboard';
  if (filter === 'weekly') endpoint = '/leaderboard/weekly';
  if (filter === 'monthly') endpoint = '/leaderboard/monthly';

  try {
    const res = await apiFetch(endpoint);
    const rankings = res.data || [];

    document.getElementById('leaderboardCountBadge').textContent = `${rankings.length} Participants`;

    renderPodiums(rankings.slice(0, 3));
    renderTable(rankings);

  } catch (err) {
    console.error('Leaderboard load error:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5 text-danger">
            Failed to load leaderboard data.
          </td>
        </tr>
      `;
    }
  }
}

function renderPodiums(topThree) {
  const container = document.getElementById('podiumRow');
  if (!container) return;

  if (topThree.length === 0) {
    container.innerHTML = '';
    return;
  }

  const rankClasses = ['rank-1', 'rank-2', 'rank-3'];
  const medals = ['<i class="bi bi-trophy-fill text-warning"></i> 1st', '2nd', '3rd'];

  container.innerHTML = topThree.map((item, idx) => {
    const rankNum = idx + 1;
    const avatarHtml = item.profileImage
      ? `<img src="${item.profileImage}" alt="${item.name}" class="podium-avatar">`
      : `<div class="podium-avatar">${item.name.charAt(0).toUpperCase()}</div>`;

    return `
      <div class="podium-card ${rankClasses[idx]}">
        <div class="podium-badge">${rankNum}</div>
        ${avatarHtml}
        <h5 class="fw-bold mb-1 text-white text-truncate">${item.name}</h5>
        <div class="fw-bold fs-5 mb-1" style="color: #ec4899;">${item.totalScore} pts</div>
        <div class="text-muted small">${item.quizzesCount} Quizzes • ${item.averagePercentage}% Avg</div>
      </div>
    `;
  }).join('');
}

function renderTable(rankings) {
  const tbody = document.getElementById('leaderboardTbody');
  if (!tbody) return;

  if (rankings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5 text-muted">
          <i class="bi bi-trophy fs-1 text-light d-block mb-3"></i>
          <h5>No quiz activity in this timeframe</h5>
          <p class="small text-muted mb-0">Be the first learner to take a quiz and claim rank #1!</p>
        </td>
      </tr>
    `;
    return;
  }

  const currentUser = getUser();

  tbody.innerHTML = rankings.map(item => {
    let rankBadge = '';
    if (item.rank === 1) {
      rankBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-award-fill"></i> 1</span>';
    } else if (item.rank === 2) {
      rankBadge = '<span class="badge bg-secondary text-white"><i class="bi bi-award-fill"></i> 2</span>';
    } else if (item.rank === 3) {
      rankBadge = '<span class="badge bg-danger text-white"><i class="bi bi-award-fill"></i> 3</span>';
    } else {
      rankBadge = `<span class="fw-bold text-muted">${item.rank}</span>`;
    }

    const isCurrent = currentUser && currentUser._id === item._id;
    const rowClass = isCurrent ? 'table-primary bg-primary bg-opacity-10' : '';

    const avatarHtml = item.profileImage
      ? `<img src="${item.profileImage}" alt="${item.name}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">`
      : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">${item.name.charAt(0).toUpperCase()}</div>`;

    return `
      <tr class="${rowClass}">
        <td class="text-center">${rankBadge}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${avatarHtml}
            <div>
              <div class="fw-bold text-white">${item.name} ${isCurrent ? '<span class="badge bg-primary ms-1">You</span>' : ''}</div>
              <small class="text-muted">${item.email}</small>
            </div>
          </div>
        </td>
        <td class="text-center fw-semibold text-white">${item.quizzesCount}</td>
        <td class="text-center fw-bold" style="color: #ec4899;">${item.totalScore}</td>
        <td class="text-center">
          <div class="fw-semibold text-white">${item.averagePercentage}%</div>
        </td>
        <td class="text-center">
          <span class="badge bg-success">${item.bestPercentage || item.averagePercentage}%</span>
        </td>
      </tr>
    `;
  }).join('');
}
