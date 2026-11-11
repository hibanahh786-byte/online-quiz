/**
 * Online Quiz System - User Profile Logic
 */

let selectedAvatarFile = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  await loadProfile();
  initAvatarUpload();
  initProfileForm();
  initPasswordForm();
});

async function loadProfile() {
  try {
    const res = await apiFetch('/profile');
    if (res.success && res.user) {
      const u = res.user;

      document.getElementById('profName').value = u.name || '';
      document.getElementById('profEmail').value = u.email || '';
      document.getElementById('profPhone').value = u.phone || '';
      document.getElementById('profRole').value = (u.role || 'user').toUpperCase();

      // Sidebar & Preview
      document.getElementById('profileSidebarName').textContent = u.name;

      updateAvatarDisplay(u.profileImage, u.name);
    }
  } catch (err) {
    showToast('Failed to load profile details.', 'error');
  }
}

function updateAvatarDisplay(imageUrl, name) {
  const preview = document.getElementById('profilePicturePreview');
  const sidebar = document.getElementById('profileSidebarAvatar');

  if (imageUrl) {
    const imgHtml = `<img src="${imageUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    if (preview) preview.innerHTML = imgHtml;
    if (sidebar) sidebar.innerHTML = imgHtml;
  } else {
    const char = (name || 'U').charAt(0).toUpperCase();
    if (preview) preview.textContent = char;
    if (sidebar) sidebar.textContent = char;
  }
}

function initAvatarUpload() {
  const input = document.getElementById('profileImageInput');
  if (!input) return;

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB.', 'warning');
        input.value = '';
        return;
      }

      selectedAvatarFile = file;

      // Instant preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = document.getElementById('profilePicturePreview');
        if (preview) {
          preview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
      };
      reader.readAsDataURL(file);
      showToast('Image selected. Click "Save Profile Changes" to update.', 'info');
    }
  });
}

function initProfileForm() {
  const form = document.getElementById('profileDetailsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profName').value.trim();
    const email = document.getElementById('profEmail').value.trim();
    const phone = document.getElementById('profPhone').value.trim();

    if (!name || !email || !phone) {
      showToast('Please fill out all contact fields.', 'warning');
      return;
    }

    const saveBtn = document.getElementById('saveProfileBtn');

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

      let res;
      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('profileImage', selectedAvatarFile);

        res = await apiFetch('/profile', {
          method: 'PUT',
          body: formData
        });
      } else {
        res = await apiFetch('/profile', {
          method: 'PUT',
          body: JSON.stringify({ name, email, phone })
        });
      }

      if (res.success && res.user) {
        setUser(res.user);
        showToast('Profile updated successfully!', 'success');
        updateAvatarDisplay(res.user.profileImage, res.user.name);
        document.getElementById('profileSidebarName').textContent = res.user.name;
        renderNavbar(); // re-render navbar with updated name/avatar
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i> Save Profile Changes';
    }
  });
}

function initPasswordForm() {
  const form = document.getElementById('changePasswordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    const changeBtn = document.getElementById('changePasswordBtn');

    try {
      changeBtn.disabled = true;
      changeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Updating...';

      const res = await apiFetch('/profile/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
      });

      if (res.success) {
        showToast('Password updated successfully!', 'success');
        form.reset();
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      changeBtn.disabled = false;
      changeBtn.innerHTML = '<i class="bi bi-key me-1"></i> Update Password';
    }
  });
}
