// scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
    // 在 scripts/login.js 的 DOMContentLoaded 内部开头插入
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // 转换为十六进制字符串
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let isLoginMode = true; // 追踪当前是登录还是注册模式

    // 1. 获取核心 UI 元素引用
    const identitySection = document.getElementById('identity-section');
    const authSection = document.getElementById('auth-section');
    const backBtn = document.getElementById('back-to-identity');
    const roleSelect = document.getElementById('role');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const switchText = document.getElementById('switch-text');
    const confirmPwdWrapper = document.getElementById('confirm-password-wrapper');
    const submitBtnText = document.querySelector('#login-submit-btn span');
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const btn = document.getElementById('login-submit-btn');
    const spinner = document.getElementById('login-spinner');

    // 健壮的选择器：基于 ID 获取父级容器
    const roleWrapper = roleSelect ? roleSelect.closest('div') : null;
    const registerLink = authSwitchBtn ? authSwitchBtn.parentElement : null;

    // 2. 身份选择逻辑
    const selectStaffBtn = document.getElementById('select-staff');
    const selectUserBtn = document.getElementById('select-user');

    if (selectStaffBtn) {
        selectStaffBtn.addEventListener('click', () => showAuthForm('staff'));
    }
    if (selectUserBtn) {
        selectUserBtn.addEventListener('click', () => showAuthForm('user'));
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // 在隐藏界面前，重置表单以清除已输入的用户名和密码
            if (loginForm) {
                loginForm.reset();
            }

            authSection.classList.add('hidden');
            identitySection.classList.remove('hidden');
        });
    }

    // 3. 登录/注册切换 UI 更新函数
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

    // 4. 显示认证表单逻辑
    function showAuthForm(type) {
        if (loginForm) loginForm.reset();
        isLoginMode = true; // 切换身份时重置为登录模式
        updateAuthUI();

        identitySection.classList.add('hidden');
        authSection.classList.remove('hidden');

        if (type === 'staff') {
            // 员工模式：显示职能角色选项，隐藏注册入口
            if (registerLink) registerLink.classList.add('hidden');
            if (roleWrapper) roleWrapper.classList.remove('hidden');
            // 过滤 Role 选项，只保留员工相关
            Array.from(roleSelect.options).forEach(opt => {
                opt.hidden = (opt.value === 'customer');
            });
            roleSelect.value = 'staff';
        } else {
            // 用户模式：隐藏角色选项（默认为 customer），显示注册入口
            if (registerLink) registerLink.classList.remove('hidden');
            if (roleWrapper) roleWrapper.classList.add('hidden');
            roleSelect.value = 'customer';
        }
    }

    // 5. 绑定登录/注册切换按钮
    if (authSwitchBtn) {
        authSwitchBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateAuthUI();
        });
    }

    // 6. 表单提交处理
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const plainPassword = document.getElementById('password').value; // 获取明文
        const role = document.getElementById('role').value;

        // UI 反馈：显示加载状态
        if (btn && spinner) {
            btn.disabled = true;
            spinner.classList.remove('hidden');
        }

        // 核心安全处理：立即将明文转换为哈希
        const hashedPassword = await hashPassword(plainPassword);

        try {
            let response;
            if (isLoginMode) {
                // --- 登录逻辑 ---
                // TODO: 待替换为后端接口 POST /api/login
                const mockLoginAPI = async (data) => {
                    // 此时 data.password 已经是 SHA-256 字符串
                    console.log("Transmission check - Hashed Password:", data.password);
                    return {
                        success: true,
                        token: "mock_token_" + Date.now(),
                        user: { username: data.username, role: data.role }
                    };
                };
                // 传输加密后的密码
                response = await mockLoginAPI({ username, password: hashedPassword, role });
            } else {
                // --- 注册逻辑 ---
                const plainConfirmPassword = document.getElementById('confirm-password').value;

                // 校验仍使用明文比对，确保用户输入一致
                if (plainPassword !== plainConfirmPassword) {
                    alert("Passwords do not match!");
                    btn.disabled = false;
                    spinner.classList.add('hidden');
                    return;
                }

                // TODO: 待替换为后端注册接口 POST /api/register
                const mockRegisterAPI = async (data) => {
                    // 传输至后端存库的必须是哈希值
                    console.log("Storage check - Hashed Password to DB:", data.password);
                    return { success: true, message: "Registration successful! Please login." };
                };

                // 传输加密后的密码
                response = await mockRegisterAPI({ username, password: hashedPassword, role });

                if (response.success) {
                    alert(response.message);
                    authSwitchBtn.click();
                    btn.disabled = false;
                    spinner.classList.add('hidden');
                    return;
                }
            }
            if (response && response.success) {
                // 存储鉴权信息
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('current_user', JSON.stringify(response.user));
                localStorage.setItem('user_role', response.user.role);

                // 路由跳转
                const routes = {
                    'customer': 'customer.html',
                    'staff': 'staff.html',
                    'manager': 'manager.html',
                    'finance': 'finance.html'
                };
                const targetPage = routes[response.user.role] || 'customer.html';
                window.location.href = targetPage;
            } else {
                alert(response.message || "Action failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Auth Error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            // 最终恢复按钮状态
            if (btn && spinner) {
                btn.disabled = false;
                spinner.classList.add('hidden');
            }
        }
    });
});