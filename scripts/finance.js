// 财务系统核心功能

// Add status styles
function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 发票状态样式保持不变 */
        .invoice-draft { background-color: #f3f4f6; color: #374151; }
        .invoice-sent { background-color: #dbeafe; color: #1e40af; }
        .invoice-paid { background-color: #dcfce7; color: #166534; }
        .invoice-overdue { background-color: #fef3c7; color: #92400e; }
        .invoice-cancelled { background-color: #fee2e2; color: #b91c1c; }
        
        /* Modal styles */
        .modal {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* Notes toggle styles */
        .notes-tab {
            padding: 8px 16px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .notes-tab.active {
            background: #8B5A2B;
            color: white;
            border-color: #8B5A2B;
        }
        
        .notes-content {
            display: none;
            min-height: 120px;
        }
        
        .notes-content.active {
            display: block;
        }
        
        .invoice-details-modal {
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        @media print {
            .modal {
                position: static !important;
                background: white !important;
            }
            .modal > div {
                box-shadow: none !important;
                margin: 0 !important;
            }
            .btn-primary, .btn-secondary {
                display: none !important;
            }
            .notes-tabs, .edit-notes-btn {
                display: none !important;
            }
        }
        
        /* 侧边栏高亮样式 */
        .sidebar-link.active {
            background-color: rgba(210, 180, 140, 0.3) !important;
            color: #8B5A2B !important;
            font-weight: 500 !important;
        }
        
        /* 总收入卡片样式 */
        .total-revenue-card {
            background: linear-gradient(135deg, #8B5A2B 0%, #D2B48C 100%);
            color: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 20px rgba(139, 90, 43, 0.2);
            transition: all 0.3s ease;
        }
        
        .total-revenue-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(139, 90, 43, 0.3);
        }
        
        .revenue-trend-up {
            color: #10B981;
        }
        
        .revenue-trend-down {
            color: #EF4444;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* 日期选择器样式 */
        .date-range-selector {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .date-input {
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            background-color: white;
            transition: all 0.3s;
        }
        
        .date-input:focus {
            outline: none;
            border-color: #8B5A2B;
            box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }
        
        /* 修复图表容器样式 */
        .chart-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        /* 确保图表响应式 */
        canvas {
            display: block;
            max-width: 100%;
            height: auto !important;
        }
        
        /* 紧凑日期选择器 */
        .compact-date-selector {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
        }
        
        .compact-date-input {
            padding: 6px 10px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 13px;
            max-width: 120px;
        }
        
        /* 饼图容器样式 - 增加高度让饼图更大 */
        .pie-chart-container {
            position: relative;
            width: 100%;
            height: 380px !important; /* 增加高度，让饼图更大 */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* 饼图画布样式 - 让饼图更大 */
        .pie-chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        @media (max-width: 768px) {
            .compact-date-selector {
                flex-direction: column;
                align-items: stretch;
            }
            
            .compact-date-input {
                max-width: 100%;
            }
            
            .pie-chart-container {
                height: 350px !important; /* 移动端适当调整 */
            }
        }
        
        @media (min-width: 1024px) {
            .pie-chart-container {
                height: 400px !important; /* 桌面端更大 */
            }
        }
    `;
    document.head.appendChild(style);
}

// Global chart instances management
let paymentMethodPieChart = null;
let revenueByDateChart = null;
let purchaseCostByDateChart = null;

// 支付方式数据 - 只保留三种支付方式
const paymentMethodData = {
    distribution: {
        labels: ['Credit Card', 'Third-Party Payment', 'Cash'],
        data: [125000, 85000, 65000],
        colors: ['#774b30', '#a9805b', '#9f5933']
    }
};

// 总收入统计 - 移除不需要的字段
const totalRevenueStats = {
    currentMonth: 86420,
    lastMonth: 82000,
    growth: 5.4
};

// 财务页面切换函数
window.financeSwitchPage = function(pageId) {
    console.log('Finance switchPage called:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error(`Page not found: ${pageId}-page`);
        return;
    }

    // Initialize page content based on pageId
    setTimeout(() => {
        switch (pageId) {
            case 'income-stats':
                console.log('Initializing Financial Overview page...');
                initIncomeStatsCharts();
                break;
                
            case 'invoice':
                console.log('Initializing Invoice Management page...');
                initInvoicePage();
                break;
        }
    }, 50); // 缩短延迟时间
};

// Financial overview charts
function initIncomeStatsCharts() {
    console.log('Initializing financial overview charts...');
    
    // Render total revenue card
    renderTotalRevenueCard();
    
    // Payment method revenue pie chart
    initPaymentMethodPieChart();
    
    // Revenue by date chart - 初始化时显示默认数据
    renderRevenueByDateChart();

    // Purchase cost by date chart - 初始化时显示默认数据
    renderPurchaseCostByDateChart();
}

// 初始化支付方式饼图 - 将图例移到饼图下方，并放大饼图
function initPaymentMethodPieChart() {
    const paymentMethodCtx = document.getElementById('payment-method-pie-chart');
    if (paymentMethodCtx) {
        // 确保canvas元素存在且可以获取上下文
        const ctx = paymentMethodCtx.getContext('2d');
        if (!ctx) {
            console.error('Cannot get 2D context for payment method chart');
            setTimeout(initPaymentMethodPieChart, 100);
            return;
        }
        
        // 销毁现有图表
        if (paymentMethodPieChart) {
            paymentMethodPieChart.destroy();
        }
        
        // 计算饼图大小 - 使用更大的饼图
        const pieChartContainer = document.querySelector('.pie-chart-wrapper');
        const chartHeight = pieChartContainer ? pieChartContainer.clientHeight : 380;
        
        // 饼图半径计算：使用容器高度的85%作为最大可能直径，然后取一半为半径
        const maxRadius = (chartHeight * 0.85) / 2;
        const actualRadius = maxRadius * 0.95; // 调整为95%大小，让饼图更大
        
        // 创建新图表 - 将图例移到饼图下方
        paymentMethodPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: paymentMethodData.distribution.labels,
                datasets: [{
                    data: paymentMethodData.distribution.data,
                    backgroundColor: paymentMethodData.distribution.colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 20, // 增加悬停偏移量
                    hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // 允许调整宽高比
                layout: {
                    padding: {
                        top: 15, // 增加上边距
                        bottom: 50, // 增加下边距，为图例留出空间
                        left: 15, // 增加左边距
                        right: 15 // 增加右边距
                    }
                },
                plugins: {
                    legend: { 
                        position: 'bottom', // 将图例位置改为底部
                        labels: {
                            padding: 25, // 增加图例项之间的间距
                            usePointStyle: true,
                            pointStyle: 'rect', // 使用正方形而不是圆形
                            pointStyleWidth: 22, // 增加正方形宽度
                            pointStyleHeight: 22, // 增加正方形高度
                            font: {
                                size: 13, // 增加字体大小
                                weight: '500'
                            },
                            color: '#374151',
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map(function(label, i) {
                                        return {
                                            text: label, // 只显示支付方式名称
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            hidden: false,
                                            lineCap: 'butt',
                                            lineDash: [],
                                            lineDashOffset: 0,
                                            lineJoin: 'miter',
                                            lineWidth: 1,
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            pointStyle: 'rect',
                                            rotation: 0
                                        };
                                    });
                                }
                                return [];
                            }
                        },
                        align: 'center' // 居中对齐
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        cornerRadius: 6,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '0%', // 完整饼图，不是环形图
                radius: `${Math.min(100, (actualRadius / (chartHeight / 2)) * 100)}%`, // 动态计算半径百分比，最大100%
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 800, // 缩短动画时间
                    easing: 'easeOutQuart'
                }
            }
        });
    } else {
        console.error('Payment method chart canvas not found');
        // 如果canvas元素不存在，等待一段时间再试
        setTimeout(initPaymentMethodPieChart, 100);
    }
}

// Render total revenue card - 移除不需要的部分
function renderTotalRevenueCard() {
    const container = document.getElementById('total-revenue-container');
    if (!container) {
        console.error('Total revenue container not found');
        return;
    }
    
    const growthClass = totalRevenueStats.growth >= 0 ? 'revenue-trend-up' : 'revenue-trend-down';
    const growthIcon = totalRevenueStats.growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    container.innerHTML = `
        <div class="total-revenue-card">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <div class="w-full">
                    <p class="text-white/80 text-sm mb-1">Total Revenue (Current Month)</p>
                    <h3 class="text-3xl font-bold mb-2">¥${totalRevenueStats.currentMonth.toLocaleString()}</h3>
                    <div class="flex items-center gap-2">
                        <span class="${growthClass} text-sm font-medium">
                            <i class="fa ${growthIcon} mr-1"></i>${Math.abs(totalRevenueStats.growth)}%
                        </span>
                        <span class="text-white/70 text-sm">vs last month (¥${totalRevenueStats.lastMonth.toLocaleString()})</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 渲染按日期收入图表（带日期选择器）
function renderRevenueByDateChart() {
    const container = document.getElementById('revenue-by-date-chart-container');
    if (!container) {
        console.error('Revenue by date chart container not found');
        return;
    }
    
    // 获取当前日期和30天前的日期
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // 格式化日期为YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // 默认日期范围：最近30天
    const defaultStartDate = formatDate(thirtyDaysAgo);
    const defaultEndDate = formatDate(today);
    
    // 创建日期选择器和图表容器 - 使用紧凑布局，添加onfocus事件
    container.innerHTML = `
        <div class="flex flex-col mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 class="font-semibold text-lg">Revenue by Date</h3>
                <div class="compact-date-selector">
                    <input type="date" id="revenue-start-date" class="compact-date-input" value="${defaultStartDate}" lang="en" onfocus="this.showPicker()">
                    <span class="text-gray-500 text-sm">to</span>
                    <input type="date" id="revenue-end-date" class="compact-date-input" value="${defaultEndDate}" lang="en" onfocus="this.showPicker()">
                    <button id="update-revenue-chart" class="btn-primary text-sm px-3 py-2">Update</button>
                </div>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="revenue-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;
    
    // 初始化图表
    updateRevenueChart();
    
    // 添加事件监听器 - 使用事件委托避免重复绑定问题
    setTimeout(() => {
        const updateBtn = document.getElementById('update-revenue-chart');
        if (updateBtn) {
            // 移除可能存在的旧监听器
            updateBtn.removeEventListener('click', updateRevenueChart);
            // 添加新监听器
            updateBtn.addEventListener('click', updateRevenueChart);
        }
    }, 100);
}

// 更新收入图表数据
function updateRevenueChart() {
    const startDateInput = document.getElementById('revenue-start-date');
    const endDateInput = document.getElementById('revenue-end-date');
    
    if (!startDateInput || !endDateInput) {
        console.error('Date inputs not found for revenue chart');
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // 验证日期范围
    if (startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }
    
    // 计算日期范围内的数据
    const chartData = generateRevenueDataForDateRange(startDate, endDate);
    
    // 获取图表上下文
    const revenueDateCanvas = document.getElementById('revenue-by-date-chart');
    if (!revenueDateCanvas) {
        console.error('Revenue by date chart canvas not found');
        return;
    }
    
    const ctx = revenueDateCanvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get 2D context for revenue chart');
        return;
    }
    
    // 销毁现有图表
    if (revenueByDateChart) {
        revenueByDateChart.destroy();
    }
    
    // 创建新图表 - 调整配置以压缩高度
    revenueByDateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Daily Revenue',
                data: chartData.data,
                borderColor: '#8B5A2B',
                backgroundColor: 'rgba(139, 90, 43, 0.1)',
                tension: 0.3, // 降低曲线平滑度，让图表更紧凑
                fill: true,
                pointRadius: 2, // 减小点半径
                pointBackgroundColor: '#8B5A2B',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 1,
                pointHoverRadius: 4,
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 允许调整宽高比
            plugins: { 
                legend: { 
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `¥${context.raw.toLocaleString()}`;
                        },
                        title: function(tooltipItems) {
                            // 简化标题显示
                            return tooltipItems[0].label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { 
                        callback: function(value) {
                            if (value >= 10000) {
                                return '¥' + (value/1000).toFixed(0) + 'k';
                            }
                            return '¥' + value.toLocaleString();
                        },
                        padding: 5,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Amount (¥)',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 9
                        },
                        callback: function(value, index) {
                            // 如果数据点太多，只显示部分标签
                            const labels = this.chart.data.labels;
                            if (labels.length > 20) {
                                if (index % Math.ceil(labels.length / 10) === 0) {
                                    return labels[index];
                                }
                                return '';
                            }
                            return labels[index];
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    tension: 0.3 // 降低线条平滑度，让图表更紧凑
                }
            }
        }
    });
}

// 渲染按日期进货成本图表（带日期选择器）- 修复：确保正确初始化
function renderPurchaseCostByDateChart() {
    const container = document.getElementById('purchase-cost-by-date-chart-container');
    if (!container) {
        console.error('Purchase cost by date chart container not found');
        return;
    }
    
    // 获取当前日期和30天前的日期
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // 格式化日期为YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // 默认日期范围：最近30天
    const defaultStartDate = formatDate(thirtyDaysAgo);
    const defaultEndDate = formatDate(today);
    
    // 创建日期选择器和图表容器 - 使用紧凑布局，添加onfocus事件
    container.innerHTML = `
        <div class="flex flex-col mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 class="font-semibold text-lg">Purchase Cost by Date</h3>
                <div class="compact-date-selector">
                    <input type="date" id="purchase-cost-start-date" class="compact-date-input" value="${defaultStartDate}" lang="en" onfocus="this.showPicker()">
                    <span class="text-gray-500 text-sm">to</span>
                    <input type="date" id="purchase-cost-end-date" class="compact-date-input" value="${defaultEndDate}" lang="en" onfocus="this.showPicker()">
                    <button id="update-purchase-cost-chart" class="btn-primary text-sm px-3 py-2">Update</button>
                </div>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="purchase-cost-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;
    
    // 初始化图表
    initPurchaseCostChart();
    
    // 添加事件监听器 - 使用事件委托避免重复绑定问题
    setTimeout(() => {
        const updateBtn = document.getElementById('update-purchase-cost-chart');
        if (updateBtn) {
            // 移除可能存在的旧监听器
            updateBtn.removeEventListener('click', updatePurchaseCostChart);
            // 添加新监听器
            updateBtn.addEventListener('click', updatePurchaseCostChart);
        }
    }, 100);
}

// 初始化进货成本图表 - 修复：单独的函数来初始化图表
function initPurchaseCostChart() {
    const startDateInput = document.getElementById('purchase-cost-start-date');
    const endDateInput = document.getElementById('purchase-cost-end-date');
    
    if (!startDateInput || !endDateInput) {
        console.error('Date inputs not found for purchase cost chart');
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // 验证日期范围
    if (startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }
    
    // 计算日期范围内的数据
    const chartData = generatePurchaseCostDataForDateRange(startDate, endDate);
    
    // 获取图表上下文
    const purchaseCostCanvas = document.getElementById('purchase-cost-by-date-chart');
    if (!purchaseCostCanvas) {
        console.error('Purchase cost by date chart canvas not found');
        return;
    }
    
    const ctx = purchaseCostCanvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get 2D context for purchase cost chart');
        return;
    }
    
    // 销毁现有图表
    if (purchaseCostByDateChart) {
        purchaseCostByDateChart.destroy();
    }
    
    // 创建新图表 - 调整配置以压缩高度
    purchaseCostByDateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Daily Purchase Cost',
                data: chartData.data,
                backgroundColor: 'rgba(74, 85, 104, 0.8)',
                borderColor: 'rgba(74, 85, 104, 1)',
                borderWidth: 1,
                borderRadius: 2,
                hoverBackgroundColor: 'rgba(74, 85, 104, 1)',
                barPercentage: 0.6, // 减小条形宽度
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 允许调整宽高比
            plugins: { 
                legend: { 
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `¥${context.raw.toLocaleString()}`;
                        },
                        title: function(tooltipItems) {
                            // 简化标题显示
                            return tooltipItems[0].label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        callback: function(value) {
                            if (value >= 10000) {
                                return '¥' + (value/1000).toFixed(0) + 'k';
                            }
                            return '¥' + value.toLocaleString();
                        },
                        padding: 5,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Purchase Cost (¥)',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 9
                        },
                        callback: function(value, index) {
                            // 如果数据点太多，只显示部分标签
                            const labels = this.chart.data.labels;
                            if (labels.length > 20) {
                                if (index % Math.ceil(labels.length / 10) === 0) {
                                    return labels[index];
                                }
                                return '';
                            }
                            return labels[index];
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 更新进货成本图表数据 - 修复：修复事件监听问题
function updatePurchaseCostChart() {
    const startDateInput = document.getElementById('purchase-cost-start-date');
    const endDateInput = document.getElementById('purchase-cost-end-date');
    
    if (!startDateInput || !endDateInput) {
        console.error('Date inputs not found for purchase cost chart');
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // 验证日期范围
    if (startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }
    
    // 计算日期范围内的数据
    const chartData = generatePurchaseCostDataForDateRange(startDate, endDate);
    
    // 获取图表上下文
    const purchaseCostCanvas = document.getElementById('purchase-cost-by-date-chart');
    if (!purchaseCostCanvas) {
        console.error('Purchase cost by date chart canvas not found');
        return;
    }
    
    const ctx = purchaseCostCanvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get 2D context for purchase cost chart');
        return;
    }
    
    // 销毁现有图表
    if (purchaseCostByDateChart) {
        purchaseCostByDateChart.destroy();
    }
    
    // 创建新图表 - 调整配置以压缩高度
    purchaseCostByDateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Daily Purchase Cost',
                data: chartData.data,
                backgroundColor: 'rgba(74, 85, 104, 0.8)',
                borderColor: 'rgba(74, 85, 104, 1)',
                borderWidth: 1,
                borderRadius: 2,
                hoverBackgroundColor: 'rgba(74, 85, 104, 1)',
                barPercentage: 0.6, // 减小条形宽度
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 允许调整宽高比
            plugins: { 
                legend: { 
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `¥${context.raw.toLocaleString()}`;
                        },
                        title: function(tooltipItems) {
                            // 简化标题显示
                            return tooltipItems[0].label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        callback: function(value) {
                            if (value >= 10000) {
                                return '¥' + (value/1000).toFixed(0) + 'k';
                            }
                            return '¥' + value.toLocaleString();
                        },
                        padding: 5,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Purchase Cost (¥)',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 9
                        },
                        callback: function(value, index) {
                            // 如果数据点太多，只显示部分标签
                            const labels = this.chart.data.labels;
                            if (labels.length > 20) {
                                if (index % Math.ceil(labels.length / 10) === 0) {
                                    return labels[index];
                                }
                                return '';
                            }
                            return labels[index];
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 为日期范围生成模拟的收入数据
function generateRevenueDataForDateRange(startDate, endDate) {
    const labels = [];
    const data = [];
    
    // 计算日期范围内的天数
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // 如果天数太多，使用每周数据而不是每日数据
    const useWeekly = daysDiff > 60;
    const interval = useWeekly ? 7 : 1;
    
    // 生成日期范围内的数据
    let i = 0;
    while (i <= daysDiff) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // 添加日期标签
        let formattedDate;
        if (useWeekly) {
            // 如果是每周数据，显示周数
            const weekNum = Math.floor(i / 7) + 1;
            formattedDate = `Week ${weekNum}`;
        } else {
            // 每日数据，简化日期显示
            formattedDate = currentDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
        
        labels.push(formattedDate);
        
        // 生成模拟收入数据
        const baseRevenue = 8000 + Math.random() * 4000;
        const trendFactor = 1 + (i / daysDiff) * 0.5; // 趋势增长
        
        let dailyRevenue;
        if (useWeekly) {
            // 每周数据是7天的总和
            let weeklySum = 0;
            for (let j = 0; j < 7 && (i + j) <= daysDiff; j++) {
                weeklySum += Math.floor(baseRevenue * trendFactor + Math.random() * 2000 - 1000);
            }
            dailyRevenue = weeklySum;
        } else {
            dailyRevenue = Math.floor(baseRevenue * trendFactor + Math.random() * 2000 - 1000);
        }
        
        data.push(dailyRevenue);
        
        i += interval;
    }
    
    return { labels, data };
}

// 为日期范围生成模拟的进货成本数据
function generatePurchaseCostDataForDateRange(startDate, endDate) {
    const labels = [];
    const data = [];
    
    // 计算日期范围内的天数
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // 如果天数太多，使用每周数据而不是每日数据
    const useWeekly = daysDiff > 60;
    const interval = useWeekly ? 7 : 1;
    
    // 生成日期范围内的数据
    let i = 0;
    while (i <= daysDiff) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // 添加日期标签
        let formattedDate;
        if (useWeekly) {
            // 如果是每周数据，显示周数
            const weekNum = Math.floor(i / 7) + 1;
            formattedDate = `Week ${weekNum}`;
        } else {
            // 每日数据，简化日期显示
            formattedDate = currentDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
        
        labels.push(formattedDate);
        
        // 生成模拟进货成本数据
        const baseCost = 5000 + Math.random() * 3000;
        const trendFactor = 1 + (i / daysDiff) * 0.3; // 趋势增长较平缓
        
        let dailyCost;
        if (useWeekly) {
            // 每周数据是7天的总和
            let weeklySum = 0;
            for (let j = 0; j < 7 && (i + j) <= daysDiff; j++) {
                weeklySum += Math.floor(baseCost * trendFactor + Math.random() * 1500 - 750);
            }
            dailyCost = weeklySum;
        } else {
            dailyCost = Math.floor(baseCost * trendFactor + Math.random() * 1500 - 750);
        }
        
        data.push(dailyCost);
        
        i += interval;
    }
    
    return { labels, data };
}

// Invoice management functionality - 保持不变
function initInvoicePage() {
    console.log('Initializing Invoice page...');
    renderInvoiceList();
    initInvoiceFilters();
}

// Render invoice list - 保持不变
function renderInvoiceList(invoices = Object.values(invoiceData)) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;

    container.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceNo = invoice.invoiceNo;

        let statusClass = '';
        let statusText = '';
        switch (invoice.status) {
            case 'draft': 
                statusClass = 'invoice-draft'; 
                statusText = 'Draft';
                break;
            case 'sent': 
                statusClass = 'invoice-sent'; 
                statusText = 'Sent';
                break;
            case 'paid': 
                statusClass = 'invoice-paid'; 
                statusText = 'Paid';
                break;
            case 'overdue': 
                statusClass = 'invoice-overdue'; 
                statusText = 'Overdue';
                break;
            case 'cancelled': 
                statusClass = 'invoice-cancelled'; 
                statusText = 'Cancelled';
                break;
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNo}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.staffId}</span>
                    <span class="text-xs text-gray-500">${staffData[invoice.staffId]?.name || 'Unknown'}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${invoice.issueDate}</td>
            <td class="px-4 py-4 text-sm">${invoice.dueDate}</td>
            <td class="px-4 py-4 text-sm font-medium">¥${invoice.amount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${invoice.taxAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">${invoice.updateDate}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 view-invoice" data-invoice="${invoice.invoiceNo}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-invoice" data-invoice="${invoice.invoiceNo}" title="Edit Invoice">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-invoice" data-invoice="${invoice.invoiceNo}" title="Delete Invoice">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    // Update pagination info
    updateInvoicePaginationInfo(invoices.length);
    
    // Add event listeners to buttons
    addInvoiceEventListeners();
}

// Add event listeners to invoice buttons - 保持不变
function addInvoiceEventListeners() {
    // View invoice details
    document.querySelectorAll('.view-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const invoiceNo = button.getAttribute('data-invoice');
            showInvoiceDetails(invoiceNo);
        });
    });
    
    // Edit invoice
    document.querySelectorAll('.edit-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const invoiceNo = button.getAttribute('data-invoice');
            editInvoice(invoiceNo);
        });
    });
    
    // Delete invoice
    document.querySelectorAll('.delete-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const invoiceNo = button.getAttribute('data-invoice');
            deleteInvoice(invoiceNo);
        });
    });
}

// Update invoice pagination info - 保持不变
function updateInvoicePaginationInfo(total) {
    const infoElem = document.getElementById('invoice-pagination-info');
    if (infoElem) {
        infoElem.textContent = `Total: ${total} invoices`;
    }
}

// Initialize invoice filters - 保持不变
function initInvoiceFilters() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const searchBtn = document.getElementById('invoice-search-btn');
    const resetBtn = document.getElementById('invoice-reset-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', filterInvoices);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetInvoiceFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterInvoices);
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', filterInvoices);
    }

    if (staffSelect) {
        staffSelect.addEventListener('change', filterInvoices);
    }

    if (orderInput) {
        orderInput.addEventListener('input', filterInvoices);
    }
}

// Filter invoices - 保持不变
function filterInvoices() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const startDateInput = document.getElementById('invoice-start-date');
    const endDateInput = document.getElementById('invoice-end-date');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const staffFilter = staffSelect ? staffSelect.value : '';
    const orderFilter = orderInput ? orderInput.value.toUpperCase() : '';
    const startDate = startDateInput ? startDateInput.value : '';
    const endDate = endDateInput ? endDateInput.value : '';

    const filteredInvoices = Object.values(invoiceData).filter(invoice => {
        const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm) || 
                             (invoice.customer && invoice.customer.toLowerCase().includes(searchTerm)) ||
                             invoice.orderId.includes(searchTerm);
        const matchesStatus = !statusFilter || invoice.status === statusFilter;
        const matchesStaff = !staffFilter || invoice.staffId === staffFilter;
        const matchesOrder = !orderFilter || invoice.orderId.includes(orderFilter);
        
        // Date filtering
        let matchesDate = true;
        if (startDate || endDate) {
            const invoiceDate = new Date(invoice.issueDate);
            if (startDate) {
                const filterStartDate = new Date(startDate);
                if (invoiceDate < filterStartDate) matchesDate = false;
            }
            if (endDate && matchesDate) {
                const filterEndDate = new Date(endDate);
                if (invoiceDate > filterEndDate) matchesDate = false;
            }
        }
        
        return matchesSearch && matchesStatus && matchesStaff && matchesOrder && matchesDate;
    });

    renderFilteredInvoices(filteredInvoices);
}

// Render filtered invoices - 保持不变
function renderFilteredInvoices(invoices) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;

    container.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceNo = invoice.invoiceNo;

        let statusClass = '';
        let statusText = '';
        switch (invoice.status) {
            case 'draft': 
                statusClass = 'invoice-draft'; 
                statusText = 'Draft';
                break;
            case 'sent': 
                statusClass = 'invoice-sent'; 
                statusText = 'Sent';
                break;
            case 'paid': 
                statusClass = 'invoice-paid'; 
                statusText = 'Paid';
                break;
            case 'overdue': 
                statusClass = 'invoice-overdue'; 
                statusText = 'Overdue';
                break;
            case 'cancelled': 
                statusClass = 'invoice-cancelled'; 
                statusText = 'Cancelled';
                break;
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNo}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.staffId}</span>
                    <span class="text-xs text-gray-500">${staffData[invoice.staffId]?.name || 'Unknown'}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${invoice.issueDate}</td>
            <td class="px-4 py-4 text-sm">${invoice.dueDate}</td>
            <td class="px-4 py-4 text-sm font-medium">¥${invoice.amount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${invoice.taxAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">${invoice.updateDate}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 view-invoice" data-invoice="${invoice.invoiceNo}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-invoice" data-invoice="${invoice.invoiceNo}" title="Edit Invoice">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-invoice" data-invoice="${invoice.invoiceNo}" title="Delete Invoice">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    updateInvoicePaginationInfo(invoices.length);
    addInvoiceEventListeners();
}

// Reset invoice filters - 保持不变
function resetInvoiceFilters() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const startDateInput = document.getElementById('invoice-start-date');
    const endDateInput = document.getElementById('invoice-end-date');
    
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (staffSelect) staffSelect.value = '';
    if (orderInput) orderInput.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    renderInvoiceList();
}

// Show invoice details - 保持不变
function showInvoiceDetails(invoiceNo) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    const staff = staffData[invoice.staffId];
    const order = allOrderData[invoice.orderId];

    const detailsHtml = `
        <div class="bg-white rounded-lg shadow-lg invoice-details-modal">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">Invoice Details</h3>
                        <p class="text-gray-600">Invoice No: ${invoice.invoiceNo}</p>
                    </div>
                    <span class="px-3 py-1 text-sm ${getStatusClass(invoice.status)} rounded-full">
                        ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Invoice Information</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Order ID:</span>
                                    <span class="font-medium">${invoice.orderId}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Staff ID:</span>
                                    <span class="font-medium">${invoice.staffId} (${staff?.name || 'Unknown'})</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Issue Date:</span>
                                    <span class="font-medium">${invoice.issueDate}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Due Date:</span>
                                    <span class="font-medium">${invoice.dueDate}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Last Updated:</span>
                                    <span class="font-medium">${invoice.updateDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Financial Details</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Subtotal:</span>
                                    <span class="font-medium">¥${(invoice.amount - invoice.taxAmount).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Tax (${invoice.taxRate}%):</span>
                                    <span class="font-medium">¥${invoice.taxAmount.toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between border-t pt-2">
                                    <span class="text-gray-500 font-semibold">Total Amount:</span>
                                    <span class="font-bold text-lg">¥${invoice.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${order ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Order Information</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Order Status:</span>
                                <span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-500">Order Date:</span>
                                <span class="ml-2 font-medium">${order.createdDate}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Payment Method:</span>
                                <span class="ml-2 font-medium">${order.paymentMethod}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Customer:</span>
                                <span class="ml-2 font-medium">${invoice.customer}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Invoice Items</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-2 text-sm">${item.description}</td>
                                        <td class="px-4 py-2 text-sm">${item.quantity}</td>
                                        <td class="px-4 py-2 text-sm">¥${item.unitPrice.toLocaleString()}</td>
                                        <td class="px-4 py-2 text-sm font-medium">¥${item.subtotal.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Notes</h4>
                    <div class="notes-tabs flex border-b mb-4">
                        <button class="notes-tab active" data-tab="internal">Internal Notes</button>
                        <button class="notes-tab" data-tab="customer">Customer Notes</button>
                    </div>
                    <div class="notes-content active" id="internal-notes">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700">${invoice.internalNotes}</p>
                            <div class="mt-2 text-xs text-gray-500">
                                Last edited by: ${staffData[invoice.lastEditedBy]?.name || invoice.lastEditedBy} on ${invoice.lastEditDate}
                            </div>
                        </div>
                    </div>
                    <div class="notes-content" id="customer-notes">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-gray-700">${invoice.customerNotes}</p>
                            <div class="mt-2 text-xs text-gray-500">
                                This note will be sent to the customer
                            </div>
                        </div>
                    </div>
                    <button class="edit-notes-btn mt-3 btn-secondary" data-invoice="${invoice.invoiceNo}">
                        <i class="fa fa-edit mr-2"></i>Edit Notes
                    </button>
                </div>

                <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button class="btn-secondary close-invoice-modal">Close</button>
                    <button class="btn-primary print-invoice" data-invoice="${invoice.invoiceNo}">
                        <i class="fa fa-print mr-2"></i>Print Invoice
                    </button>
                </div>
            </div>
        </div>
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal';
    modal.innerHTML = detailsHtml;
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close button
    modal.querySelector('.close-invoice-modal')?.addEventListener('click', () => {
        modal.remove();
    });

    // Notes toggle functionality
    modal.querySelectorAll('.notes-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove all active states
            modal.querySelectorAll('.notes-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.notes-content').forEach(c => c.classList.remove('active'));
            
            // Activate current tab
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            modal.querySelector(`#${tabId}-notes`).classList.add('active');
        });
    });

    // Edit notes functionality
    modal.querySelector('.edit-notes-btn')?.addEventListener('click', () => {
        editInvoiceNotes(invoiceNo, modal);
    });

    // Print functionality
    modal.querySelector('.print-invoice')?.addEventListener('click', () => {
        window.print();
    });
}

