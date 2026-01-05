/**
 * Manager Profile Management
 * 处理当前登录用户的个人资料和密码管理
 */

// =============================================================================
// 全局变量
// =============================================================================
let currentUserData = null;

// =============================================================================
// 页面加载时获取当前用户信息
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行，确保layout.js的initLayout已经完成header渲染
    setTimeout(() => {
        loadCurrentUserInfo();
    }, 500);
});

/**
 * 加载当前用户信息并更新header显示
 */
async function loadCurrentUserInfo() {
    try {
        // 从localStorage获取用户信息（登录时保存的是current_user对象）
        const currentUserStr = localStorage.getItem('current_user');
        if (!currentUserStr) {
            console.warn('User info not found in localStorage');
            return;
        }

        const currentUser = JSON.parse(currentUserStr);
        const userId = currentUser.user_id;

        if (!userId) {
            console.warn('User ID not found in user info');
            return;
        }

        // 调用API获取用户信息
        const userData = await getCurrentUserProfileAPI(userId);
        currentUserData = userData;

        // 更新header中的用户名显示
        const headerUserName = document.getElementById('header-user-name');
        if (headerUserName && userData.full_name) {
            headerUserName.textContent = userData.full_name;
        }

        // 更新头像（使用用户名生成）
        const avatar = document.querySelector('#user-menu-btn img');
        if (avatar && userData.full_name) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name)}&background=random`;
        }
    } catch (error) {
        console.error('Failed to load current user info:', error);
    }
}

// =============================================================================
// Edit Profile 模态框处理
// =============================================================================

/**
 * 打开Edit Profile模态框
 */
async function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;

    try {
        // 如果还没有加载用户数据，先加载
        if (!currentUserData) {
            const currentUserStr = localStorage.getItem('current_user');
            if (!currentUserStr) {
                showMessage('User session not found. Please login again.', 'error');
                return;
            }
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser.user_id;
            currentUserData = await getCurrentUserProfileAPI(userId);
        }

        // 填充表单数据
        document.getElementById('profile-user-id').value = currentUserData.user_id;
        document.getElementById('profile-username').value = currentUserData.username;
        document.getElementById('profile-full-name').value = currentUserData.full_name || '';
        document.getElementById('profile-email').value = currentUserData.email || '';

        // 显示模态框
        modal.classList.remove('hidden');

        // 关闭用户菜单下拉
        const dropdown = document.getElementById('user-menu-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    } catch (error) {
        console.error('Failed to open edit profile modal:', error);
        showMessage('Failed to load profile data', 'error');
    }
}

/**
 * 关闭Edit Profile模态框
 */
function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('edit-profile-form').reset();
    }
}

/**
 * 保存个人资料
 */
async function saveProfile() {
    const userId = document.getElementById('profile-user-id').value;
    const fullName = document.getElementById('profile-full-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();

    // 验证必填字段
    if (!fullName) {
        showMessage('Please enter your full name', 'error');
        return;
    }

    // 验证邮箱格式
    if (email && !isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        const profileData = {
            user_id: parseInt(userId),
            full_name: fullName,
            email: email
        };

        await updateProfileAPI(profileData);
        showMessage('Profile updated successfully', 'success');

        // 更新缓存的用户数据
        currentUserData.full_name = fullName;
        currentUserData.email = email;

        // 更新header显示
        const headerUserName = document.getElementById('header-user-name');
        if (headerUserName) {
            headerUserName.textContent = fullName;
        }

        // 更新头像
        const avatar = document.querySelector('#user-menu-btn img');
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
        }

        closeEditProfileModal();
    } catch (error) {
        console.error('Failed to update profile:', error);
        showMessage('Failed to update profile: ' + error.message, 'error');
    }
}

// =============================================================================
// Change Password 模态框处理
// =============================================================================

/**
 * 打开Change Password模态框
 */
function openChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (!modal) return;

    // 显示模态框
    modal.classList.remove('hidden');

    // 关闭用户菜单下拉
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

/**
 * 关闭Change Password模态框
 */
function closeChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('change-password-form').reset();
    }
}

/**
 * 修改密码
 */
async function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 验证必填字段
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('Please fill in all password fields', 'error');
        return;
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
        showMessage('New password must be at least 6 characters', 'error');
        return;
    }

    // 验证两次输入的新密码是否一致
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }

    // 验证新密码不能与当前密码相同
    if (currentPassword === newPassword) {
        showMessage('New password must be different from current password', 'error');
        return;
    }

    try {
        const currentUserStr = localStorage.getItem('current_user');
        if (!currentUserStr) {
            showMessage('User session not found. Please login again.', 'error');
            return;
        }

        const currentUser = JSON.parse(currentUserStr);
        const userId = currentUser.user_id;

        const passwordData = {
            user_id: parseInt(userId),
            current_password: currentPassword,
            new_password: newPassword
        };

        await changePasswordAPI(passwordData);
        showMessage('Password changed successfully', 'success');
        closeChangePasswordModal();
    } catch (error) {
        console.error('Failed to change password:', error);
        showMessage('Failed to change password: ' + error.message, 'error');
    }
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 从localStorage获取当前用户ID
 */
function getCurrentUserId() {
    try {
        const currentUserStr = localStorage.getItem('current_user');
        if (!currentUserStr) return null;

        const currentUser = JSON.parse(currentUserStr);
        return currentUser.user_id || null;
    } catch (error) {
        console.error('Error parsing current user:', error);
        return null;
    }
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// showMessage 函数已在 manager-api-integration.js 中定义
// 不再在此重复定义，避免无限递归问题

console.log('Manager Profile functions loaded successfully');
