// scripts/login.js

// 状态变量，用于记录当前选择的身份
let currentLoginMode = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. 绑定身份选择按钮事件
    const btnStaff = document.getElementById('select-staff');
    const btnUser = document.getElementById('select-user');
    const btnBack = document.getElementById('back-to-identity');
    const btnSwitch = document.getElementById('auth-switch-btn');

    if (btnStaff) btnStaff.addEventListener('click', () => showLoginForm('staff'));
    if (btnUser) btnUser.addEventListener('click', () => showLoginForm('customer'));
    if (btnBack) btnBack.addEventListener('click', showIdentitySection);
    
    if (btnSwitch) {
        btnSwitch.addEventListener('click', () => {
           alert("Registration feature is coming soon!"); 
        });
    }

    // 2. 绑定登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 3. 绑定密码显示/隐藏小眼睛
    const togglePwdBtn = document.getElementById('toggle-password');
    if (togglePwdBtn) {
        togglePwdBtn.addEventListener('click', () => {
            const pwdInput = document.getElementById('password');
            const icon = togglePwdBtn.querySelector('i');
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                pwdInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
});

/**
 * 切换显示 UI
 */
function showLoginForm(mode) {
    currentLoginMode = mode; // 记录模式
    
    // 隐藏身份选择区，显示登录区
    document.getElementById('identity-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');

    // 更新标题
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    
    if (mode === 'staff') {
        title.textContent = "Staff Portal";
        subtitle.textContent = "Authorized personnel only";
        document.getElementById('switch-text').parentElement.classList.add('hidden'); // 员工通常不能自行注册
    } else {
        title.textContent = "Welcome Back";
        subtitle.textContent = "Log in to your account";
        document.getElementById('switch-text').parentElement.classList.remove('hidden');
    }
}

function showIdentitySection() {
    currentLoginMode = null;
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('identity-section').classList.remove('hidden');
    // 清空输入框
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

/**
 * 核心登录逻辑
 */
async function handleLogin(e) {
    e.preventDefault();

    const btn = document.getElementById('login-submit-btn');
    const spinner = document.getElementById('login-spinner');
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!currentLoginMode) {
        alert("Please select a role first.");
        return;
    }

    // UI Loading 状态
    btn.disabled = true;
    spinner.classList.remove('hidden');

    try {
        const payload = {
            username: usernameInput,
            password: passwordInput,
            login_mode: currentLoginMode // 发送当前选择的模式
        };

        const response = await fetch('../api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 解析 JSON，注意：这里可能会抛错，如果 PHP 返回了 HTML 报错页面
        const result = await response.json();

        if (result.success) {
            
            // 1. 存储 Token
            localStorage.setItem('auth_token', result.auth_token);
            
            // 2. 存储完整的用户信息对象 (包含 user_id, email 等)
            if (result.user_info) {
                localStorage.setItem('current_user', JSON.stringify(result.user_info));
                
                // 3. 单独存储角色 (user_role)，用于路由守卫
                localStorage.setItem('user_role', result.user_info.user_role);
            }

            // 4. 跳转
            window.location.href = result.redirect_to;

        } else {
            // 登录失败提示
            alert(result.message || "Login failed");
        }

    } catch (error) {
        console.error("Login JS Error:", error);
        alert("An error occurred. Please check console (F12) for details.");
    } finally {
        // 恢复按钮状态
        btn.disabled = false;
        spinner.classList.add('hidden');
    }
}