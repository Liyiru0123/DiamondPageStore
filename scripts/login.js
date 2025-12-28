// scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 【修复】补充定义 currentLoginMode，默认为 customer
    let currentLoginMode = 'customer';
    let isLoginMode = true;

    // 获取元素
    const identitySection = document.getElementById('identity-section');
    const authSection = document.getElementById('auth-section');
    const backBtn = document.getElementById('back-to-identity');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const switchText = document.getElementById('switch-text');
    const confirmPwdWrapper = document.getElementById('confirm-password-wrapper');
    const submitBtnText = document.querySelector('#login-submit-btn span');
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const btn = document.getElementById('login-submit-btn');
    const spinner = document.getElementById('login-spinner');

    // --- 【修复】删除了报错的 roleWrapper 和 redundant 的 registerLink ---
    // const roleWrapper = roleSelect ? roleSelect.closest('div') : null; // 已删除
    // const registerLink ... // 下面函数里定义了，这里不需要

    // 小眼睛逻辑
    const togglePwdBtn = document.getElementById('toggle-password');
    const pwdInput = document.getElementById('password');
    if (togglePwdBtn && pwdInput) {
        togglePwdBtn.addEventListener('click', () => {
            const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdInput.setAttribute('type', type);
            const icon = togglePwdBtn.querySelector('i');
            if (icon) {
                icon.className = type === 'text' ? 'fa fa-eye' : 'fa fa-eye-slash';
            }
        });
    }

    // --- 界面逻辑 ---
    const selectStaffBtn = document.getElementById('select-staff');
    const selectUserBtn = document.getElementById('select-user');

    if (selectStaffBtn) {
        selectStaffBtn.addEventListener('click', () => {
            currentLoginMode = 'staff'; // 标记为员工入口
            showAuthForm('staff');
        });
    }
    if (selectUserBtn) {
        selectUserBtn.addEventListener('click', () => {
            currentLoginMode = 'customer'; // 标记为顾客入口
            showAuthForm('user');
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (loginForm) loginForm.reset();
            authSection.classList.add('hidden');
            identitySection.classList.remove('hidden');
        });
    }


    function updateAuthUI() {
        if (isLoginMode) {
            authTitle.innerText = "Welcome Back";
            submitBtnText.innerText = "Sign In";
            switchText.innerText = "Don't have an account?";
            authSwitchBtn.innerText = "Register Now";
            confirmPwdWrapper.classList.add('hidden');
            document.getElementById('confirm-password').required = false;
        } else {
            authTitle.innerText = "Create Account";
            submitBtnText.innerText = "Sign Up";
            switchText.innerText = "Already have an account?";
            authSwitchBtn.innerText = "Back to Login";
            confirmPwdWrapper.classList.remove('hidden');
            document.getElementById('confirm-password').required = true;
        }
    }

    function showAuthForm(type) {
        if (loginForm) loginForm.reset();
        isLoginMode = true;
        updateAuthUI();
        identitySection.classList.add('hidden');
        authSection.classList.remove('hidden');

        // 在这里获取 registerLink 才是安全的，因为 authSwitchBtn 肯定存在
        const registerLink = authSwitchBtn ? authSwitchBtn.parentElement : null;

        if (type === 'staff') {
            // 员工界面：隐藏注册入口 (员工不能自己注册)
            if (registerLink) registerLink.classList.add('hidden');
        } else {
            // 顾客界面：显示注册入口
            if (registerLink) registerLink.classList.remove('hidden');
        }
    }

    if (authSwitchBtn) {
        authSwitchBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateAuthUI();
        });
    }

    // --- 核心提交逻辑 ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value; 

            // UI 加载状态
            if (btn && spinner) {
                btn.disabled = true;
                spinner.classList.remove('hidden');
            }

            try {
                const payload = { 
                    username: username, 
                    password: password,
                    login_mode: currentLoginMode // 发送当前模式
                };

                let response;

                if (isLoginMode) {
                    // Login
                    const res = await fetch('../api/auth/login.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    response = await res.json();
                } else {
                    // Register (只能在 customer 模式下触发)
                    const confirmInput = document.getElementById('confirm-password');
                    const confirmPwd = confirmInput ? confirmInput.value : '';

                    if (password !== confirmPwd) {
                        alert("Passwords do not match!");
                        resetBtnState();
                        return;
                    }
                    if (password.length > 50) {
                        alert("Password is too long.");
                        resetBtnState();
                        return;
                    }

                    const res = await fetch('../api/auth/register.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    response = await res.json();

                    if (response.success) {
                        alert("Registration successful! Please login.");
                        authSwitchBtn.click();
                        resetBtnState();
                        return;
                    }
                }

                // 处理响应
                if (response && response.success) {
                    localStorage.setItem('auth_token', response.token);
                    const finalRole = response.user.role; 
                    localStorage.setItem('user_role', finalRole);
                    localStorage.setItem('current_user', JSON.stringify(response.user));

                    const routes = {
                        'customer': 'customer.html',
                        'staff': 'staff.html',
                        'manager': 'manager.html',
                        'finance': 'finance.html'
                    };
                    
                    const targetPage = routes[finalRole] || 'customer.html';
                    console.log(`Auto Redirecting: ${targetPage} (Job: ${response.user.job_title})`);
                    window.location.href = targetPage;
                } else {
                    alert(response.message || "Operation failed.");
                }

            } catch (error) {
                console.error("Error:", error);
                alert("Network error.");
            } finally {
                resetBtnState();
            }
        });
    }

    function resetBtnState() {
        if (btn && spinner) {
            btn.disabled = false;
            spinner.classList.add('hidden');
        }
    }
});