// Edit invoice notes - 保持不变
function editInvoiceNotes(invoiceNo, modal) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    const editFormHtml = `
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Edit Invoice Notes</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Internal Notes (Accounting View)</label>
                    <textarea id="edit-internal-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" rows="4">${invoice.internalNotes}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Internal notes for accounting team reference</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Customer Notes (Client View)</label>
                    <textarea id="edit-customer-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" rows="4">${invoice.customerNotes}</textarea>
                    <p class="text-xs text-gray-500 mt-1">This note will be visible to the customer</p>
                </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button class="btn-secondary cancel-edit-notes">Cancel</button>
                <button class="btn-primary save-notes" data-invoice="${invoiceNo}">
                    <i class="fa fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </div>
    `;

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal';
    editModal.innerHTML = editFormHtml;
    document.body.appendChild(editModal);

    // Save notes
    editModal.querySelector('.save-notes').addEventListener('click', () => {
        const internalNotes = document.getElementById('edit-internal-notes').value;
        const customerNotes = document.getElementById('edit-customer-notes').value;
        
        // Update invoice data
        invoiceData[invoiceNo].internalNotes = internalNotes;
        invoiceData[invoiceNo].customerNotes = customerNotes;
        invoiceData[invoiceNo].lastEditedBy = "STAFF-001"; // Current user ID
        invoiceData[invoiceNo].lastEditDate = new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }).replace(',', '');
        
        // Close edit modal
        editModal.remove();
        
        // Close details modal and reopen to refresh content
        modal.remove();
        showInvoiceDetails(invoiceNo);
        
        // Update invoice list
        renderInvoiceList();
    });

    // Cancel button
    editModal.querySelector('.cancel-edit-notes')?.addEventListener('click', () => {
        editModal.remove();
    });

    // Close on background click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.remove();
        }
    });
}

