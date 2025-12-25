// scripts/login.js

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

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

    try {
        const response = await mockLoginAPI({ username, password, role });

        if (response.success) {
            // 存储鉴权信息
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('current_user', JSON.stringify(response.user));

            // 根据角色跳转
            const routes = {
                customer: 'customer.html',
                staff: 'staff.html',
                manager: 'manager.html',
                finance: 'finance.html'
            };
            
            window.location.href = routes[role] || 'customer.html';
        } else {
            alert("Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login Error:", error);
    }
});