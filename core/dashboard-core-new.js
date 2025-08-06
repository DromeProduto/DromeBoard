// DromeBoard - Dashboard Core v2.0
// Sistema principal do dashboard com Design System integrado

class DromeDashboard {
    constructor() {
        this.designSystem = null;
        this.charts = {};
        this.data = {
            users: 0,
            units: 0,
            modules: 3,
            activities: []
        };
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Verificar autenticação
            this.checkAuthentication();
            
            // Inicializar Design System
            this.designSystem = new DromeDesignSystem();
            
            // Configurar interface
            this.setupNavigation();
            this.setupUserMenu();
            this.setupThemeToggle();
            this.setupNotifications();
            
            // Carregar dados
            this.loadDashboardData();
            
            // Inicializar gráficos
            this.initializeCharts();
            
            // Carregar atividades recentes
            this.loadRecentActivities();
            
            // Configurar auto-refresh
            this.setupAutoRefresh();
        });
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userSession = localStorage.getItem('userSession');
        
        if (!isLoggedIn || !userSession) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Atualizar informações do usuário na interface
        const userData = JSON.parse(userSession);
        this.updateUserInfo(userData);
    }

    updateUserInfo(userData) {
        const userNameEl = document.getElementById('user-name');
        const userInitialEl = document.querySelector('#user-menu-btn .drome-rounded-full');
        
        if (userNameEl && userData.name) {
            userNameEl.textContent = userData.name;
        }
        
        if (userInitialEl && userData.name) {
            userInitialEl.textContent = userData.name.charAt(0).toUpperCase();
        }
    }

    setupNavigation() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('drome-hidden');
            });
        }
    }

    setupUserMenu() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('drome-hidden');
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', () => {
                userDropdown.classList.add('drome-hidden');
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            this.designSystem.theme.toggle();
            
            // Atualizar ícone
            const icon = themeToggle.querySelector('i');
            if (document.documentElement.classList.contains('dark')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
            
            // Atualizar gráficos para o novo tema
            this.updateChartsTheme();
        });
    }

    setupNotifications() {
        const notificationsBtn = document.getElementById('notifications-btn');
        
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.showNotificationsPanel();
            });
        }
    }

    showNotificationsPanel() {
        this.designSystem.notifications.show({
            type: 'info',
            title: 'Notificações',
            message: 'Você tem 3 notificações não lidas',
            duration: 4000
        });
    }

    async loadDashboardData() {
        try {
            // Carregar métricas principais
            await Promise.all([
                this.loadUserMetrics(),
                this.loadUnitMetrics(),
                this.loadSystemMetrics()
            ]);
            
            // Atualizar interface
            this.updateMetricsDisplay();
            
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            this.showError('Erro ao carregar dados do dashboard');
        }
    }

    async loadUserMetrics() {
        try {
            const response = await fetch('../api/users.php?action=count');
            const result = await response.json();
            
            if (result.success) {
                this.data.users = result.count || 0;
            }
        } catch (error) {
            console.error('Erro ao carregar métricas de usuários:', error);
        }
    }

    async loadUnitMetrics() {
        try {
            const response = await fetch('../api/units.php?action=count');
            const result = await response.json();
            
            if (result.success) {
                this.data.units = result.count || 0;
            }
        } catch (error) {
            console.error('Erro ao carregar métricas de unidades:', error);
        }
    }

    async loadSystemMetrics() {
        // Simular métricas do sistema
        this.data.systemHealth = 'Ativo';
        this.data.uptime = '99.9%';
        this.data.dailyLogins = Math.floor(Math.random() * 50) + 10;
        this.data.newUsers = Math.floor(Math.random() * 10) + 1;
        this.data.activeAlerts = Math.floor(Math.random() * 5);
    }

    updateMetricsDisplay() {
        // Atualizar cards de métricas
        const totalUsersEl = document.getElementById('total-users');
        const totalUnitsEl = document.getElementById('total-units');
        const activeModulesEl = document.getElementById('active-modules');
        const systemStatusEl = document.getElementById('system-status');
        const dailyLoginsEl = document.getElementById('daily-logins');
        const newUsersEl = document.getElementById('new-users');
        const activeAlertsEl = document.getElementById('active-alerts');
        
        if (totalUsersEl) totalUsersEl.textContent = this.data.users;
        if (totalUnitsEl) totalUnitsEl.textContent = this.data.units;
        if (activeModulesEl) activeModulesEl.textContent = this.data.modules;
        if (systemStatusEl) systemStatusEl.textContent = this.data.systemHealth;
        if (dailyLoginsEl) dailyLoginsEl.textContent = this.data.dailyLogins;
        if (newUsersEl) newUsersEl.textContent = this.data.newUsers;
        if (activeAlertsEl) activeAlertsEl.textContent = this.data.activeAlerts;
    }

    initializeCharts() {
        this.initUserGrowthChart();
        this.initModuleUsageChart();
    }

    initUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;

        const isDark = document.documentElement.classList.contains('dark');
        
        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Novos Usuários',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#ac009e',
                    backgroundColor: 'rgba(172, 0, 158, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: isDark ? '#ffffff' : '#1e293b'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: isDark ? '#ffffff' : '#64748b'
                        },
                        grid: {
                            color: isDark ? '#374151' : '#e2e8f0'
                        }
                    },
                    y: {
                        ticks: {
                            color: isDark ? '#ffffff' : '#64748b'
                        },
                        grid: {
                            color: isDark ? '#374151' : '#e2e8f0'
                        }
                    }
                }
            }
        });
    }

    initModuleUsageChart() {
        const ctx = document.getElementById('moduleUsageChart');
        if (!ctx) return;

        const isDark = document.documentElement.classList.contains('dark');
        
        this.charts.moduleUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Usuários', 'Unidades', 'Resultados', 'Dashboard'],
                datasets: [{
                    data: [30, 25, 20, 25],
                    backgroundColor: [
                        '#ac009e',
                        '#fd24a0',
                        '#70e000',
                        '#00d5ff'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#ffffff' : '#1e293b',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    updateChartsTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#ffffff' : '#1e293b';
        const gridColor = isDark ? '#374151' : '#e2e8f0';
        
        // Atualizar gráfico de crescimento de usuários
        if (this.charts.userGrowth) {
            this.charts.userGrowth.options.plugins.legend.labels.color = textColor;
            this.charts.userGrowth.options.scales.x.ticks.color = textColor;
            this.charts.userGrowth.options.scales.y.ticks.color = textColor;
            this.charts.userGrowth.options.scales.x.grid.color = gridColor;
            this.charts.userGrowth.options.scales.y.grid.color = gridColor;
            this.charts.userGrowth.update();
        }
        
        // Atualizar gráfico de uso de módulos
        if (this.charts.moduleUsage) {
            this.charts.moduleUsage.options.plugins.legend.labels.color = textColor;
            this.charts.moduleUsage.update();
        }
    }

    async loadRecentActivities() {
        try {
            // Simular atividades recentes
            const activities = [
                {
                    id: 1,
                    type: 'user_created',
                    message: 'Novo usuário cadastrado: João Silva',
                    time: '2 minutos atrás',
                    icon: 'fas fa-user-plus',
                    color: 'text-green-600'
                },
                {
                    id: 2,
                    type: 'unit_updated',
                    message: 'Unidade "Filial Centro" foi atualizada',
                    time: '15 minutos atrás',
                    icon: 'fas fa-building',
                    color: 'text-blue-600'
                },
                {
                    id: 3,
                    type: 'report_generated',
                    message: 'Relatório mensal gerado automaticamente',
                    time: '1 hora atrás',
                    icon: 'fas fa-chart-bar',
                    color: 'text-purple-600'
                },
                {
                    id: 4,
                    type: 'user_login',
                    message: 'Maria Santos fez login no sistema',
                    time: '2 horas atrás',
                    icon: 'fas fa-sign-in-alt',
                    color: 'text-gray-600'
                }
            ];
            
            this.renderRecentActivities(activities);
            
        } catch (error) {
            console.error('Erro ao carregar atividades recentes:', error);
        }
    }

    renderRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) return;
        
        container.innerHTML = activities.map(activity => `
            <div class="drome-flex drome-items-start drome-space-x-3 drome-p-3 drome-rounded-lg hover:drome-bg-gray-50 dark:hover:drome-bg-gray-800 drome-transition-colors">
                <div class="drome-flex-shrink-0 drome-mt-1">
                    <i class="${activity.icon} ${activity.color}"></i>
                </div>
                <div class="drome-flex-1 drome-min-w-0">
                    <p class="drome-text-sm drome-text-gray-900 dark:drome-text-white">
                        ${activity.message}
                    </p>
                    <p class="drome-text-xs drome-text-gray-500 dark:drome-text-gray-400 drome-mt-1">
                        ${activity.time}
                    </p>
                </div>
            </div>
        `).join('');
    }

    setupAutoRefresh() {
        // Atualizar dados a cada 5 minutos
        setInterval(() => {
            this.loadDashboardData();
            this.loadRecentActivities();
        }, 5 * 60 * 1000);
    }

    handleLogout() {
        this.designSystem.modal.confirm({
            title: 'Confirmar Logout',
            message: 'Tem certeza que deseja sair do sistema?',
            confirmText: 'Sair',
            cancelText: 'Cancelar',
            onConfirm: () => {
                localStorage.removeItem('userSession');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '../auth/login.html';
            }
        });
    }

    showError(message) {
        this.designSystem.notifications.show({
            type: 'error',
            title: 'Erro',
            message: message,
            duration: 5000
        });
    }

    showSuccess(message) {
        this.designSystem.notifications.show({
            type: 'success',
            title: 'Sucesso',
            message: message,
            duration: 3000
        });
    }
}

// Inicializar o dashboard
new DromeDashboard();