// Get status class - 保持不变
function getStatusClass(status) {
    switch (status) {
        case 'draft': return 'invoice-draft';
        case 'sent': return 'invoice-sent';
        case 'paid': return 'invoice-paid';
        case 'overdue': return 'invoice-overdue';
        case 'cancelled': return 'invoice-cancelled';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Edit invoice - 保持不变
function editInvoice(invoiceNo) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    alert(`Edit Invoice: ${invoice.invoiceNo}\n\nThis would open an edit form with fields for:\n- Order ID: ${invoice.orderId}\n- Staff ID: ${invoice.staffId}\n- Status: ${invoice.status}\n- Issue Date: ${invoice.issueDate}\n- Due Date: ${invoice.dueDate}\n- Amount: ¥${invoice.amount}\n- Tax Amount: ¥${invoice.taxAmount}`);
}

// Delete invoice - 保持不变
function deleteInvoice(invoiceNo) {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) {
        delete invoiceData[invoiceNo];
        alert(`Invoice ${invoiceNo} deleted successfully!`);
        renderInvoiceList();
    }
}

// 全局事件监听器 - 添加创建发票按钮的监听器
document.addEventListener('DOMContentLoaded', () => {
    console.log('Finance page loaded');
    addStatusStyles();
    
    // 设置初始页面
    const currentPage = sessionStorage.getItem('currentPage') || 'income-stats';
    console.log('Setting initial page to:', currentPage);
    
    // 确保收入分布页面是默认显示的
    document.querySelectorAll('.page-content').forEach(page => {
        const pageId = page.id.replace('-page', '');
        if (pageId === currentPage) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });
    
    // 初始化当前页面内容
    setTimeout(() => {
        if (currentPage === 'income-stats') {
            initIncomeStatsCharts();
        } else if (currentPage === 'invoice') {
            initInvoicePage();
        }
    }, 100);
    
    // 延迟设置菜单高亮，确保侧边栏已渲染
    setTimeout(() => {
        if (typeof updateActiveMenu === 'function') {
            updateActiveMenu(currentPage);
        }
    }, 500);
    
    // 添加创建发票按钮的事件监听器
    document.addEventListener('click', (e) => {
        if (e.target.closest('#create-invoice-btn')) {
            alert('Create Invoice: This would open a form to create a new invoice.');
        }
    });
    
    // 添加更新按钮的事件委托监听器
    document.addEventListener('click', (e) => {
        if (e.target.closest('#update-revenue-chart')) {
            updateRevenueChart();
        }
        if (e.target.closest('#update-purchase-cost-chart')) {
            updatePurchaseCostChart();
        }
    });
});
