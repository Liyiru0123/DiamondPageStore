// scripts/login.js

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // 在 login.js 的 e.preventDefault() 之后
    const btn = document.getElementById('login-submit-btn');
    const spinner = document.getElementById('login-spinner');

    // 提交时显示加载，但不删除文字
    if (btn && spinner) {
        btn.disabled = true;
        spinner.classList.remove('hidden');
    }

    // ... 逻辑执行完后恢复 ...
    if (btn && spinner) {
        btn.disabled = false;
        spinner.classList.add('hidden');
    }

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // TODO: 待替换为后端接口
    // API需求：POST /api/login
    // 参数字段：{ username, password, role }
    const mockLoginAPI = async (data) => {
        console.log("Attempting login with:", data);
        return {
            success: true,
            token: "mock_token_" + Date.now(),
            user: { username: data.username, role: data.role }
        };
    };

    // 定位到 login.js 中 mockLoginAPI 后的 try-catch 块内
    try {
        const response = await mockLoginAPI({ username, password, role });

        if (response.success) {
            // 1. 存储鉴权信息与角色状态
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('current_user', JSON.stringify(response.user));
            localStorage.setItem('user_role', response.user.role); // 显式存储角色方便读取

            // 2. 分发路由跳转
            const routes = {
                'customer': 'customer.html',
                'staff': 'staff.html',
                'manager': 'manager.html',
                'finance': 'finance.html'
            };

            // 获取目标页面，默认跳转到 customer
            const targetPage = routes[response.user.role] || 'customer.html';
            window.location.href = targetPage;

        } else {
            alert("Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login Error:", error);
    }
});