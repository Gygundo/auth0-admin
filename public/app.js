// State
let currentUser = null;

// DOM refs
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');
const resultsBody = document.getElementById('resultsBody');
const resultCount = document.getElementById('resultCount');
const userDetail = document.getElementById('userDetail');
const emptyState = document.getElementById('emptyState');
const deleteModal = document.getElementById('deleteModal');

// --- Search ---

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;

  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';

  try {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (res.ok) {
      renderResults(data);
    } else {
      toast(data.error || 'Search failed', 'error');
    }
  } catch (err) {
    toast('Network error', 'error');
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

function renderResults(data) {
  const users = data.users || data;
  const total = data.total ?? users.length;

  emptyState.classList.add('hidden');
  userDetail.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  resultCount.textContent = `(${total} found)`;

  if (users.length === 0) {
    resultsBody.innerHTML = '<p class="text-gray-400 text-center py-8">No users found</p>';
    return;
  }

  resultsBody.innerHTML = users.map((u) => `
    <div class="user-row flex items-center gap-4 p-3 border border-gray-200 rounded-lg cursor-pointer"
         data-id="${u.user_id}" onclick="selectUser('${u.user_id}')">
      <img src="${u.picture || ''}" alt="" class="w-10 h-10 rounded-full bg-gray-200 shrink-0">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${escHtml(u.name || u.nickname || 'No name')}</p>
        <p class="text-xs text-gray-500 truncate">${escHtml(u.email || 'No email')}</p>
      </div>
      <div class="flex gap-1 shrink-0">
        ${u.blocked ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Blocked</span>' : ''}
        ${u.email_verified ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>' : '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Unverified</span>'}
      </div>
      <span class="text-xs text-gray-400 shrink-0">${u.logins_count ?? 0} logins</span>
    </div>
  `).join('');
}

// --- User Detail ---

async function selectUser(id) {
  // Highlight active row
  document.querySelectorAll('.user-row').forEach((r) => r.classList.remove('active'));
  const row = document.querySelector(`[data-id="${id}"]`);
  if (row) row.classList.add('active');

  try {
    const [userRes, logsRes, blocksRes] = await Promise.all([
      fetch(`/api/users/${encodeURIComponent(id)}`),
      fetch(`/api/users/${encodeURIComponent(id)}/logs`),
      fetch(`/api/blocks/${encodeURIComponent(id)}`),
    ]);

    const user = await userRes.json();
    const logs = await logsRes.json();
    const blocks = await blocksRes.json();

    if (!userRes.ok) {
      toast(user.error || 'Failed to load user', 'error');
      return;
    }

    currentUser = user;
    renderUserDetail(user, logs, blocks);
  } catch (err) {
    toast('Failed to load user details', 'error');
  }
}

function renderUserDetail(user, logs, blocks) {
  userDetail.classList.remove('hidden');

  document.getElementById('userAvatar').src = user.picture || '';
  document.getElementById('userName').textContent = user.name || user.nickname || 'No name';
  document.getElementById('userEmail').textContent = user.email || 'No email';
  document.getElementById('userId').textContent = user.user_id;
  document.getElementById('userCreated').textContent = formatDate(user.created_at);
  document.getElementById('userLastLogin').textContent = user.last_login ? formatDate(user.last_login) : 'Never';
  document.getElementById('userLoginCount').textContent = user.logins_count ?? 0;

  // Badges
  const badges = [];
  const isBlocked = user.blocked || (blocks.blocked_for && blocks.blocked_for.length > 0);
  if (isBlocked) badges.push('<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Blocked</span>');
  if (user.email_verified) badges.push('<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Email Verified</span>');
  else badges.push('<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Email Unverified</span>');
  document.getElementById('userBadges').innerHTML = badges.join('');

  // Metadata
  document.getElementById('userAppMeta').textContent = JSON.stringify(user.app_metadata || {}, null, 2);
  document.getElementById('userMeta').textContent = JSON.stringify(user.user_metadata || {}, null, 2);

  // Always show unblock — brute-force blocks may exist at IP/identifier level
  // even when user profile doesn't show as blocked

  // Logs
  const logsArr = Array.isArray(logs) ? logs : [];
  if (logsArr.length === 0) {
    document.getElementById('userLogs').innerHTML = '<p class="text-gray-400 text-sm">No recent activity</p>';
  } else {
    document.getElementById('userLogs').innerHTML = logsArr.slice(0, 30).map((log) => {
      const typeClass = log.type?.startsWith('s') ? 'log-type-s' : log.type?.startsWith('f') ? 'log-type-f' : 'log-type-w';
      return `
        <div class="flex items-center gap-3 py-1.5 text-xs border-b border-gray-50">
          <span class="font-mono ${typeClass} w-8 shrink-0">${escHtml(log.type || '?')}</span>
          <span class="text-gray-600 flex-1 truncate">${escHtml(log.description || log.type || 'Unknown event')}</span>
          <span class="text-gray-400 shrink-0">${formatDate(log.date)}</span>
        </div>`;
    }).join('');
  }

  // Scroll to detail
  userDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Actions ---

document.getElementById('btnUnblock').addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/blocks/${encodeURIComponent(currentUser.user_id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast('User unblocked successfully', 'success');
      selectUser(currentUser.user_id); // Refresh
    } else {
      toast(data.error || 'Unblock failed', 'error');
    }
  } catch (err) {
    toast('Network error', 'error');
  }
});

document.getElementById('btnResetPassword').addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/tickets/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.user_id }),
    });
    const data = await res.json();
    if (res.ok) {
      toast('Password reset email sent', 'success');
    } else {
      toast(data.error || 'Password reset failed', 'error');
    }
  } catch (err) {
    toast('Network error', 'error');
  }
});

document.getElementById('btnVerifyEmail').addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/tickets/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.user_id }),
    });
    const data = await res.json();
    if (res.ok) {
      toast('Verification email sent', 'success');
    } else {
      toast(data.error || 'Verification email failed', 'error');
    }
  } catch (err) {
    toast('Network error', 'error');
  }
});

// Delete with confirmation
document.getElementById('btnDelete').addEventListener('click', () => {
  if (!currentUser) return;
  document.getElementById('deleteUserEmail').textContent = currentUser.email || currentUser.user_id;
  deleteModal.classList.remove('hidden');
});

document.getElementById('deleteCancelBtn').addEventListener('click', () => {
  deleteModal.classList.add('hidden');
});

document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
  if (!currentUser) return;
  deleteModal.classList.add('hidden');
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(currentUser.user_id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast('User deleted', 'success');
      userDetail.classList.add('hidden');
      currentUser = null;
      doSearch(); // Refresh results
    } else {
      toast(data.error || 'Delete failed', 'error');
    }
  } catch (err) {
    toast('Network error', 'error');
  }
});

// Close modal on backdrop click
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) deleteModal.classList.add('hidden');
});

// --- Utilities ---

function toast(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };
  const el = document.createElement('div');
  el.className = `toast ${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm`;
  el.textContent = message;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Make selectUser available globally (used by inline onclick)
window.selectUser = selectUser;
