/**
 * DASHFLOW - Dashboard Home Module
 * Módulo principal do dashboard com métricas, gráficos e atividades recentes
 * Compatível com sistema modular e preserva todas as funcionalidades existentes
 */

class DashboardHome {
    constructor() {
        this.name = 'dashboard';
        this.title = 'Dashboard';
        this.container = null;
        this.initialized = false;
        
        // Configuração de métricas
        this.metrics = {
            totalUploads: 0,
            totalRecords: 0,
            successRate: 0,
            avgProcessingTime: 0
        };
        
        // Cache de dados
        this.dataCache = new Map();
        this.lastUpdate = null;
        
        // Configuração de gráficos
        this.charts = {};
        this.chartConfigs = {
            uploadsChart: {
                type: 'line',
                element: 'uploads-chart',
                title: 'Uploads por Período'
            },
            recordsChart: {
                type: 'bar',
                element: 'records-chart',
                title: 'Registros Processados'
            },
            performanceChart: {
                type: 'doughnut',
                element: 'performance-chart',
                title: 'Performance Geral'
            }
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.render = this.render.bind(this);
        this.loadData = this.loadData.bind(this);
        this.updateMetrics = this.updateMetrics.bind(this);
        this.onFiltersChanged = this.onFiltersChanged.bind(this);
    }

    /**
     * Inicializa o módulo
     */
    async init() {
        try {
            console.log('[DashboardHome] Inicializando módulo...');
            
            // Verificar dependências
            this.checkDependencies();
            
            // Configurar event listeners específicos do módulo
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('[DashboardHome] Módulo inicializado com sucesso');
            
        } catch (error) {
            console.error('[DashboardHome] Erro na inicialização:', error);
            throw error;
        }
    }

    /**
     * Renderiza o módulo no container
     */
    async render() {
        try {
            if (!this.container) {
                throw new Error('Container não definido para o módulo');
            }

            console.log('[DashboardHome] Renderizando módulo...');
            
            // Criar HTML do módulo
            this.container.innerHTML = this.getModuleHTML();
            
            // Carregar dados
            await this.loadData();
            
            // Renderizar métricas
            this.updateMetrics();
            
            // Renderizar gráficos
            await this.renderCharts();
            
            // Carregar atividades recentes
            await this.loadRecentActivities();
            
            console.log('[DashboardHome] Módulo renderizado com sucesso');
            
        } catch (error) {
            console.error('[DashboardHome] Erro na renderização:', error);
            this.renderError(error);
        }
    }

    /**
     * Retorna o HTML do módulo
     */
    getModuleHTML() {
        return `
            <div class="dashboard-home">
                <div class="module-header">
                    <h2>Dashboard</h2>
                    <div class="last-update">
                        <span id="last-update-time">Carregando...</span>
                    </div>
                </div>

                <!-- Cartões de Métricas -->
                <div class="metrics-section">
                    <div class="metrics-grid">
                        <div class="metric-card" data-metric="uploads">
                            <div class="metric-icon">📁</div>
                            <div class="metric-content">
                                <h3>Total de Uploads</h3>
                                <div class="metric-value" id="total-uploads">0</div>
                                <div class="metric-change" id="uploads-change">+0%</div>
                            </div>
                        </div>

                        <div class="metric-card" data-metric="records">
                            <div class="metric-icon">📊</div>
                            <div class="metric-content">
                                <h3>Registros Processados</h3>
                                <div class="metric-value" id="total-records">0</div>
                                <div class="metric-change" id="records-change">+0%</div>
                            </div>
                        </div>

                        <div class="metric-card" data-metric="success">
                            <div class="metric-icon">✅</div>
                            <div class="metric-content">
                                <h3>Taxa de Sucesso</h3>
                                <div class="metric-value" id="success-rate">0%</div>
                                <div class="metric-change" id="success-change">+0%</div>
                            </div>
                        </div>

                        <div class="metric-card" data-metric="performance">
                            <div class="metric-icon">⚡</div>
                            <div class="metric-content">
                                <h3>Tempo Médio</h3>
                                <div class="metric-value" id="avg-time">0s</div>
                                <div class="metric-change" id="time-change">+0%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção de Gráficos -->
                <div class="charts-section">
                    <div class="charts-grid">
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Uploads por Período</h3>
                                <div class="chart-controls">
                                    <select id="uploads-period" class="chart-period-selector">
                                        <option value="7d">Últimos 7 dias</option>
                                        <option value="30d" selected>Últimos 30 dias</option>
                                        <option value="90d">Últimos 90 dias</option>
                                    </select>
                                </div>
                            </div>
                            <div class="chart-wrapper">
                                <canvas id="uploads-chart"></canvas>
                            </div>
                        </div>

                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Registros por Unidade</h3>
                                <div class="chart-controls">
                                    <button class="chart-refresh-btn" data-chart="records">🔄</button>
                                </div>
                            </div>
                            <div class="chart-wrapper">
                                <canvas id="records-chart"></canvas>
                            </div>
                        </div>

                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Performance Geral</h3>
                                <div class="chart-legend" id="performance-legend"></div>
                            </div>
                            <div class="chart-wrapper">
                                <canvas id="performance-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Atividades Recentes -->
                <div class="activities-section">
                    <div class="section-header">
                        <h3>Atividades Recentes</h3>
                        <button class="refresh-activities-btn" id="refresh-activities">🔄 Atualizar</button>
                    </div>
                    <div class="activities-list" id="activities-list">
                        <div class="loading-activities">Carregando atividades...</div>
                    </div>
                </div>

                <!-- Ações Rápidas -->
                <div class="quick-actions-section">
                    <h3>Ações Rápidas</h3>
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" data-action="upload">
                            <span class="action-icon">📤</span>
                            <span class="action-text">Novo Upload</span>
                        </button>
                        <button class="quick-action-btn" data-action="export">
                            <span class="action-icon">📋</span>
                            <span class="action-text">Exportar Dados</span>
                        </button>
                        <button class="quick-action-btn" data-action="report">
                            <span class="action-icon">📈</span>
                            <span class="action-text">Gerar Relatório</span>
                        </button>
                        <button class="quick-action-btn" data-action="settings">
                            <span class="action-icon">⚙️</span>
                            <span class="action-text">Configurações</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Carrega dados do servidor
     */
    async loadData() {
        try {
            console.log('[DashboardHome] Carregando dados...');
            
            // Verificar cache
            const currentFilters = window.dashboardCore?.getCurrentFilters();
            const cacheKey = this.generateCacheKey(currentFilters);
            
            if (window.cacheManager) {
                const cachedData = window.cacheManager.getData(cacheKey);
                if (cachedData) {
                    console.log('[DashboardHome] Dados recuperados do cache');
                    this.processData(cachedData);
                    return;
                }
            }

            // Carregar dados do sistema de APIs ou fallback
            let responses;
            if (window.dashboardCore?.apiConfig) {
                console.log('[DashboardHome] Carregando dados das APIs PHP...');
                responses = await Promise.allSettled([
                    window.dashboardCore.apiConfig.getMetrics(currentFilters),
                    window.dashboardCore.apiConfig.getChartData('line', currentFilters),
                    window.dashboardCore.apiConfig.getRecentActivities(10)
                ]);
            } else {
                console.log('[DashboardHome] Carregando dados das APIs de fallback...');
                responses = await Promise.allSettled([
                    this.fetchMetricsData(currentFilters),
                    this.fetchChartsData(currentFilters),
                    this.fetchActivitiesData(currentFilters)
                ]);
            }

            const [metricsResponse, chartsResponse, activitiesResponse] = responses;

            const data = {
                metrics: metricsResponse.status === 'fulfilled' ? metricsResponse.value : null,
                charts: chartsResponse.status === 'fulfilled' ? chartsResponse.value : null,
                activities: activitiesResponse.status === 'fulfilled' ? activitiesResponse.value : null,
                timestamp: Date.now()
            };

            // Armazenar no cache
            if (window.cacheManager) {
                window.cacheManager.cacheData(cacheKey, data);
            }

            this.processData(data);
            
        } catch (error) {
            console.error('[DashboardHome] Erro ao carregar dados:', error);
            this.handleDataError(error);
        }
    }

    /**
     * Busca dados de métricas
     */
    async fetchMetricsData(filters) {
        const params = new URLSearchParams();
        if (filters.dateRange) params.append('date_range', filters.dateRange);
        if (filters.unit) params.append('unit_id', filters.unit);
        if (filters.user) params.append('user_id', filters.user);

        const response = await fetch(`api/metrics.php?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar métricas: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Busca dados dos gráficos
     */
    async fetchChartsData(filters) {
        const params = new URLSearchParams();
        if (filters.dateRange) params.append('date_range', filters.dateRange);
        if (filters.unit) params.append('unit_id', filters.unit);
        if (filters.user) params.append('user_id', filters.user);

        const response = await fetch(`api/charts.php?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados dos gráficos: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Busca dados de atividades
     */
    async fetchActivitiesData(filters) {
        const params = new URLSearchParams();
        params.append('limit', '10');
        if (filters.unit) params.append('unit_id', filters.unit);
        if (filters.user) params.append('user_id', filters.user);

        const response = await fetch(`api/activities.php?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar atividades: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Processa os dados carregados
     */
    processData(data) {
        if (data.metrics) {
            this.metrics = { ...this.metrics, ...data.metrics };
        }

        this.dataCache.set('charts', data.charts);
        this.dataCache.set('activities', data.activities);
        this.lastUpdate = data.timestamp || Date.now();

        // Atualizar timestamp
        this.updateLastUpdateTime();
    }

    /**
     * Atualiza o timestamp da última atualização
     */
    updateLastUpdateTime() {
        const element = document.getElementById('last-update-time');
        if (element && this.lastUpdate) {
            const time = new Date(this.lastUpdate);
            element.textContent = `Atualizado em ${time.toLocaleTimeString('pt-BR')}`;
        }
    }

    /**
     * Atualiza os cartões de métricas
     */
    updateMetrics() {
        try {
            // Total de uploads
            const uploadsElement = document.getElementById('total-uploads');
            if (uploadsElement) {
                uploadsElement.textContent = this.formatNumber(this.metrics.totalUploads);
            }

            // Registros processados
            const recordsElement = document.getElementById('total-records');
            if (recordsElement) {
                recordsElement.textContent = this.formatNumber(this.metrics.totalRecords);
            }

            // Taxa de sucesso
            const successElement = document.getElementById('success-rate');
            if (successElement) {
                successElement.textContent = `${this.metrics.successRate.toFixed(1)}%`;
            }

            // Tempo médio
            const timeElement = document.getElementById('avg-time');
            if (timeElement) {
                timeElement.textContent = `${this.metrics.avgProcessingTime.toFixed(1)}s`;
            }

            // Adicionar animações aos cartões
            this.animateMetricCards();
            
        } catch (error) {
            console.error('[DashboardHome] Erro ao atualizar métricas:', error);
        }
    }

    /**
     * Anima os cartões de métricas
     */
    animateMetricCards() {
        const cards = document.querySelectorAll('.metric-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'fadeInUp 0.5s ease-out forwards';
            }, index * 100);
        });
    }

    /**
     * Renderiza os gráficos
     */
    async renderCharts() {
        try {
            const chartsData = this.dataCache.get('charts');
            if (!chartsData) {
                console.warn('[DashboardHome] Dados dos gráficos não disponíveis');
                return;
            }

            // Verificar se Chart.js está disponível
            if (typeof Chart === 'undefined') {
                console.warn('[DashboardHome] Chart.js não encontrado, carregando...');
                await this.loadChartJS();
            }

            // Renderizar gráfico de uploads
            this.renderUploadsChart(chartsData.uploads);
            
            // Renderizar gráfico de registros
            this.renderRecordsChart(chartsData.records);
            
            // Renderizar gráfico de performance
            this.renderPerformanceChart(chartsData.performance);
            
        } catch (error) {
            console.error('[DashboardHome] Erro ao renderizar gráficos:', error);
        }
    }

    /**
     * Carrega Chart.js dinamicamente se necessário
     */
    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Renderiza gráfico de uploads
     */
    renderUploadsChart(data) {
        const ctx = document.getElementById('uploads-chart');
        if (!ctx || !data) return;

        if (this.charts.uploads) {
            this.charts.uploads.destroy();
        }

        this.charts.uploads = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Uploads',
                    data: data.values,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfico de registros
     */
    renderRecordsChart(data) {
        const ctx = document.getElementById('records-chart');
        if (!ctx || !data) return;

        if (this.charts.records) {
            this.charts.records.destroy();
        }

        this.charts.records = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Registros',
                    data: data.values,
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfico de performance
     */
    renderPerformanceChart(data) {
        const ctx = document.getElementById('performance-chart');
        if (!ctx || !data) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        this.charts.performance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107',
                        '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Carrega atividades recentes
     */
    async loadRecentActivities() {
        try {
            const activitiesData = this.dataCache.get('activities');
            if (!activitiesData) {
                console.warn('[DashboardHome] Dados de atividades não disponíveis');
                return;
            }

            const activitiesList = document.getElementById('activities-list');
            if (!activitiesList) return;

            if (!activitiesData.length) {
                activitiesList.innerHTML = '<div class="no-activities">Nenhuma atividade recente</div>';
                return;
            }

            const activitiesHTML = activitiesData.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                    <div class="activity-content">
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-meta">
                            <span class="activity-user">${activity.user_name}</span>
                            <span class="activity-time">${this.formatRelativeTime(activity.created_at)}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            activitiesList.innerHTML = activitiesHTML;
            
        } catch (error) {
            console.error('[DashboardHome] Erro ao carregar atividades:', error);
        }
    }

    /**
     * Retorna ícone para tipo de atividade
     */
    getActivityIcon(type) {
        const icons = {
            upload: '📤',
            process: '⚙️',
            export: '📋',
            error: '❌',
            success: '✅'
        };
        return icons[type] || '📝';
    }

    /**
     * Formata tempo relativo
     */
    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    }

    /**
     * Configura event listeners específicos do módulo
     */
    setupEventListeners() {
        // Listeners serão configurados após renderização
        document.addEventListener('click', this.handleModuleClick.bind(this));
        document.addEventListener('change', this.handleModuleChange.bind(this));
    }

    /**
     * Manipula cliques no módulo
     */
    handleModuleClick(event) {
        if (!this.container?.contains(event.target)) return;

        // Ações rápidas
        const quickAction = event.target.closest('[data-action]');
        if (quickAction) {
            const action = quickAction.getAttribute('data-action');
            this.handleQuickAction(action);
            return;
        }

        // Refresh de atividades
        if (event.target.id === 'refresh-activities') {
            this.refreshActivities();
            return;
        }

        // Refresh de gráficos
        const chartRefresh = event.target.closest('[data-chart]');
        if (chartRefresh) {
            const chart = chartRefresh.getAttribute('data-chart');
            this.refreshChart(chart);
            return;
        }
    }

    /**
     * Manipula mudanças no módulo
     */
    handleModuleChange(event) {
        if (!this.container?.contains(event.target)) return;

        // Período do gráfico de uploads
        if (event.target.id === 'uploads-period') {
            this.updateUploadsPeriod(event.target.value);
        }
    }

    /**
     * Manipula ações rápidas
     */
    handleQuickAction(action) {
        switch (action) {
            case 'upload':
                // Trigger upload do header
                const uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) uploadBtn.click();
                break;
            case 'export':
                this.exportData();
                break;
            case 'report':
                this.generateReport();
                break;
            case 'settings':
                this.openSettings();
                break;
        }
    }

    /**
     * Exporta dados
     */
    exportData() {
        console.log('[DashboardHome] Exportando dados...');
        // Implementar lógica de exportação
    }

    /**
     * Gera relatório
     */
    generateReport() {
        console.log('[DashboardHome] Gerando relatório...');
        // Implementar lógica de relatório
    }

    /**
     * Abre configurações
     */
    openSettings() {
        console.log('[DashboardHome] Abrindo configurações...');
        // Implementar lógica de configurações
    }

    /**
     * Atualiza atividades
     */
    async refreshActivities() {
        try {
            const currentFilters = window.dashboardCore?.getCurrentFilters();
            const activitiesData = await this.fetchActivitiesData(currentFilters);
            this.dataCache.set('activities', activitiesData);
            await this.loadRecentActivities();
        } catch (error) {
            console.error('[DashboardHome] Erro ao atualizar atividades:', error);
        }
    }

    /**
     * Atualiza gráfico específico
     */
    async refreshChart(chartName) {
        try {
            const currentFilters = window.dashboardCore?.getCurrentFilters();
            const chartsData = await this.fetchChartsData(currentFilters);
            this.dataCache.set('charts', chartsData);
            
            switch (chartName) {
                case 'records':
                    this.renderRecordsChart(chartsData.records);
                    break;
                // Adicionar outros gráficos conforme necessário
            }
        } catch (error) {
            console.error(`[DashboardHome] Erro ao atualizar gráfico ${chartName}:`, error);
        }
    }

    /**
     * Atualiza período do gráfico de uploads
     */
    async updateUploadsPeriod(period) {
        try {
            const currentFilters = window.dashboardCore?.getCurrentFilters();
            currentFilters.period = period;
            
            const chartsData = await this.fetchChartsData(currentFilters);
            this.renderUploadsChart(chartsData.uploads);
        } catch (error) {
            console.error('[DashboardHome] Erro ao atualizar período:', error);
        }
    }

    /**
     * Callback chamado quando filtros mudam
     */
    async onFiltersChanged(filters) {
        console.log('[DashboardHome] Filtros alterados:', filters);
        await this.loadData();
        this.updateMetrics();
        await this.renderCharts();
        await this.loadRecentActivities();
    }

    /**
     * Callback chamado quando dados são carregados
     */
    onDataUploaded(uploadData) {
        console.log('[DashboardHome] Novos dados carregados:', uploadData);
        // Recarregar dados para refletir o upload
        setTimeout(() => {
            this.loadData();
        }, 1000);
    }

    /**
     * Callback chamado quando módulo é ativado
     */
    async onActivate() {
        console.log('[DashboardHome] Módulo ativado');
        // Verificar se dados precisam ser atualizados
        if (!this.lastUpdate || Date.now() - this.lastUpdate > 5 * 60 * 1000) {
            await this.loadData();
        }
    }

    /**
     * Callback chamado quando módulo é desativado
     */
    onDeactivate() {
        console.log('[DashboardHome] Módulo desativado');
        // Limpar timers se houver
    }

    /**
     * Utilitários
     */
    formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    generateCacheKey(filters) {
        return `dashboard-home-${JSON.stringify(filters)}`;
    }

    checkDependencies() {
        if (!window.dashboardCore) {
            throw new Error('DashboardCore não encontrado');
        }
    }

    renderError(error) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="module-error">
                    <h3>Erro no Dashboard</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Recarregar
                    </button>
                </div>
            `;
        }
    }

    handleDataError(error) {
        console.error('[DashboardHome] Erro nos dados:', error);
        // Mostrar dados em cache se disponível
        const lastCachedData = this.dataCache.get('lastGoodData');
        if (lastCachedData) {
            this.processData(lastCachedData);
        }
    }

    /**
     * Cleanup do módulo
     */
    cleanup() {
        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Limpar cache
        this.dataCache.clear();
        
        console.log('[DashboardHome] Módulo limpo');
    }
}

// Tornar disponível globalmente
window.DashboardHome = DashboardHome;
